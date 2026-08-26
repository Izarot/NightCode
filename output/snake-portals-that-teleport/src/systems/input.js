export class InputManager {
  constructor() {
    this.direction = { x: 1, y: 0 };
    this.queue = { x: 1, y: 0 };
    this.lastChange = 0;
    this.isListening = false;
  }

  init() {
    if (this.isListening) return;
    this.isListening = true;

    const handleKeyDown = (e) => this.onKeyDown(e);
    const handleTouchStart = (e) => this.onTouchStart(e);
    const handleTouchMove = (e) => this.onTouchMove(e);
    const handleTouchEnd = (e) => this.onTouchEnd(e);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
  }

  onKeyDown(e) {
    const key = e.key;
    const now = performance.now();

    // Prevent 180° reversal
    if (this._isOpposite(key)) return;

    // 100ms minimum interval
    if (now - this.lastChange > 100) {
      let newDir = this._keyToDir(key);
      if (newDir) {
        this.queue = newDir;
        this.direction = { ...newDir };
        this.lastChange = now;
      }
    }
  }

  _isOpposite(key) {
    if (this.direction.x === 0) {
      return key === 'ArrowUp' || key === 'ArrowDown';
    }
    if (this.direction.y === 0) {
      return key === 'ArrowLeft' || key === 'ArrowRight';
    }
    return false;
  }

  _keyToDir(key) {
    switch (key) {
      case 'ArrowUp': case 'W': return { x: 0, y: -1 };
      case 'ArrowDown': case 'S': return { x: 0, y: 1 };
      case 'ArrowLeft': case 'A': return { x: -1, y: 0 };
      case 'ArrowRight': case 'D': return { x: 1, y: 0 };
      default: return null;
    }
  }

  onTouchStart(e) {
    e.preventDefault();
    this.touchStart = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }

  onTouchMove(e) {
    if (!this.touchStart) return;
    const touch = e.touches[0];
    const dx = touch.clientX - this.touchStart.x;
    const dy = touch.clientY - this.touchStart.y;

    if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
      this._processSwipe(dx, dy);
      this.touchStart = null;
    }
  }

  onTouchEnd() {
    this.touchStart = null;
  }

  _processSwipe(dx, dy) {
    const now = performance.now();
    if (now - this.lastChange < 100) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.queue = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else {
      this.queue = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }

    this.direction = { ...this.queue };
    this.lastChange = now;
  }
}