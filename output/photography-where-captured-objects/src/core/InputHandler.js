export class InputHandler {
  constructor() {
    this.keys = {};
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.touchX = 0;
    this.touchY = 0;
    this.touchActive = false;
    this.aimAngle = 0;
    this.shutterPressed = false;
    this.shutterCallback = null;
    this.joystick = { x: 0, y: 0 };

    this.setupKeyboard();
    this.setupMouse();
    this.setupTouch();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        this.shutterPressed = true;
        if (this.shutterCallback) this.shutterCallback();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'Space') {
        this.shutterPressed = false;
      }
    });
  }

  setupMouse() {
    window.addEventListener('mousemove', (e) => {
      const rect = e.target.getBoundingClientRect ? e.target.getBoundingClientRect() : { left: 0, top: 0 };
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.updateAimAngle(this.mouseX, this.mouseY);
    });

    window.addEventListener('mousedown', (e) => {
      this.mouseDown = true;
      if (this.shutterCallback) this.shutterCallback();
    });

    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
  }

  setupTouch() {
    window.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.touchActive = true;
      this.touchX = touch.clientX;
      this.touchY = touch.clientY;
      this.updateAimAngle(this.touchX, this.touchY);
      if (this.shutterCallback) this.shutterCallback();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.touchX = touch.clientX;
      this.touchY = touch.clientY;
      this.updateAimAngle(this.touchX, this.touchY);
    }, { passive: false });

    window.addEventListener('touchend', () => {
      this.touchActive = false;
    });
  }

  updateAimAngle(x, y) {
    // Aim angle relative to center of screen (avatar position)
    const centerX = 400;
    const centerY = 300;
    this.aimAngle = Math.atan2(y - centerY, x - centerX);
  }

  update() {
    // Reset shutter press flag
    this.shutterPressed = false;
  }

  getMovementVector() {
    let mx = 0, my = 0;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) mx -= 1;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) mx += 1;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) my -= 1;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) my += 1;
    return { x: mx, y: my };
  }

  isSprinting() {
    return this.keys['ShiftLeft'] || this.keys['ShiftRight'];
  }

  setShutterPressed(value) {
    this.shutterPressed = value;
  }

  onShutter(callback) {
    this.shutterCallback = callback;
  }

  getAimAngle() {
    return this.aimAngle;
  }
}
