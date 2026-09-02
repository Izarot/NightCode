const TILE = 40;

export class Level {
  constructor(data) {
    this.data = data;
    this.tileMap = data.tiles;
    this.cols = data.tiles[0].length;
    this.rows = data.tiles.length;
    this.walls = [];
    this.startPos = null;
    this.exitPos = null;
    this.checkpoints = [];
    this.parse();
    this.sentries = data.sentries || [];
  }

  parse() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.tileMap[r][c];
        const x = c * TILE + TILE / 2;
        const y = r * TILE + TILE / 2;
        if (t === 1) {
          this.walls.push({ x: c * TILE, y: r * TILE, w: TILE, h: TILE });
        } else if (t === 2) {
          this.startPos = { x, y };
        } else if (t === 3) {
          this.exitPos = { x, y };
        } else if (t === 4) {
          this.checkpoints.push({ x, y });
        }
      }
    }
  }

  collidesAt(x, y, r) {
    for (const w of this.walls) {
      const cx = Math.max(w.x, Math.min(x, w.x + w.w));
      const cy = Math.max(w.y, Math.min(y, w.y + w.h));
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy < r * r) return true;
    }
    return false;
  }

  isCheckpoint(pos) {
    return this.checkpoints.some(cp => Math.hypot(cp.x - pos.x, cp.y - pos.y) < 20);
  }

  isAtExit(pos) {
    if (!this.exitPos) return false;
    return Math.hypot(this.exitPos.x - pos.x, this.exitPos.y - pos.y) < 20;
  }

  render(ctx) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.tileMap[r][c];
        const x = c * TILE;
        const y = r * TILE;
        if (t === 0) {
          ctx.fillStyle = '#0d1b2a';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.05)';
          ctx.strokeRect(x, y, TILE, TILE);
        } else if (t === 1) {
          ctx.fillStyle = '#050b18';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(0, 229, 255, 0.4)';
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
          ctx.shadowBlur = 0;
        } else if (t === 3) {
          ctx.fillStyle = '#1a0b00';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#ffb703';
          ctx.fillStyle = '#ffb703';
          ctx.fillRect(x + 8, y + 8, TILE - 16, TILE - 16);
          ctx.shadowBlur = 0;
        } else if (t === 4) {
          ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
          ctx.fillRect(x, y, TILE, TILE);
          ctx.strokeStyle = '#00e5ff';
          ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
        }
      }
    }
    if (this.startPos) {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(this.startPos.x, this.startPos.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
