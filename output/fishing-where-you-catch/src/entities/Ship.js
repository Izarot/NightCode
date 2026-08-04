export class Ship {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.speed = 4;
    this.size = 32;
  }
  update(input, dt) {
    const dir = input.direction;
    this.vx += dir.x * this.speed * dt;
    this.vy += dir.y * this.speed * dt;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.9;
    this.vy *= 0.9;
    if (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1) {
      this.angle = Math.atan2(this.vy, this.vx);
    }
    this.x = Math.max(0, Math.min(1280, this.x));
    this.y = Math.max(0, Math.min(720, this.y));
  }
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    ctx.restore();
  }
}
