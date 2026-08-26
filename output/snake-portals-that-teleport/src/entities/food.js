export class Food {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.pulse = 0;
  }

  update(dt) {
    this.pulse += dt * 0.002;
  }

  occupies(x, y) {
    return Math.abs(x - this.x) < CELL_SIZE / 2 && Math.abs(y - this.y) < CELL_SIZE / 2;
  }
}