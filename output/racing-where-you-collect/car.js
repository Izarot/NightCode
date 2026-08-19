import { createVector } from './utils.js';

export class Car {
  constructor(canvas) {
    this.canvas = canvas;
    this.pos = createVector(100, canvas.height - 80);
    this.vel = createVector(0, 0);
    this.angle = 0;
    this.speed = 0;
    this.maxSpeed = 4;
    this.accel = 0.3;
    this.brake = 0.4;
    this.turnSpeed = 0.04;
    this.width = 64;
    this.height = 32;
    this.gearBonus = 0;
  }

  update(input, dt) {
    if (input.throttle) {
      this.vel.x += this.accel * dt;
    }
    if (input.brake) {
      this.vel.x -= this.brake * dt;
    }
    this.vel.x *= 0.99;
    this.vel.y *= 0.99;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    if (this.pos.x < -this.width) this.pos.x += this.canvas.width + this.width;
    if (this.pos.x > this.canvas.width) this.pos.x -= this.canvas.width + this.width;
    if (this.pos.y < -this.height) this.pos.y += this.canvas.height + this.height;
    if (this.pos.y > this.canvas.height) this.pos.y -= this.canvas.height + this.height;
    const speed = Math.hypot(this.vel.x, this.vel.y);
    const cap = this.maxSpeed + this.gearBonus;
    if (speed > cap) {
      const factor = cap / speed;
      this.vel.x *= factor;
      this.vel.y *= factor;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.restore();
  }
}