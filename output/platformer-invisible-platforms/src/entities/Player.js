import { GRAVITY, MAX_SPEED, ACCEL, FRICTION_GROUND, FRICTION_AIR, JUMP_VELOCITY } from '../physics.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.focus = 100;
    this.maxFocus = 100;
    this.trail = [];
    this.state = 'idle';
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
    this.dashTime = 0;
    this.invincible = 0;
  }

  update(input, audio) {
    // Trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) this.trail.shift();

    // Coyote & buffer
    if (this.coyoteTime > 0) this.coyoteTime--;
    if (this.jumpBuffer > 0) this.jumpBuffer--;

    // Dash
    if (this.dashTime > 0) {
      this.dashTime--;
      this.invincible = 10;
    } else {
      if (input.dash && this.focus >= 20) {
        this.focus -= 20;
        this.dashTime = 10;
        audio.play('dash');
      }
    }

    if (this.invincible > 0) this.invincible--;

    // Movement
    if (input.left) this.vx -= ACCEL;
    if (input.right) this.vx += ACCEL;
    if (Math.abs(this.vx) > MAX_SPEED) this.vx = Math.sign(this.vx) * MAX_SPEED;

    if (!input.left && !input.right) {
      this.vx *= this.onGround ? FRICTION_GROUND : FRICTION_AIR;
    }

    // Jump
    if (input.jump) {
      if (this.onGround || this.coyoteTime > 0) {
        this.vy = JUMP_VELOCITY;
        this.onGround = false;
        this.coyoteTime = 0;
        audio.play('jump');
      } else if (this.jumpBuffer > 0) {
        this.vy = JUMP_VELOCITY;
        this.jumpBuffer = 0;
        audio.play('jump');
      }
    } else if (!input.jump && this.vy < 0) {
      this.vy *= 0.5;
    }

    // Pulse
    if (input.pulse && this.focus >= 10) {
      this.focus -= 10;
      audio.play('pulse');
    }

    // Focus regen
    if (this.focus < this.maxFocus) this.focus += 0.05;
  }
}
