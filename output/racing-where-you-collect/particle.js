export class Particle {
  constructor(x, y, vx, vy) {
    this.pos = createVector(x, y);
    this.vel = createVector(vx, vy);
    this.life = 0.5;
    this.age = 0;
  }

  update(dt) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.age += dt;
  }

  draw(ctx) {
    const alpha = 1 - this.age / this.life;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(count, x, y) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      this.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed));
    }
  }

  update(dt) {
    this.particles = this.particles.filter(p => {
      p.update(dt);
      return p.age < p.life;
    });
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  }
}