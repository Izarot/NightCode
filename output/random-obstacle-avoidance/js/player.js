import { W, H, clamp, Vec } from './utils.js';
export class Player {
  constructor() {
    this.pos = new Vec(W / 2, H / 2);
    this.vel = new Vec();
    this.radius = 28;
    this.hitRadius = 14;
    this.speed = 420;
    this.state = 'ALIVE';
    this.invulnTimer = 0;
    this.trail = [];
    this.flashTimer = 0;
    this.rotation = 0;
    this.mouseAim = false;
    this.boundsPad = 20;
  }
  reset() {
    this.pos.set(W / 2, H / 2);
    this.vel.set(0, 0);
    this.state = 'ALIVE';
    this.invulnTimer = 0;
    this.trail.length = 0;
    this.flashTimer = 0;
    this.rotation = 0;
  }
  update(dt, input) {
    if (this.state === 'DEAD') return;
    if (this.mouseAim) {
      const tx = input.mouseX, ty = input.mouseY;
      const dx = tx - this.pos.x, dy = ty - this.pos.y;
      const l = Math.hypot(dx, dy);
      if (l > 2) { this.vel.x = (dx / l) * this.speed; this.vel.y = (dy / l) * this.speed; }
      else { this.vel.x = 0; this.vel.y = 0; }
    } else {
      let vx = 0, vy = 0;
      if (input.left) vx -= 1; if (input.right) vx += 1;
      if (input.up) vy -= 1; if (input.down) vy += 1;
      const l = Math.hypot(vx, vy);
      if (l > 0) { vx /= l; vy /= l; }
      this.vel.x = vx * this.speed; this.vel.y = vy * this.speed;
    }
    this.pos.x = clamp(this.pos.x + this.vel.x * dt, this.boundsPad, W - this.boundsPad);
    this.pos.y = clamp(this.pos.y + this.vel.y * dt, this.boundsPad, H - this.boundsPad);
    if (this.vel.x !== 0 || this.vel.y !== 0) this.rotation = Math.atan2(this.vel.y, this.vel.x);
    this.trail.push({ x: this.pos.x, y: this.pos.y });
    if (this.trail.length > 10) this.trail.shift();
    if (this.flashTimer > 0) this.flashTimer -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
  }
  draw(ctx) {
    if (this.state === 'DEAD') return;
    let alpha = 1;
    if (this.invulnTimer > 0) alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(performance.now() * 0.02));
    ctx.globalAlpha = alpha;
    for (let i = 0; i < this.trail.length - 1; i++) {
      const t1 = this.trail[i], t2 = this.trail[i + 1];
      const a = (i / this.trail.length) * 0.6;
      ctx.strokeStyle = `rgba(0, 240, 255, ${a})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.stroke();
    }
    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.rotation);
    ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 20;
    ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 2;
    ctx.fillStyle = this.flashTimer > 0 ? '#ff2244' : '#ffffff';
    ctx.beginPath();
    const r = this.radius;
    for (let i = 0; i < 4; i++) {
      const a1 = (i / 4) * Math.PI * 2, a2 = ((i + 1) / 4) * Math.PI * 2;
      const px = Math.cos(a1) * r, py = Math.sin(a1) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      ctx.lineTo(Math.cos(a2) * r, Math.sin(a2) * r);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  triggerFlash() { this.flashTimer = 0.2; }
}
