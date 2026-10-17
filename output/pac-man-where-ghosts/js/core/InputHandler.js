export class InputHandler {
  constructor() {
    this.keys = new Set();
    this.lastInputTime = 0;
    this.inputDelay = 0.05;
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) {
        e.preventDefault();
        this.keys.add(e.key);
      }
      if (e.key === 'Escape') {
        document.getElementById('pause-menu').style.display = 'block';
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });
  }

  update() {
    this.lastInputTime += 1 / 60;
  }

  getDirection() {
    let dx = 0, dy = 0;
    if (this.keys.has('ArrowUp') || this.keys.has('w')) dy = -1;
    if (this.keys.has('ArrowDown') || this.keys.has('s')) dy = 1;
    if (this.keys.has('ArrowLeft') || this.keys.has('a')) dx = -1;
    if (this.keys.has('ArrowRight') || this.keys.has('d')) dx = 1;
    if (dx !== 0 && dy !== 0) {
      const norm = Math.SQRT1_2;
      dx *= norm; dy *= norm;
    }
    return { dx, dy };
  }
}
