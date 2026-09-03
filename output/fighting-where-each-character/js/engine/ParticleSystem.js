export class ParticleSystem {
  constructor() {
    this.particles = [];
  }
  add(x, y, vx, vy, life, color) {
    this.particles.push({x, y, vx, vy, life, color});
  }
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }
  render(ctx, camera) {
    ctx.save();
    ctx.translate(-camera.x, 0);
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.restore();
  }
}