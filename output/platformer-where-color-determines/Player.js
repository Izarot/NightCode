class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.color = 'green';
    this.health = 3;
    this.sprite = { frame: 0, frames: 4 };
    this.gravity = 2000;
    this.friction = 0.8;
    this.restitution = 0.0;
    this.stickyFactor = 0.0;
    this.input = new Input();
  }

  setColor(color) {
    this.color = color;
    this.updatePhysics();
  }

  updatePhysics() {
    switch (this.color) {
      case 'blue':
        this.gravity = 2000;
        this.friction = 0.1;
        this.restitution = 0.0;
        this.stickyFactor = 0.0;
        break;
      case 'red':
        this.gravity = 2000;
        this.friction = 0.8;
        this.restitution = 1.5;
        this.stickyFactor = 0.0;
        break;
      case 'green':
        this.gravity = 2000;
        this.friction = 0.8;
        this.restitution = 0.0;
        this.stickyFactor = 0.0;
        break;
      case 'yellow':
        this.gravity = 2000;
        this.friction = 0.8;
        this.restitution = 0.0;
        this.stickyFactor = 0.5;
        break;
      case 'purple':
        this.gravity = -2000;
        this.friction = 0.8;
        this.restitution = 0.0;
        this.stickyFactor = 0.0;
        break;
    }
  }

  update(delta) {
    this.handleInput();
    this.applyGravity(delta);
    this.applyFriction(delta);
    this.updatePosition(delta);
    this.resolveCollisions();
  }

  handleInput() {
    if (this.input.isPressed('ArrowLeft') || this.input.isPressed('KeyA')) {
      this.vx = -150;
    } else if (this.input.isPressed('ArrowRight') || this.input.isPressed('KeyD')) {
      this.vx = 150;
    } else {
      this.vx *= Math.pow(this.friction, delta * 60);
    }

    if (this.input.isPressed('ArrowUp') || this.input.isPressed('Space')) {
      this.vy = -400;
    }
  }

  applyGravity(delta) {
    this.vy += this.gravity * delta;
  }

  applyFriction(delta) {
    this.vx *= Math.pow(this.friction, delta * 60);
  }

  updatePosition(delta) {
    this.x += this.vx * delta;
    this.y += this.vy * delta;
  }

  resolveCollisions() {
    // Collision logic with tiles, enemies, etc.
  }

  draw(ctx) {
    // Draw sprite based on color and frame
  }
}

class Input {
  constructor() {
    this.keys = {};
    window.addEventListener('keydown', e => this.keys[e.code] = true);
    window.addEventListener('keyup', e => this.keys[e.code] = false);
  }

  isPressed(key) {
    return !!this.keys[key];
  }
}