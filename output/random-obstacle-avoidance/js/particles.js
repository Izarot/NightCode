import { W, H } from './utils.js';
export class Particle {
  constructor() { this.active = false; this.x = 0; this.y = 0; this.vx = 0; this.vy = 0; this.life = 0; this.maxLife = 1; this.size = 2; this.color = '#00f0ff'; }
  spawn(x, y, vx, vy, life, size, color) {
    this.active = true; this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.maxLife = this.life = life; this.size = size; this.color = color;
  }
}
export class ParticlePool {
  constructor(size = 200) {
    this.pool = []; for (let i = 0; i < size; i++) this.pool.push(new Particle());
  }
  emit(x, y, vx, vy, life, size, color) {
    for (let p of this.pool) { if (!p.active) { p.spawn(x, y, vx, vy, life, size, color); return p; } }
    return null;
  }
  update(dt) {
    for (let p of this.pool) {
      if (!p.active) continue;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) p.active = false;
    }
  }
  draw(ctx) {
    for (let p of this.pool) {
      if (!p.active) continue;
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
export class FloatingText {
  constructor() { this.active = false; this.x = 0; this.y = 0; this.text = ''; this.life = 0; this.maxLife = 1; this.color = '#00f0ff'; }
  spawn(x, y, text, color = '#00f0ff', life = 0.8) { this.active = true; this.x = x; this.y = y; this.text = text; this.color = color; this.maxLife = this.life = life; }
}
export class TextPool {
  constructor(size = 20) { this.pool = []; for (let i = 0; i < size; i++) this.pool.push(new FloatingText()); }
  spawn(x, y, text, color, life) { for (let t of this.pool) { if (!t.active) { t.spawn(x, y, text, color, life); return t; } } }
  update(dt) { for (let t of this.pool) { if (!t.active) continue; t.y -= 40 * dt; t.life -= dt; if (t.life <= 0) t.active = false; } }
  draw(ctx) { ctx.font = '14px Orbitron, monospace'; ctx.textAlign = 'center'; for (let t of this.pool) { if (!t.active) continue; ctx.globalAlpha = Math.max(0, t.life / t.maxLife); ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y); } ctx.globalAlpha = 1; }
}
