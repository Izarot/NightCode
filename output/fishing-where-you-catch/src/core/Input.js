export class Input {
  constructor() {
    this.keys = {};
    this.touch = { x: 0, y: 0, active: false };
    window.addEventListener('keydown', e => this.keys[e.key] = true);
    window.addEventListener('keyup', e => this.keys[e.key] = false);
    window.addEventListener('touchstart', e => {
      const t = e.touches[0];
      this.touch.x = t.clientX;
      this.touch.y = t.clientY;
      this.touch.active = true;
    });
    window.addEventListener('touchend', () => this.touch.active = false);
  }
  update() {}
  isDown(key) { return this.keys[key] === true; }
  get direction() {
    let dx = 0, dy = 0;
    if (this.isDown('ArrowUp') || this.isDown('w')) dy -= 1;
    if (this.isDown('ArrowDown') || this.isDown('s')) dy += 1;
    if (this.isDown('ArrowLeft') || this.isDown('a')) dx -= 1;
    if (this.isDown('ArrowRight') || this.isDown('d')) dx += 1;
    return { x: dx, y: dy };
  }
  get cast() { return this.isDown(' ') || this.isDown('Space') || this.touch.active; }
}
