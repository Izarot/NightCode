import { TETROMINOES } from '../pieces/TetrominoDefinitions.js';

export class Hud {
  constructor() {
    this.scoreEl = document.getElementById('score-value');
    this.highScoreEl = document.getElementById('high-score-value');
    this.levelEl = document.getElementById('level-value');
    this.linesEl = document.getElementById('lines-value');
    this.timerEl = document.getElementById('timer-value');
    this.holdCanvas = document.getElementById('hold-slot');
    this.nextCanvas = document.getElementById('next-queue');
    this.holdCtx = this.holdCanvas.getContext('2d');
    this.nextCtx = this.nextCanvas.getContext('2d');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.pauseBtn = document.getElementById('pause-btn');
    this.soundBtn = document.getElementById('sound-btn');
  }

  updateScore(score, highScore) {
    this.scoreEl.textContent = score;
    this.highScoreEl.textContent = highScore;
  }

  updateLevel(level) {
    this.levelEl.textContent = level;
  }

  updateLines(lines) {
    this.linesEl.textContent = lines;
  }

  updateTimer(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    this.timerEl.textContent =
      String(m).padStart(2, '0') + ':' + s.toFixed(1).padStart(4, '0');
  }

  showPause(show) {
    this.pauseOverlay.classList.toggle('active', show);
    this.pauseBtn.textContent = show ? '▶' : '⏸';
  }

  setSoundIcon(muted) {
    this.soundBtn.textContent = muted ? '🔇' : '🔊';
  }

  drawHold(type) {
    const ctx = this.holdCtx;
    const w = this.holdCanvas.width;
    const h = this.holdCanvas.height;
    ctx.clearRect(0, 0, w, h);
    if (!type) return;
    const def = TETROMINOES[type];
    const cells = def.shapes[0];
    const padding = 8;
    const cellSize = Math.min((w - padding * 2) / 4, (h - padding * 2) / 2);
    const ox = (w - cellSize * 4) / 2;
    const oy = (h - cellSize * 2) / 2;
    for (const [dx, dy] of cells) {
      const cx = ox + dx * cellSize + cellSize / 2;
      const cy = oy + dy * cellSize + cellSize / 2;
      this.drawMiniCube(ctx, cx, cy, cellSize, def.color);
    }
  }

  drawNext(types) {
    const ctx = this.nextCtx;
    const w = this.nextCanvas.width;
    const h = this.nextCanvas.height;
    ctx.clearRect(0, 0, w, h);
    const rows = 5;
    const cols = 4;
    const padding = 6;
    const cellSize = Math.min((w - padding * 2) / cols, (h - padding * 2) / rows);
    for (let i = 0; i < types.length && i < rows; i++) {
      const type = types[i];
      const def = TETROMINOES[type];
      const cells = def.shapes[0];
      const blockH = (i + 1) * (h / rows);
      const ox = (w - cellSize * cols) / 2;
      const oy = blockH - cellSize * 2 + (h / rows - cellSize * 2) / 2;
      for (const [dx, dy] of cells) {
        const cx = ox + dx * cellSize + cellSize / 2;
        const cy = oy + dy * cellSize + cellSize / 2;
        this.drawMiniCube(ctx, cx, cy, cellSize, def.color);
      }
    }
  }

  drawMiniCube(ctx, cx, cy, size, color) {
    const half = size / 2;
    ctx.save();
    ctx.shadowBlur = 6;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.fillRect(cx - half + 1, cy - half + 1, size - 2, size - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(cx - half + 1, cy - half + 1, size - 2, size * 0.15);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - half + 1, cy - half + 1, size - 2, size - 2);
    ctx.restore();
  }
}
