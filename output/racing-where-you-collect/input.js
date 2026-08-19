export class Input {
  constructor() {
    this.throttle = false;
    this.brake = false;
    this.left = false;
    this.right = false;
    this.keys = {};
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.throttle = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.brake = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.right = true;
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.throttle = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.brake = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.right = false;
    });
    let touchId = null;
    window.addEventListener('touchstart', e => {
      for (const t of e.changedTouches) {
        touchId = t.identifier;
        if (t.clientX < window.innerWidth / 2) this.left = true;
        else if (t.clientX > window.innerWidth / 2 && t.clientX < window.innerWidth * 2 / 3) this.throttle = true;
        else this.brake = true;
      }
    });
    window.addEventListener('touchend', e => {
      for (const t of e.changedTouches) {
        if (t.identifier === touchId) {
          touchId = null;
          this.left = false;
          this.throttle = false;
          this.brake = false;
        }
      }
    });
    window.addEventListener('touchmove', e => {
      for (const t of e.touches) {
        if (t.identifier === touchId) {
          if (t.clientX < window.innerWidth / 2) this.left = true;
          else if (t.clientX > window.innerWidth / 2 && t.clientX < window.innerWidth * 2 / 3) this.throttle = true;
          else this.brake = true;
        }
      }
    });
  }

  get direction() {
    return this.left ? -1 : this.right ? 1 : 0;
  }
}