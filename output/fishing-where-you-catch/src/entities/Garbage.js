const TYPES = [
  { type: 'bottle', points: 10, health: 2, color: '#ff6b6b', size: 16 },
  { type: 'net', points: 20, health: 5, color: '#ffd93d', size: 20 },
  { type: 'tire', points: 30, health: 8, color: '#6a0572', size: 24 },
  { type: 'barrel', points: 50, health: 12, color: '#ff9e00', size: 28 }
];
export class Garbage {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.type = TYPES[Math.floor(Math.random() * TYPES.length)];
    this.bob = Math.random() * Math.PI * 2;
    this.caught = false;
  }
  update(dt) {
    this.bob += dt * 2;
    this.y += Math.sin(this.bob) * 0.2;
  }
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(this.bob) * 3);
    ctx.fillStyle = this.type.color;
    ctx.fillRect(-this.type.size / 2, -this.type.size / 2, this.type.size, this.type.size);
    ctx.restore();
  }
}
