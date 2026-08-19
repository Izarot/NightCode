import { createVector } from './utils.js';

export class Gear {
  constructor(canvas) {
    this.canvas = canvas;
    this.pos = createVector(Math.random() * (canvas.width - 64), Math.random() * (canvas.height - 64));
    this.speedBonus = 0.5;
    this.collected = false;
  }

  update() {
    this.pos.x += (Math.random() - 0.5) * 0.2;
    this.pos.y += (Math.random() - 0.5) * 0.2;
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.pos.x * 0.01);
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isColliding(carPos, carRadius) {
    const dx = this.pos.x - carPos.x;
    const dy = this.pos.y - carPos.y;
    const dist = Math.hypot(dx, dy);
    return dist < carRadius + 16;
  }
}