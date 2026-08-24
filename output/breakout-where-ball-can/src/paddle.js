export default class Paddle {
  constructor(x, y, canvas) {
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 20;
    this.speed = 10;
    this.vx = 0;
    this.canvas = canvas;
  }
  update(keys) {
    this.vx = 0;
    if (keys.ArrowLeft || keys.a) this.vx = -this.speed;
    if (keys.ArrowRight || keys.d) this.vx = this.speed;
    this.x += this.vx;
    this.x = Math.max(0, Math.min(this.canvas.width - this.width, this.x));
  }
  draw(ctx) {
    ctx.fillStyle = '#ff6b6b';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
  getBounds() {
    return [this.x, this.y, this.x + this.width, this.y + this.height];
  }
}
