export class InputManager {
  constructor() {
    this.keys = {};
    this.prevKeys = {};
    window.addEventListener('keydown', e => { this.keys[e.code] = true; });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
  }
  update() {
    this.prevKeys = {...this.keys};
  }
  isDown(key) { return !!this.keys[key]; }
  isPressed(key) { return this.keys[key] && !this.prevKeys[key]; }
}