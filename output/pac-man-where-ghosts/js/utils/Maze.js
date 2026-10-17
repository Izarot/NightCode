export class Maze {
  constructor(level) {
    this.level = level;
    this.tileSize = 32;
    this.cols = 25;
    this.rows = 19;
    this.grid = this.generateGrid();
    this.goal = { x: this.cols * this.tileSize - 64, y: this.rows * this.tileSize - 64 };
  }

  generateGrid() {
    const grid = [];
    for (let y = 0; y < this.rows; y++) {
      const row = [];
      for (let x = 0; x < this.cols; x++) {
        row.push(this.isWall(x, y) ? 1 : 0);
      }
      grid.push(row);
    }
    return grid;
  }

  isWall(x, y) {
    // Simple border + cross pattern
    if (x === 0 || y === 0 || x === this.cols - 1 || y === this.rows - 1) return true;
    if (x % 4 === 0 && y % 4 === 0) return true;
    return false;
  }

  collides(px, py) {
    const tx = Math.floor(px / this.tileSize);
    const ty = Math.floor(py / this.tileSize);
    if (tx < 0 || ty < 0 || tx >= this.cols || ty >= this.rows) return true;
    return this.grid[ty][tx] === 1;
  }

  generateDots() {
    const dots = [];
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (!this.isWall(x, y)) {
          dots.push({ x: x * this.tileSize + 16, y: y * this.tileSize + 16, collected: false });
        }
      }
    }
    return dots;
  }

  generateItems() {
    const items = [];
    const nodes = [[5, 5], [10, 10], [15, 15], [20, 5]];
    const types = ['ghost_charm', 'speed_boost', 'shield'];
    nodes.forEach((node, i) => {
      items.push(new Item(node[0] * this.tileSize + 16, node[1] * this.tileSize + 16, types[i % types.length]));
    });
    return items;
  }

  draw(ctx) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.cols * this.tileSize, this.rows * this.tileSize);
    ctx.fillStyle = '#16213e';
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        if (this.grid[y][x] === 1) {
          ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        }
      }
    }
  }

  findPath(sx, sy, tx, ty) {
    // Stub A* - returns straight line path
    const path = [];
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      path.push({ x: sx + (tx - sx) * (i / steps), y: sy + (ty - sy) * (i / steps), t: i * 0.2 });
    }
    return path;
  }
}
