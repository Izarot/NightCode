export class InputManager {
  constructor() {
    this.keys = {};
    this.touchPos = { x: 0, y: 0 };
    this.focus = false;
    this.pulse = false;
    
    window.addEventListener('keydown', e => this.keys[e.key] = true);
    window.addEventListener('keyup', e => this.keys[e.key] = false);
    
    window.addEventListener('gamepadconnected', () => this.pollGamepad());
    setInterval(() => this.pollGamepad(), 16);
  }
  
  pollGamepad() {
    const gp = navigator.getGamepads()[0];
    if (gp) {
      const leftX = gp.axes[0], leftY = gp.axes[1];
      const rightX = gp.axes[2], rightY = gp.axes[3];
      this.touchPos = { x: leftX, y: leftY };
      this.focus = rightY > 0.5;
      this.pulse = gp.buttons[0].pressed;
    }
  }
  
  getKeys() { return this.keys; }
  getFocus() { return this.focus; }
  getPulse() { return this.pulse; }
}
