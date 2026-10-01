export class PhotoObject {
  constructor(x, y, type, points) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.points = points;
    this.radius = 16 + Math.random() * 8;
    this.captured = false;
    this.alpha = 1;
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#dcedc1'];
    this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    this.vx = (Math.random() - 0.5) * 30;
    this.vy = (Math.random() - 0.5) * 30;
  }

  update(dt) {
    if (this.captured) {
      this.alpha -= dt * 5;
      if (this.alpha <= 0) {
        this.alpha = 0;
      }
      return;
    }

    this.animationTimer += dt;
    if (this.animationTimer >= 0.2) {
      this.animationFrame = (this.animationFrame + 1) % 4;
      this.animationTimer = 0;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  render(ctx) {
    if (this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);

    // Draw object as recognizable icon
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    switch (this.type) {
      case 'bird':
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Wing
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 0.5, this.radius * 0.3, this.animationFrame < 2 ? 0.3 : -0.3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        break;
      case 'car':
        ctx.fillRect(-this.radius, -this.radius * 0.6, this.radius * 2, this.radius * 1.2);
        ctx.strokeRect(-this.radius, -this.radius * 0.6, this.radius * 2, this.radius * 1.2);
        break;
      case 'flower':
        for (let i = 0; i < 5; i++) {
          ctx.save();
          ctx.rotate((i * Math.PI * 2) / 5);
          ctx.translate(0, -this.radius * 0.5);
          ctx.beginPath();
          ctx.arc(0, 0, this.radius * 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.fillStyle = '#ffe66d';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      default:
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    ctx.restore();
  }
}
