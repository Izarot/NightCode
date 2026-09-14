export class Input {
  constructor() {
    this.left = false;
    this.right = false;
    this.kick = false;
    this.hook = false;
    this.retract = false;
    this._setup();
  }

  _setup() {
    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'ArrowLeft': this.left = true; break;
        case 'ArrowRight': this.right = true; break;
        case 'Space': this.kick = true; break;
        case 'KeyE': this.hook = true; break;
        case 'KeyR': this.retract = true; break;
      }
    });
    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'ArrowLeft': this.left = false; break;
        case 'ArrowRight': this.right = false; break;
        case 'Space': this.kick = false; break;
        case 'KeyE': this.hook = false; break;
        case 'KeyR': this.retract = false; break;
      }
    });
  }

  update() {
    // Reset one-shot inputs
    this.hook = false;
    this.retract = false;
  }
}
