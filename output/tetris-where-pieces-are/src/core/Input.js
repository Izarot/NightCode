// Unified input: keyboard + touch
export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.actions = [];
    this.touchStart = null;
    this.touchMoved = false;
    this.holdTap = false;
    this.holdTapStart = 0;

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
    canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
  }

  onKeyDown(e) {
    if (this.keys[e.code]) return;
    this.keys[e.code] = true;
    switch (e.code) {
      case 'ArrowLeft':  this.actions.push('left'); break;
      case 'ArrowRight': this.actions.push('right'); break;
      case 'ArrowDown':  this.actions.push('soft'); break;
      case 'ArrowUp':    this.actions.push('rotate'); break;
      case 'Space':      e.preventDefault(); this.actions.push('hard'); break;
      case 'KeyC':
      case 'KeyZ':       this.actions.push('hold'); break;
      case 'KeyP':       this.actions.push('pause'); break;
      case 'KeyM':       this.actions.push('mute'); break;
    }
  }

  onKeyUp(e) {
    this.keys[e.code] = false;
  }

  onTouchStart(e) {
    e.preventDefault();
    const t = e.touches[0];
    this.touchStart = { x: t.clientX, y: t.clientY, time: Date.now() };
    this.touchMoved = false;
    this.holdTapStart = Date.now();
  }

  onTouchMove(e) {
    if (!this.touchStart) return;
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - this.touchStart.x;
    const dy = t.clientY - this.touchStart.y;
    if (!this.touchMoved && (Math.abs(dx) > 20 || Math.abs(dy) > 20)) {
      this.touchMoved = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) this.actions.push('right');
        else this.actions.push('left');
      } else {
        if (dy > 0) this.actions.push('soft');
        else this.actions.push('rotate');
      }
      this.touchStart = { x: t.clientX, y: t.clientY, time: Date.now() };
    }
  }

  onTouchEnd(e) {
    e.preventDefault();
    if (!this.touchStart) return;
    const elapsed = Date.now() - this.touchStart.time;
    if (!this.touchMoved && elapsed < 250) {
      // tap - rotate
      this.actions.push('rotate');
    } else if (!this.touchMoved && elapsed >= 250) {
      // long press - hard drop
      this.actions.push('hard');
    }
    this.touchStart = null;
    this.touchMoved = false;
  }

  onMouseDown(e) {
    // simple click to rotate for desktop testing
    this.actions.push('rotate');
  }

  consume() {
    const a = this.actions;
    this.actions = [];
    return a;
  }

  isDown(code) {
    return !!this.keys[code];
  }
}
