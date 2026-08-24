export default class Powerup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = 12;
    this.speed = 2;
  }
  update() {
    this.y += this.speed;
  }
  draw(ctx) {
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}
