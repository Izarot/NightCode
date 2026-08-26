export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  explode(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 / 10) * i;
      const velocity = { x: Math.cos(angle) * 3, y: Math.sin(angle) * 3 };
      this.particles.push({
        x, y,
        vx: velocity.x,
        vy: velocity.y,
        color,
        life: 1,
        decay: Math.random() * 0.005 + 0.002
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      ctx.restore();
    }
  }
}