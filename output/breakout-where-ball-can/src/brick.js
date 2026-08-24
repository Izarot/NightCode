export default class Brick {
  constructor(x, y, width, height, color, hits, special, canvas) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.hits = hits;
    this.special = special;
    this.broken = false;
    this.canvas = canvas;
    this.points = special ? 75 : 20;
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
  getBounds() {
    return [this.x, this.y, this.x + this.width, this.y + this.height];
  }
}
