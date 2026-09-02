export class Input {
  constructor() {
    this.keys = {};
    this.pressed = {};
    this._init();
  }

  _init() {
    window.addEventListener('keydown', (e) => {
      if (this.keys[e.code]) return;
      this.keys[e.code] = true;
      this.pressed[e.code] = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
    window.addEventListener('blur', () => {
      this.keys = {};
      this.pressed = {};
    });
  }

  isDown(code) {
    return !!this.keys[code];
  }

  isPressed(code) {
    return !!this.pressed[code];
  }

  endFrame() {
    this.pressed = {};
  }
}
