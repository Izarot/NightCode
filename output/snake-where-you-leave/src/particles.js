// Particle system is integrated into Renderer
// This file exists for modularity but exports nothing

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  add(x, y, options = {}) {
    this.particles.push({
      x,
      y,
      vx: options.vx || (Math.random() - 0.5) * 2,
      vy: options.vy || (Math.random() - 0.5) * 2,
      radius: options.radius || Math.random() * 3 + 1,
      life: 1,
      color: options.color || '#00ff88',
      gravity: options.gravity !== false,
      fade: options.fade !== false
    });
  }

  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += 0.05;
      p.life -= deltaTime / (p.fade ? 500 : 1000);
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.radius * alpha), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    this.particles = [];
  }
}