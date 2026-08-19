export class Renderer {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.scale = 1;
    this.particles = [];
  }

  setScale(scale) {
    this.scale = scale;
  }

  drawLevel(level) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const imgL = new Image();
    const imgR = new Image();
    const self = this;
    let loaded = 0;
    imgL.onload = () => { loaded++; if (loaded === 2) self.drawImages(imgL, imgR, level); };
    imgR.onload = () => { loaded++; if (loaded === 2) self.drawImages(imgL, imgR, level); };
    imgL.src = level.imagePair[0];
    imgR.src = level.imagePair[1];
  }

  drawImages(imgL, imgR, level) {
    const scale = this.scale;
    this.ctx.drawImage(imgL, 100 * scale, 100 * scale, 500 * scale, 500 * scale);
    this.ctx.drawImage(imgR, 640 * scale, 100 * scale, 500 * scale, 500 * scale);
    this.drawDifferences(level.differences);
  }

  drawDifferences(differences) {
    differences.forEach(d => {
      if (!d.found) {
        this.ctx.strokeStyle = '#ff6b6b';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        this.ctx.stroke();
      } else {
        this.ctx.fillStyle = '#69db7c';
        this.ctx.beginPath();
        this.ctx.arc(d.x, d.y, d.radius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });
  }

  markDifference(diff) {
    this.ctx.fillStyle = '#69db7c';
    this.ctx.beginPath();
    this.ctx.arc(diff.x, diff.y, diff.radius * 0.6, 0, Math.PI * 2);
    this.ctx.fill();
    this.createParticles(diff.x, diff.y);
  }

  highlightDifference(diff) {
    this.ctx.save();
    this.ctx.globalAlpha = 0.5;
    this.ctx.fillStyle = '#ffd93d';
    this.ctx.beginPath();
    this.ctx.arc(diff.x, diff.y, diff.radius + 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  createParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({ x, y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 1 });
    }
  }

  shakeScreen() {
    const original = this.canvas.style.transform;
    this.canvas.style.transform = 'translateX(5px) translateY(-5px)';
    setTimeout(() => { this.canvas.style.transform = original; }, 100);
  }

  updateParticles() {
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = '#ffd93d';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
}