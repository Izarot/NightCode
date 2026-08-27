import { CONFIG, Utils } from './utils.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.health = 5;
    this.maxHealth = 5;
    this.radius = 12;
    this.maxSpeed = CONFIG.PLAYER_MAX_SPEED;
    this.acceleration = CONFIG.PLAYER_ACCELERATION;
    this.friction = CONFIG.PLAYER_FRICTION;
    this.rotationSpeed = CONFIG.PLAYER_ROTATION_SPEED;
    this.keys = {};
  }

  update(dt, mouseAngle) {
    this.angle = Utils.lerpAngle(this.angle, mouseAngle, this.rotationSpeed * dt);

    // Thrust forward (W / Up)
    if (this.keys['w'] || this.keys['ArrowUp']) {
      const thrustDir = this.angle;
      this.vx += Math.cos(thrustDir) * this.acceleration * dt;
      this.vy += Math.sin(thrustDir) * this.acceleration * dt;
    }

    // Reverse (S / Down)
    if (this.keys['s'] || this.keys['ArrowDown']) {
      const thrustDir = this.angle + Math.PI;
      this.vx += Math.cos(thrustDir) * this.acceleration * dt;
      this.vy += Math.sin(thrustDir) * this.acceleration * dt;
    }

    // Apply friction
    this.vx *= Math.pow(1 - this.friction * dt, 1);
    this.vy *= Math.pow(1 - this.friction * dt, 1);

    // Limit speed
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Wrap around
    if (this.x < 0) this.x = CONFIG.CANVAS_WIDTH;
    if (this.x > CONFIG.CANVAS_WIDTH) this.x = 0;
    if (this.y < 0) this.y = CONFIG.CANVAS_HEIGHT;
    if (this.y > CONFIG.CANVAS_HEIGHT) this.y = 0;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = CONFIG.COLORS.player;
    ctx.strokeStyle = CONFIG.COLORS.playerOutline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-10, 8);
    ctx.lineTo(10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'BODY') {
    player.keys[e.code] = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.target.tagName === 'BODY') {
    player.keys[e.code] = false;
  }
});

const player = new Player(0, 0);
