export class Level {
  constructor(num) {
    this.num = num;
    this.tileSize = 32;
    this.grid = this.generateGrid();
    this.collectibles = [];
    this.enemies = [];
    this.exit = { x: 900, y: 560 };
    this.generateCollectibles();
  }

  generateGrid() {
    const cols = 32;
    const rows = 24;
    const grid = [];
    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) {
        row.push(0);
      }
      grid.push(row);
    }
    for (let x = 0; x < cols; x++) grid[rows - 1][x] = 1;
    for (let x = 0; x < 10; x++) grid[18][x] = 1;
    for (let x = 15; x < 20; x++) grid[15][x] = 1;
    for (let x = 25; x < 32; x++) grid[10][x] = 1;
    return grid;
  }

  generateCollectibles() {
    this.collectibles = [
      { x: 120, y: 500, value: 10, collected: false },
      { x: 300, y: 450, value: 10, collected: false },
      { x: 500, y: 380, value: 10, collected: false },
      { x: 700, y: 300, value: 10, collected: false }
    ];
  }

  update(dt) {
    // Placeholder for moving platforms/enemies
  }

  render(ctx) {
    ctx.fillStyle = '#00e5ff';
    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[y].length; x++) {
        if (this.grid[y][x] === 1) {
          ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        }
      }
    }
    ctx.fillStyle = '#ff7f00';
    for (const c of this.collectibles) {
      if (!c.collected) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#ff0';
    ctx.fillRect(this.exit.x, this.exit.y, 20, 40);
  }
}
