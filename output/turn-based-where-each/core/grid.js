export class Grid {
  constructor(width, height, tileSize) {
    this.width = width;
    this.height = height;
    this.tileSize = tileSize;
    this.cells = Array.from({length: height}, () => Array(width).fill(null));
  }
  isInside(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
  getCell(x, y) {
    if (!this.isInside(x, y)) return null;
    return this.cells[y][x];
  }
  setCell(x, y, value) {
    if (this.isInside(x, y)) this.cells[y][x] = value;
  }
}