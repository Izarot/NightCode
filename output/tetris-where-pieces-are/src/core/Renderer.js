import { GRID_W, GRID_H } from '../utils/Grid.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.cellSize = (rect.width / GRID_W) * this.dpr;
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(bgColor = '#0a0014') {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, w, h);
  }

  drawGrid() {
    const cs = this.cellSize;
    this.ctx.strokeStyle = '#1a0033';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_W; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * cs, 0);
      this.ctx.lineTo(x * cs, GRID_H * cs);
      this.ctx.stroke();
    }
    for (let y = 0; y <= GRID_H; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * cs);
      this.ctx.lineTo(GRID_W * cs, y * cs);
      this.ctx.stroke();
    }
  }

  drawCube(cx, cy, size, color, glowColor, spinAngle, alpha = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spinAngle);

    // outer glow
    if (alpha > 0.5) {
      ctx.shadowBlur = 12 * this.dpr;
      ctx.shadowColor = glowColor;
    }

    // body
    const half = size / 2;
    const grad = ctx.createLinearGradient(-half, -half, half, half);
    grad.addColorStop(0, this.lighten(color, 0.4));
    grad.addColorStop(0.5, color);
    grad.addColorStop(1, this.darken(color, 0.3));

    ctx.fillStyle = grad;
    ctx.globalAlpha = alpha;
    ctx.fillRect(-half + 2, -half + 2, size - 4, size - 4);

    // top highlight
    ctx.fillStyle = this.lighten(color, 0.6);
    ctx.fillRect(-half + 2, -half + 2, size - 4, size * 0.15);

    // bottom shadow
    ctx.fillStyle = this.darken(color, 0.5);
    ctx.fillRect(-half + 2, half - size * 0.15 - 2, size - 4, size * 0.15);

    // border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = this.lighten(color, 0.7);
    ctx.lineWidth = 2;
    ctx.strokeRect(-half + 2, -half + 2, size - 4, size - 4);

    ctx.restore();
  }

  drawLockedCell(gx, gy, cell) {
    if (!cell) return;
    const cs = this.cellSize;
    const cx = gx * cs + cs / 2;
    const cy = gy * cs + cs / 2;
    this.drawCube(cx, cy, cs, cell.color, cell.glow, cell.spinAngle, 1);
  }

  drawPiece(piece) {
    const cs = this.cellSize;
    for (const b of piece.blocks) {
      if (b.y < 0) continue;
      const cx = b.x * cs + cs / 2;
      const cy = b.y * cs + cs / 2;
      this.drawCube(cx, cy, cs, piece.color, piece.glow, piece.spinAngle);
    }
  }

  drawGhost(piece, grid) {
    const cs = this.cellSize;
    // determine lowest valid y
    let dy = 0;
    while (true) {
      const test = piece.blocks.map(b => ({ x: b.x, y: b.y + dy + 1 }));
      let hit = false;
      for (const t of test) {
        if (t.x < 0 || t.x >= GRID_W || t.y >= GRID_H) { hit = true; break; }
        if (t.y >= 0 && grid[t.y][t.x]) { hit = true; break; }
      }
      if (hit) break;
      dy++;
    }
    for (const b of piece.blocks) {
      if (b.y +dy < 0) continue;
      const cx = b.x * cs + cs / 2;
      const cy = (b.y + dy) * cs + cs / 2;
      this.drawCube(cx, cy, cs, piece.color, piece.glow, piece.spinAngle, 0.25);
    }
  }

  drawParticle(p) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowBlur = 8 * this.dpr;
    ctx.shadowColor = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    ctx.restore();
  }

  drawFlash(intensity) {
    if (intensity <= 0) return;
    this.ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  lighten(hex, amount) {
    return this.adjustColor(hex, amount);
  }

  darken(hex, amount) {
    return this.adjustColor(hex, -amount);
  }

  adjustColor(hex, amount) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const nr = Math.max(0, Math.min(255, r + (amount > 0 ? (255 - r) * amount : r * amount)));
    const ng = Math.max(0, Math.min(255, g + (amount > 0 ? (255 - g) * amount : g * amount)));
    const nb = Math.max(0, Math.min(255, b + (amount > 0 ? (255 - b) * amount : b * amount)));
    return `rgb(${Math.round(nr)}, ${Math.round(ng)}, ${Math.round(nb)})`;
  }
}
