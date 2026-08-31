import { Ship } from '../entities/ship.js';
import { Formation } from './formation.js';
import { Shield } from '../entities/shield.js';
import { Particle } from '../entities/particles.js';
import { Starfield } from '../entities/starfield.js';
import { Input } from './input.js';
import { Audio } from './audio.js';

const STATES = { MENU:0, PLAYING:1, PAUSED:2, GAMEOVER:3, WIN:4 };
export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.audio = new Audio();
    this.w = canvas.width; this.h = canvas.height;
    this.stars = new Starfield(this.w, this.h);
    this.particles = [];
    this.bullets = [];
    this.state = STATES.MENU;
    this.score = 0;
    this.wave = 1;
    this.time = 0;
    this.runT = 0;
    this.high = parseInt(localStorage.getItem('starward_hi')||'0',10);
    this.shieldSelect = 0;
    this.reset();
  }
  reset() {
    this.ship = new Ship(this.w, this.h);
    this.formation = new Formation(this.w, this.h, this.wave);
    this.shields = [
      new Shield(this.w/2 - 150, this.h - 120, 80, 30),
      new Shield(this.w/2 - 40, this.h - 120, 80, 30),
      new Shield(this.w/2 + 70, this.h - 120, 80, 30)
    ];
    this.bullets = []; this.particles = [];
  }
  resize() {
    const r = Math.min(window.innerWidth/this.w, window.innerHeight/this.h);
    this.canvas.style.width = (this.w*r)+'px';
    this.canvas.style.height = (this.h*r)+'px';
  }
  start() {
    this.resize();
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last)/1000);
      last = now;
      this.update(dt);
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  spawnExplosion(x, y, n=14, c='#ffae00') {
    for (let i=0; i<n; i++) this.particles.push(new Particle(x, y, c));
  }
  hit(b, entity, isCircle, r) {
    if (isCircle) {
      const dx = b.x - entity.x, dy = b.y - entity.y;
      return dx*dx + dy*dy < r*r;
    }
    return b.x > entity.x && b.x < entity.x + entity.w &&
           b.y > entity.y && b.y < entity.y + entity.h;
  }
  update(dt) {
    this.stars.update();
    this.particles = this.particles.filter(p => p.update(dt));
    this.input.sample();
    if (this.input.keys['KeyP'] && this.lastP) this.togglePause();
    this.lastP = this.input.keys['KeyP'];
    if (this.state !== STATES.PLAYING) return;
    this.time += dt; this.runT += dt;
    if (this.input.left && !this.input.right) this.shieldSelect = (this.shieldSelect + 2) % 3;
    if (this.input.right && !this.input.left) this.shieldSelect = (this.shieldSelect + 1) % 3;
    if (this.input.repair && this.shields[this.shieldSelect].repair()) this.audio.beep(660, 0.1, 'sine', 0.06);
    this.ship.update(this.input, dt, this.particles, this.bullets);
    if (this.input.fire && this.ship.cool > 0.18) this.audio.shoot();
    if (this.input.bomb && this.ship.bombs>0 && this.ship.bombCool <= 0.01) this.audio.bomb();
    if (this.ship.lives < 0 || this.ship.hp <= 0) this.endGame();
    this.formation.update(dt, this.bullets, this.ship);
    for (const b of this.bullets) {
      b.x += b.vx || 0; b.y += b.vy || -12;
    }
    this.bullets = this.bullets.filter(b => b.y > -20 && b.y < this.h + 20 && b.x > -20 && b.x < this.w + 20);
    this.collisions();
    for (const s of this.shields) s.update(dt);
    if (this.formation.alive().length === 0) this.nextWave();
    const b = this.formation.bounds();
    if (b.maxY > this.h - 140) this.endGame();
    if (this.ship.lives < 0 || this.ship.hp <= 0) this.endGame();
    if (this.wave >= 6 && this.formation.alive().length === 0) {
      this.state = STATES.WIN;
      this.saveHigh();
    }
  }
  collisions() {
    const bullets = this.bullets;
    for (let i = bullets.length-1; i>=0; i--) {
      const b = bullets[i];
      if (b.bomb && !b.hit) continue;
      if (b.bomb && b.hit) { bullets.splice(i,1); continue; }
      let hit = false;
      if (b.friend) {
        for (const inv of this.formation.list) {
          if (inv.expl > 0) continue;
          if (this.hit(b, inv, true, 18)) {
            inv.expl = 0.01;
            this.score += inv.pts;
            this.spawnExplosion(inv.x, inv.y, 12, '#ffae00');
            this.audio.boom();
            hit = true; break;
          }
        }
      } else {
        if (this.hit(b, this.ship, true, 20)) {
          const over = this.ship.hit(b.dmg);
          this.spawnExplosion(b.x, b.y, 6, '#2bf0ff');
          this.audio.hit();
          if (over > 0) this.ship.hp = Math.max(0, this.ship.hp - over);
          hit = true;
        }
        if (!hit) {
          for (const s of this.shields) {
            if (s.hp > 0 && this.hit(b, s, false)) {
              s.hit(b.dmg);
              this.spawnExplosion(b.x, b.y, 4, '#6e2bff');
              hit = true; break;
            }
          }
        }
        if (!hit && b.y > this.h - 30) {
          this.ship.hp = Math.max(0, this.ship.hp - b.dmg);
          this.audio.hit();
          hit = true;
        }
      }
      if (b.bomb && !b.hit && b.y < this.h - 100) {
        for (const inv of this.formation.list) {
          if (inv.expl === 0 && Math.hypot(inv.x-b.x, inv.y-b.y) < 60) {
            inv.expl = 0.01;
            this.score += inv.pts;
            this.spawnExplosion(inv.x, inv.y, 8, '#ff2bd6');
          }
        }
        this.spawnExplosion(b.x, b.y, 16, '#ff2bd6');
        this.audio.boom();
        b.hit = true;
        hit = true;
      }
      if (hit) bullets.splice(i,1);
    }
  }
  nextWave() {
    this.wave++;
    if (this.wave >= 5) this.ship.bombs = 3;
    this.formation = new Formation(this.w, this.h, this.wave);
    this.bullets = [];
    this.saveHigh();
    this.audio.beep(880, 0.15, 'sine', 0.06);
  }
  endGame() {
    this.state = STATES.GAMEOVER;
    this.saveHigh();
    this.audio.beep(120, 0.5, 'sawtooth', 0.1);
  }
  saveHigh() {
    if (this.score > this.high) {
      this.high = this.score;
      localStorage.setItem('starward_hi', String(this.high));
    }
  }
  togglePause() {
    if (this.state === STATES.PLAYING) this.state = STATES.PAUSED;
    else if (this.state === STATES.PAUSED) this.state = STATES.PLAYING;
    this.audio.ui();
  }
  click(x, y) {
    if (this.state === STATES.MENU) { this.state = STATES.PLAYING; this.audio.ui(); }
    else if (this.state === STATES.GAMEOVER || this.state === STATES.WIN) {
      this.score = 0; this.wave = 1; this.runT = 0;
      this.ship = new Ship(this.w, this.h);
      this.reset();
      this.state = STATES.PLAYING;
      this.audio.ui();
    }
  }
  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#06041a';
    ctx.fillRect(0,0,this.w,this.h);
    this.stars.draw(ctx);
    if (this.state === STATES.MENU) return this.drawMenu();
    if (this.state === STATES.PAUSED) { this.drawScene(); return this.drawPause(); }
    if (this.state === STATES.GAMEOVER) { this.drawScene(); return this.drawGO(); }
    if (this.state === STATES.WIN) { this.drawScene(); return this.drawWin(); }
    this.drawScene();
    this.drawHUD();
  }
  drawScene() {
    this.formation.draw(this.ctx);
    for (const s of this.shields) s.draw(this.ctx);
    for (const b of this.bullets) {
      this.ctx.fillStyle = b.color;
      if (b.bomb) {
        this.ctx.beginPath(); this.ctx.arc(b.x, b.y, 5, 0, Math.PI*2); this.ctx.fill();
      } else {
        this.ctx.fillRect(b.x-1, b.y-8, 2, 16);
      }
    }
    this.ship.draw(this.ctx);
    for (const p of this.particles) p.draw(this.ctx);
    this.ctx.strokeStyle = '#ff2bd6';
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = '#ff2bd6';
    this.ctx.shadowBlur = 10;
    const sel = this.shields[this.shieldSelect];
    if (sel && sel.hp > 0) this.ctx.strokeRect(sel.x-2, sel.y-2, sel.w+4, sel.h+4);
    this.ctx.shadowBlur = 0;
  }
  drawHUD() {
    const ctx = this.ctx;
    ctx.fillStyle = '#2bf0ff';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: '+this.score, 20, 40);
    ctx.fillStyle = '#ffae00';
    ctx.font = '18px monospace';
    ctx.fillText('HI: '+this.high, 20, 65);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '20px monospace';
    ctx.fillText('LIVES ×'+Math.max(0,this.ship.lives), this.w/2, 35);
    ctx.fillStyle = '#6e2bff';
    ctx.fillText('WAVE '+this.wave+'/5', this.w/2, 60);
    const bx = this.w - 220, by = 20;
    ctx.fillStyle = '#222';
    ctx.fillRect(bx, by, 200, 20);
    const pct = this.ship.shield / 100;
    const g = ctx.createLinearGradient(bx,0,bx+200,0);
    g.addColorStop(0,'#2bf0ff'); g.addColorStop(0.5,'#ffae00'); g.addColorStop(1,'#ff2bd6');
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, 200*pct, 20);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(bx, by, 200, 20);
    ctx.fillStyle = '#fff'; ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('SHIELD', this.w-20, by+15);
    ctx.textAlign = 'left';
    const hbx = this.w/2 - 100, hby = this.h - 18;
    ctx.fillStyle = '#330033';
    ctx.fillRect(hbx, hby, 200, 10);
    const hpct = Math.max(0, this.ship.hp)/100;
    ctx.fillStyle = hpct > 0.4 ? '#2bf0ff' : '#ff2bd6';
    ctx.fillRect(hbx, hby, 200*hpct, 10);
    if (this.ship.bombs > 0) {
      ctx.fillStyle = '#ff2bd6';
      ctx.textAlign = 'left';
      ctx.fillText('💣×'+this.ship.bombs+' [X]', 20, this.h-15);
    }
  }
  drawMenu() {
    const ctx = this.ctx;
    ctx.fillStyle = '#6e2bff';
    ctx.font = 'bold 72px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff2bd6'; ctx.shadowBlur = 20;
    ctx.fillText('STARWARD', this.w/2, this.h/2 - 80);
    ctx.fillText('INVADERS', this.w/2, this.h/2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#2bf0ff';
    ctx.font = '22px monospace';
    ctx.fillText('A NEON DEFENSE ODYSSEY', this.w/2, this.h/2 + 50);
    ctx.fillStyle = '#ffae00';
    ctx.font = '18px monospace';
    ctx.fillText('HI: '+this.high, this.w/2, this.h/2 + 90);
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    const blink = Math.floor(this.time*2)%2;
    if (blink) ctx.fillText('CLICK TO LAUNCH', this.w/2, this.h/2 + 140);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#b08aff';
    ctx.fillText('←/→ MOVE   SPACE FIRE   X BOMB   R REPAIR   P PAUSE', this.w/2, this.h/2 + 200);
    canvas.addEventListener('click', () => this.click(), { once:true });
  }
  drawPause() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(6,4,26,0.7)';
    ctx.fillRect(0,0,this.w,this.h);
    ctx.fillStyle = '#ff2bd6';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', this.w/2, this.h/2);
    ctx.fillStyle = '#fff'; ctx.font = '20px monospace';
    ctx.fillText('PRESS P TO RESUME', this.w/2, this.h/2 + 50);
  }
  drawGO() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(6,4,26,0.75)';
    ctx.fillRect(0,0,this.w,this.h);
    ctx.fillStyle = '#ff2bd6';
    ctx.font = 'bold 72px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff2bd6'; ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', this.w/2, this.h/2 - 40);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#2bf0ff';
    ctx.font = '28px monospace';
    ctx.fillText('SCORE: '+this.score, this.w/2, this.h/2 + 20);
    ctx.fillStyle = '#ffae00';
    ctx.fillText('HI: '+this.high, this.w/2, this.h/2 + 55);
    ctx.fillStyle = '#fff'; ctx.font = '18px monospace';
    ctx.fillText('CLICK TO RESTART', this.w/2, this.h/2 + 110);
    canvas.addEventListener('click', () => this.click(), { once:true });
  }
  drawWin() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(6,4,26,0.75)';
    ctx.fillRect(0,0,this.w,this.h);
    ctx.fillStyle = '#2bf0ff';
    ctx.font = 'bold 72px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#2bf0ff'; ctx.shadowBlur = 20;
    ctx.fillText('VICTORY!', this.w/2, this.h/2 - 40);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff2bd6';
    ctx.font = '24px monospace';
    ctx.fillText('THE GALAXY IS SAFE', this.w/2, this.h/2 + 10);
    ctx.fillStyle = '#ffae00';
    ctx.fillText('FINAL: '+this.score, this.w/2, this.h/2 + 50);
    ctx.fillStyle = '#fff'; ctx.font = '18px monospace';
    ctx.fillText('CLICK TO PLAY AGAIN', this.w/2, this.h/2 + 110);
    canvas.addEventListener('click', () => this.click(), { once:true });
  }
}
