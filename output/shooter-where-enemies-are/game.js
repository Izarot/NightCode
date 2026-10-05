export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 1280;
    this.height = 720;
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    this.init();
    this.loop();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const scale = Math.min(w / this.width, h / this.height);
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }

  init() {
    this.player = { x: 640, y: 360, r: 8, vel: { x: 0, y: 0 }, angle: 0, cooldown: 0, energy: 100, dash: false, dashTimer: 0, dashCooldown: 0, inkX: 0, inkY: 0, inkTimer: 0 };
    this.projectiles = [];
    this.enemies = [];
    this.puddles = [];
    this.particles = [];
    this.wave = 1;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('highScore') || '0');
    this.lastTime = 0;
    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false };
    this.spawnTimer = 0;
    this.gameOver = false;
    this.bgOffset = 0;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.sounds = { shoot: null, dissolve: null, damage: null, score: null, load: () => { this.sounds.shoot = this.createBeep(200, 0.1, 0.3); this.sounds.dissolve = this.createBeep(400, 0.2, 0.1); this.sounds.damage = this.createBeep(100, 0.3, 0.5); this.sounds.score = this.createBeep(600, 0.15, 0.2); } };
    this.sounds.load();
    this.setupInput();
  }

  createBeep(freq, dur, vol) {
    return () => { const o = this.audioCtx.createOscillator(); const g = this.audioCtx.createGain(); o.connect(g); g.connect(this.audioCtx.destination); o.frequency.value = freq; o.type = 'sine'; g.gain.setValueAtTime(vol, this.audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur); o.start(); o.stop(this.audioCtx.currentTime + dur); };
  }

  setupInput() {
    ['W','A','S','D','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Shift',' '].forEach(k => {
      window.addEventListener('keydown', e => { if(e.key === k) this.keys[k] = true; });
      window.addEventListener('keyup', e => { if(e.key === k) this.keys[k] = false; });
    });
    window.addEventListener('mousemove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (this.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (this.height / rect.height);
    });
    window.addEventListener('mousedown', e => { this.mouse.down = true; });
    window.addEventListener('mouseup', e => { this.mouse.down = false; });
    window.addEventListener('keydown', e => { if(e.key === 'Escape') this.togglePause(); });
  }

  togglePause() { this.paused = !this.paused; }

  loop(timestamp) {
    if(!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 1/60);
    this.lastTime = timestamp;
    this.update(dt);
    this.render();
    requestAnimationFrame(t => this.loop(t));
  }

  update(dt) {
    if(this.paused || this.gameOver) return;
    this.bgOffset += dt * 0.5;
    this.player.inkTimer -= dt;
    if(this.player.inkTimer <= 0) { this.player.inkX = 0; this.player.inkY = 0; }
    this.player.dashCooldown = Math.max(0, this.player.dashCooldown - dt);
    this.player.cooldown = Math.max(0, this.player.cooldown - dt);
    const speed = this.player.dash ? 375 : 250;
    let ax = 0, ay = 0;
    if(this.keys['W'] || this.keys['ArrowUp']) ay -= 1;
    if(this.keys['S'] || this.keys['ArrowDown']) ay += 1;
    if(this.keys['A'] || this.keys['ArrowLeft']) ax -= 1;
    if(this.keys['D'] || this.keys['ArrowRight']) ax += 1;
    if(ax !== 0 || ay !== 0) {
      const len = Math.sqrt(ax*ax + ay*ay);
      ax = ax/len * 30; ay = ay/len * 30;
    }
    this.player.vel.x += ax * dt;
    this.player.vel.y += ay * dt;
    const maxV = speed;
    const vLen = Math.sqrt(this.player.vel.x**2 + this.player.vel.y**2);
    if(vLen > maxV) {
      this.player.vel.x = this.player.vel.x/vLen * maxV;
      this.player.vel.y = this.player.vel.y/vLen * maxV;
    }
    this.player.vel.x *= Math.exp(-12 * dt);
    this.player.vel.y *= Math.exp(-12 * dt);
    this.player.x += this.player.vel.x * dt;
    this.player.y += this.player.vel.y * dt;
    this.player.x = Math.max(20, Math.min(this.width-20, this.player.x));
    this.player.y = Math.max(20, Math.min(this.height-20, this.player.y));
    this.player.angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);
    this.player.energy = Math.min(100, this.player.energy + dt * 8);
    if(this.player.dash) {
      this.player.dashTimer -= dt;
      if(this.player.dashTimer <= 0) this.player.dash = false;
    }
    if(this.mouse.down && this.player.cooldown <= 0) {
      this.fire();
      this.player.cooldown = 0.3;
    }
    if(this.keys['Shift'] && this.player.cooldown <= 0 && this.player.energy >= 20) {
      this.cleanBurst();
      this.player.cooldown = 2;
      this.player.energy -= 20;
    }
    this.spawnTimer -= dt;
    if(this.spawnTimer <= 0) { this.spawnWave(); this.spawnTimer = 45; }
    this.enemies.forEach((e, i) => { e.update(dt); if(e.toRemove) this.enemies.splice(i, 1); });
    this.projectiles.forEach((p, i) => { p.update(dt); if(p.toRemove) this.projectiles.splice(i, 1); });
    this.puddles.forEach((p, i) => { p.update(dt); if(p.toRemove) this.puddles.splice(i, 1); });
    this.particles.forEach((p, i) => { p.update(dt); if(p.life <= 0) this.particles.splice(i, 1); });
    this.checkCollisions();
    this.updateInkTraction();
  }

  fire() {
    const p = { x: this.player.x, y: this.player.y, vx: Math.cos(this.player.angle)*500, vy: Math.sin(this.player.angle)*500, r: 6, life: 1.2, toRemove: false, color: '#ff2d90' };
    this.projectiles.push(p);
    this.sounds.shoot();
  }

  cleanBurst() {
    const cx = this.player.x, cy = this.player.y;
    this.puddles.forEach(p => { if(Math.hypot(p.x-cx, p.y-cy) < 80) { p.alpha = 0; p.toRemove = true; } });
    this.particles.push({ x: cx, y: cy, vx: (Math.random()-0.5)*200, vy: (Math.random()-0.5)*200, r: 3, life: 0.5, alpha: 0.8, color: '#00f5d4' });
    this.sounds.dissolve();
  }

  spawnWave() {
    const count = 3 + Math.floor(this.wave * 0.8);
    for(let i = 0; i < count; i++) {
      const type = Math.random() < 0.3 ? 'blob' : (Math.random() < 0.5 ? 'splash' : 'drip');
      const x = 100 + Math.random() * (this.width - 200);
      const y = 100 + Math.random() * (this.height - 200);
      this.enemies.push({ x, y, r: type === 'drip' ? 6 : (type === 'splash' ? 10 : 16), vx: type === 'splash' ? (Math.random()-0.5)*30 : 0, vy: type === 'splash' ? (Math.random()-0.5)*30 : 0, type, life: 1, maxLife: 1, toRemove: false, alpha: 1, splitting: false });
    }
    this.wave++;
  }

  checkCollisions() {
    this.projectiles.forEach((p, pi)) {
      this.enemies.forEach((e, ei) => {
        if(Math.hypot(p.x-e.x, p.y-e.y) < p.r + e.r) {
          e.life -= 0.5;
          if(e.life <= 0) {
            e.toRemove = true;
            this.score += e.type === 'drip' ? 10 : (e.type === 'splash' ? 25 : 50);
            if(e.type === 'splash' && !e.splitting) { e.splitting = true; this.enemies.push({ x: e.x-5, y: e.y, r: 6, type: 'drip', life: 1, maxLife: 1, toRemove: false, alpha: 1 }); this.enemies.push({ x: e.x+5, y: e.y, r: 6, type: 'drip', life: 1, maxLife: 1, toRemove: false, alpha: 1 }); }
            if(e.type === 'blob') this.puddles.push({ x: e.x, y: e.y, r: 40, alpha: 0.6, life: 5 });
            for(let j = 0; j < 10; j++) this.particles.push({ x: e.x, y: e.y, vx: (Math.random()-0.5)*100, vy: (Math.random()-0.5)*100, r: 2, life: 0.8, alpha: 0.7, color: '#ff2d90' });
            this.sounds.dissolve();
          } else {
            e.alpha = e.life / e.maxLife;
          }
          p.toRemove = true;
        }
      });
      if(p.toRemove) continue;
      this.puddles.forEach((pd, pi) => {
        if(Math.hypot(p.x-pd.x, p.y-pd.y) < p.r + pd.r) {
          pd.alpha -= 0.3;
          if(pd.alpha <= 0) pd.toRemove = true;
          p.toRemove = true;
        }
      });
    }
    this.enemies.forEach(e => {
      if(Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.r + this.player.r) {
        if(!this.player.dash) { this.player.energy = Math.max(0, this.player.energy - 15); this.sounds.damage(); }
      }
    });
  }

  updateInkTraction() {
    const inkCount = 3;
    const fx = Math.floor(this.player.x / 20);
    const fy = Math.floor(this.player.y / 20);
    this.player.inkX += fx; this.player.inkY += fy;
    if(this.player.inkX + this.player.inkY > inkCount) {
      this.player.vel.x *= 0.95; this.player.vel.y *= 0.95;
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for(let i = 0; i < 20; i++) {
      const x = (this.bgOffset + i * 37) % 100;
      const y = (this.bgOffset * 0.7 + i * 13) % 100;
      ctx.fillRect(x*12.8, y*7.2, 2, 2);
    }
    this.puddles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#8b008b';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    this.enemies.forEach(e => {
      ctx.globalAlpha = e.alpha;
      ctx.fillStyle = e.type === 'drip' ? '#ff2d90' : (e.type === 'splash' ? '#00f5d4' : '#ff6b6b');
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
      ctx.fill();
    });
    this.projectiles.forEach(p => {
      ctx.globalAlpha = 0.8;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    });
    this.particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#00f5d4';
    ctx.beginPath(); ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(this.player.x, this.player.y); ctx.lineTo(this.mouse.x, this.mouse.y);
    ctx.stroke();
    this.renderHUD();
    if(this.gameOver) this.renderGameOver();
    if(this.paused) this.renderPause();
  }

  renderHUD() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, this.width, 50);
    ctx.fillRect(this.width-220, 0, 220, 50);
    ctx.fillStyle = '#00f5d4';
    ctx.font = '32px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText(this.score, this.width/2, 35);
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '14px Orbitron';
    ctx.fillText('Wave: ' + Math.min(this.wave, 12), this.width-180, 30);
    ctx.fillStyle = 'rgba(255,45,144,0.8)';
    ctx.fillRect(20, 20, 200, 12);
    ctx.fillStyle = '#111';
    ctx.fillRect(20, 20, 200, 12);
    ctx.fillStyle = '#ff2d90';
    ctx.fillRect(20, 20, 200 * (this.player.energy/100), 12);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Orbitron';
    ctx.textAlign = 'left';
    ctx.fillText('High: ' + this.highScore, 20, 40);
  }

  renderGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#00f5d4';
    ctx.font = '48px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', this.width/2, this.height/2);
    ctx.font = '24px Orbitron';
    ctx.fillText('Score: ' + this.score, this.width/2, this.height/2 + 50);
    ctx.fillText('Press R to Restart', this.width/2, this.height/2 + 90);
  }

  renderPause() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '36px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', this.width/2, this.height/2);
  }
}
