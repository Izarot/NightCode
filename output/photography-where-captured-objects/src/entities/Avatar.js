export class Avatar {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.size = 32;
    this.color = '#4ecdc4';
    this.direction = 0;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.direction);
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Camera accessory
    ctx.fillStyle = '#fff';
    ctx.fillRect(-6, -10, 12, 8);
    ctx.restore();
  }

  update(dt) {
    // Direction based on velocity
    if (this.vx !== 0 || this.vy !== 0) {
      this.direction = Math.atan2(this.vy, this.vx);
    }
  }
}
