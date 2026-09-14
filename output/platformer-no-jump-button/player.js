import { Physics } from './physics.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 32;
    this.height = 48;
    this.onGround = false;
    this.wallLeft = false;
    this.wallRight = false;
    this.kickReady = true;
    this.kickCooldown = 0;
    this.chargeTimer = 0;
    this.maxCharge = 1.0;
    this.health = 3;
    this.lives = 3;
    this.score = 0;
    this.animState = 'idle';
    this.facing = 1;
    this.color = '#00e5ff';
  }

  update(dt, input, level, physics, audio, particles, hook) {
    const g = 0.6;
    this.vy += g;
    const maxWalk = 3;
    const accel = 0.5;
    const friction = 0.8;
    if (input.left) {
      this.vx -= accel;
      this.facing = -1;
    }
    if (input.right) {
      this.vx += accel;
      this.facing = 1;
    }
    if (!input.left && !input.right) {
      this.vx *= friction;
    }
    this.vx = Math.max(-maxWalk, Math.min(maxWalk, this.vx));
    this.x += this.vx;
    this.y += this.vy;
    this.onGround = false;
    this.wallLeft = false;
    this.wallRight = false;
    physics.resolveCollision(this, level);
    if (this.kickCooldown > 0) {
      this.kickCooldown -= dt;
      if (this.kickCooldown <= 0) this.kickReady = true;
    }
    if (input.kick && this.kickReady && (this.wallLeft || this.wallRight)) {
      this.chargeTimer += dt;
      if (this.chargeTimer > this.maxCharge) this.chargeTimer = this.maxCharge;
    } else {
      if (this.chargeTimer > 0 && this.kickReady && (this.wallLeft || this.wallRight)) {
        const factor = this.chargeTimer / this.maxCharge;
        const dir = this.wallLeft ? 1 : -1;
        this.vx = dir * 8 * factor;
        this.vy = -12 * factor;
        this.kickReady = false;
        this.kickCooldown = 0.5;
        this.chargeTimer = 0;
        this.animState = 'wallKick';
        audio.play('kick');
        particles.burst(this.x + this.width / 2, this.y + this.height / 2, 10);
      } else {
        this.chargeTimer = 0;
      }
    }
    if (input.hook && !hook.active && !hook.inFlight) {
      hook.shoot(this.x + this.width / 2, this.y + this.height / 2, this.facing, audio);
    }
    if (input.retract && hook.active) {
      hook.retract(this, audio, particles);
    }
    if (this.y > 800) {
      this.lives--;
      this.resetPosition();
    }
    this.animState = this.onGround ? (Math.abs(this.vx) > 0.1 ? 'run' : 'idle') : this.animState;
  }

  resetPosition() {
    this.x = 100;
    this.y = 500;
    this.vx = 0;
    this.vy = 0;
    this.health = 3;
  }

  render(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
}
