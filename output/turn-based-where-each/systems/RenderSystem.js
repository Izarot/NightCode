export class RenderSystem {
  constructor(canvas, board) {
    this.ctx = canvas.getContext('2d');
    this.canvas = canvas;
    this.board = board;
    this.tileSize = this._calcTileSize();
    this.colorPalette = {
      forest: '#2E7D32',
      water: '#1565C0',
      mountain: '#6D4C41',
      grass: '#8BC34A',
      default: '#424242',
    };
  }
  _calcTileSize() {
    const maxTiles = Math.max(this.board.width, this.board.height);
    const scale = Math.min(this.canvas.width / maxTiles, this.canvas.height / maxTiles);
    return 40 * scale;
  }
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    // background
    ctx.fillStyle = '#111';
    ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    // draw tiles
    for (let y=0; y<this.board.height; y++) {
      for (let x=0; x<this.board.width; x++) {
        const cell = this.board.cells[y][x];
        if (!cell) continue;
        const size = this.tileSize;
        const ox = x * size;
        const oy = y * size;
        // base color
        ctx.fillStyle = this.colorPalette[cell.type] || this.colorPalette.default;
        ctx.fillRect(ox, oy, size, size);
        // glow if selected
        if (cell.isSelected) {
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#fff';
          ctx.fillRect(ox, oy, size, size);
          ctx.globalAlpha = 1;
        }
        // draw tile icon
        ctx.fillStyle = '#fff';
        ctx.font = `${size*0.4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.type[0].toUpperCase(), ox + size/2, oy + size/2);
      }
    }
  }
}