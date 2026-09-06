import { W, H, clamp } from './utils.js';
export class Obstacle {
  constructor() { this.active = false; this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.radius = 16; this.hitRadius = 12; this.type = 'shard'; this.age = 0; this.color = '#ff00aa'; this.rotation = 0; this.rotSpeed = 0; }
  spawn(x, y, vx, vy, type, speed) {
    this.active = true; this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.type = type; this.age = 0;
    this.rotation = Math.random() * Math.PI * 2;
    if (type === 'shard') { this.radius = 16 + Math.random() * 6; this.hitRadius = this.radius * 0.8; this.color = '#ff00aa'; this.rotSpeed = (Math.random() - 0.5) * 4; }
    else if (type === 'pulse') { this.radius = 20 + Math.random() * 8; this.hitRadius = this.radius * 0.8; this.color = '#00f0ff'; this.rotSpeed = (Math.random() - 0.5) * 2; const f = speed * 1.2; const l = Math.hypot(vx, vy); this.vx = (vx / l) * f; this.vy = (vy / l) * f; }
    else if (type === 'tracker') { this.radius = 18; this.hitRadius = this.radius * 0.8; this.color = '#ffcc00'; this.rotSpeed = 0; const f = speed * 1.3; const l = Math.hypot(vx, vy); this.vx = (vx / l) * f; this.vy = (vy / l) * f; }
    else if (type === 'splitter') { this.radius = 26; this.hitRadius = this.radius * 0.8; this.color = '#ff2244'; this.rotSpeed = 1; }
  }
  update(dt, player) {
    if (!this.active) return;
    this.age += dt;
    if (this.type === 'tracker' && player) {
      const dx = player.pos.x - this.x, dy = player.pos.y - this.y;
      const l = Math.hypot(dx, dy) || 1;
      const tx = dx / l, ty = dy / l;
      const cur = Math.hypot(this.vx, this.vy);
      const angle = Math.atan2(this.vy, this.vx);
      const target = Math.atan2(ty, tx);
      let diff = target - angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const step = (0.5 * Math.PI / 180) * 60;
      const newAngle = angle + clamp(diff, -step, step);
      this.vx = Math.cos(newAngle) * cur;
      this.vy = Math.sin(newAngle) * cur;
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;
    if (this.x < -80 || this.x > W + 80 || this.y < -80 || this.y > H + 80) this.active = false;
  }
  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    if (this.type === 'tracker') {
      ctx.strokeStyle = '#ffcc0055'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.shadowColor = this.color; ctx.shadowBlur = 14;
    ctx.fillStyle = this.color; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (this.type === 'shard') {
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * this.radius, py = Math.sin(a) * this.radius;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    } else if (this.type === 'pulse') {
      const s = 1 + 0.15 * Math.sin(performance.now() * 0.008);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const px = Math.cos(a) * this.radius * s, py = Math.sin(a) * this.radius * s;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    } else if (this.type === 'tracker') {
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2, r = i % 2 === 0 ? this.radius : this.radius * 0.6;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    } else if (this.type === 'splitter') {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * this.radius, py = Math.sin(a) * this.radius;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}
export class ObstaclePool {
  constructor(size = 80) { this.pool = []; for (let i = 0; i < size; i++) this.pool.push(new Obstacle()); }
  spawn(x, y, vx, vy, type, speed) { for (let o of this.pool) { if (!o.active) { o.spawn(x, y, vx, vy, type, speed); return o; } } return null; }
  update(dt, player) { for (let o of this.pool) o.update(dt, player); }
  draw(ctx) { for (let o of this.pool) o.draw(ctx); }
  active() { return this.pool.filter(o => o.active); }
}
