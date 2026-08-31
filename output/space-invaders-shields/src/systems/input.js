export class Input {
  constructor(canvas) {
    this.left = false; this.right = false;
    this.fire = false; this.bomb = false; this.repair = false;
    this.keys = {};
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    let tx = null;
    canvas.addEventListener('touchstart', e => {
      tx = e.touches[0].clientX;
      this.fire = true;
    });
    canvas.addEventListener('touchmove', e => {
      if (tx === null) return;
      const dx = e.touches[0].clientX - tx;
      this.left = dx < -20;
      this.right = dx > 20;
    });
    canvas.addEventListener('touchend', () => { tx = null; this.left=false; this.right=false; this.fire=false; });
  }
  sample() {
    this.left = this.keys['ArrowLeft'] || this.left;
    this.right = this.keys['ArrowRight'] || this.right;
    this.fire = this.keys['Space'] || this.fire;
    this.bomb = this.keys['KeyX'] || false;
    this.repair = this.keys['KeyR'] || false;
  }
}
