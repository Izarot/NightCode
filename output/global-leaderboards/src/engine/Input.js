export class Input {
  constructor() {
    this.keys = {};
    this.pressed = new Set();
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      this.pressed.add(e.code);
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
    });
  }
  isPressedKey(code) { return this.keys[code] || false; }
  isJustPressed(code) { const ret = this.pressed.has(code); this.pressed.delete(code); return ret; }
  clearPressed(code) { this.pressed.delete(code); }
}
