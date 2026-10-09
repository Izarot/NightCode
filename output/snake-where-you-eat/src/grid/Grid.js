export class Grid {
  constructor(cols, rows, tileSize) {
    this.cols = cols;
    this.rows = rows;
    this.tileSize = tileSize;
    this.walls = [];
    this.generateWalls();
  }

  generateWalls() {
    this.walls = [];
    const total = this.cols * this.rows;
    const count = Math.floor(total * 0.15);
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * this.cols);
      const y = Math.floor(Math.random() * this.rows);
      if (x === 0 || y === 0 || x === this.cols - 1 || y === this.rows - 1) continue;
      if (this.walls.some(w => w.x === x && w.y === y)) continue;
      this.walls.push({ x, y });
    }
  }

  isWall(x, y) {
    return this.walls.some(w => w.x === x && w.y === y);
  }

  draw(ctx, offsetX, offsetY, scale, ts) {
    ctx.fillStyle = '#333';
    for (const w of this.walls) {
      ctx.fillRect(offsetX + w.x * ts * scale, offsetY + w.y * ts * scale, ts * scale, ts * scale);
    }
  }
}
