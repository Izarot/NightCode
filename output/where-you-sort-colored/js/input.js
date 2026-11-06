// input.js
export class Input {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.isTouch = false;
    this.startX = 0;
    this.startY = 0;
    this.sourceIdx = null;
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
  }

  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.isTouch = e.type === 'pointerdown';
    this.startX = x;
    this.startY = y;
    const idx = this.getTubeIndex(x, y);
    if (idx !== null) {
      this.sourceIdx = idx;
    }
  }

  handlePointerUp(e) {
    if (!this.isTouch) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const targetIdx = this.getTubeIndex(x, y);
    if (this.sourceIdx !== null && targetIdx !== undefined && this.sourceIdx !== targetIdx) {
      this.game.pour(this.sourceIdx, targetIdx);
      this.sourceIdx = null;
    }
    this.isTouch = false;
  }

  handlePointerMove(e) {
    // not needed for simple tap
  }

  getTubeIndex(x, y) {
    const tubes = this.game.tubes;
    const tubeWidth = 80;
    const spacing = 20;
    const startX = (this.canvas.width - (tubes.length * tubeWidth + (tubes.length - 1) * spacing)) / 2;
    const tubeTopY = this.canvas.height * 0.6;
    for (let i = 0; i < tubes.length; i++) {
      const tubeX = startX + i * (tubeWidth + spacing);
      if (x >= tubeX && x <= tubeX + tubeWidth && y >= tubeTopY - 20 && y <= tubeTopY + 300) {
        return i;
      }
    }
    return null;
  }

  start() {
    // nothing
  }
}