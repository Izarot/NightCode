import { Particle } from './particles.js';
const COL = ['#2bf0ff','#ff2bd6','#6e2bff'];
export class Ship {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.r = 20; this.size = 48;
    this.x = w/2; this.y = h - 80;
    this.vx = 0; this.vy = 0;
    this.lives = 3;
    this.shield = 100;
    this.cool = 0;
    this.bombCool = 0;
    this.bombs = 0;
    this.thrust = 0;
    this.frame = 0;
  }
  reset(w, h) {
    this.x = w/2; this.y = h - 80; this.vx = 0; this.vy = 0;
    this.shield = 100;
  }
  update(input, dt, particles, bullets) {
    this.frame = (this.frame + 0.15) % 4;
    this.thrust *= 0.85;
    if (input.left) this.vx -= 0.5;
    if (input.right) this.vx += 0.5;
    this.vx *= 0.8;
    if (this.vx > 6) this.vx = 6;
    if (this.vx < -6) this.vx = -6;
    this.x += this.vx;
    if (this.x < this.r) { this.x = this.r; this.vx = 0; }
    if (this.x > this.w - this.r) { this.x = this.w - this.r; this.vx = 0; }
    if (this.cool > 0) this.cool -= dt;
    if (this.bombCool > 0) this.bombCool -= dt;
    if (this.shield < 100) this.shield = Math.min(100, this.shield + 5 * dt);
    if (input.fire && this.cool <= 0) {
      bullets.push({ x:this.x, y:this.y-20, vy:-12, dmg:1, color:'#2bf0ff', friend:true });
      this.cool = 0.2;
    }
    if (input.bomb && this.bombs > 0 && this.bombCool <= 0) {
      bullets.push({ x:this.x, y:this.y-20, vy:-10, dmg:3, color:'#ff2bd6', friend:true, bomb:true, r:3 });
      this.bombs--; this.bombCool = 0.5;
    }
    if (Math.abs(this.vx) > 0.5) {
      particles.push(new Particle(this.x, this.y+18, '#6e2bff'));
    }
  }
  hit(dmg) {
    if (this.shield >= dmg) { this.shield -= dmg; return false; }
    const left = dmg - this.shield;
    this.shield = 0;
    this.lives -= 1;
    return left;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const lean = this.vx * 0.04;
    ctx.rotate(lean);
    const c = COL[Math.floor(this.frame)] || COL[0];
    ctx.fillStyle = '#1a1a3a';
    ctx.beginPath();
    ctx.moveTo(0, -24); ctx.lineTo(20, 16); ctx.lineTo(0, 8); ctx.lineTo(-20, 16); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c;
    ctx.fillRect(-3, -16, 6, 18);
    ctx.fillStyle = '#ff2bd6';
    ctx.fillRect(-8, -4, 16, 4);
    ctx.fillStyle = this.thrust > 0.3 ? '#ffae00' : '#6e2bff';
    ctx.fillRect(-4, 16, 8, 6 + Math.random()*4);
    if (this.shield < 50) {
      ctx.strokeStyle = `rgba(43,240,255,${0.3 + Math.sin(Date.now()/100)*0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0,0,this.r+4,0,Math.PI*2); ctx.stroke();
    }
    ctx.restore();
  }
}
