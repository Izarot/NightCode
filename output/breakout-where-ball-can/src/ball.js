export default class Ball {
  constructor(x, y, radius = 6, speed = 5, color = '#ff6b6b', canvas) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = speed * (Math.random() > 0.5 ? 1 : -1);
    this.vy = speed * (Math.random() > 0.5 ? 1 : -1);
    this.color = color;
    this.canvas = canvas;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    const w = this.canvas.width;
    const h = this.canvas.height;
    if (this.x + this.radius > w || this.x - this.radius < 0) this.vx *= -1;
    if (this.y + this.radius > h || this.y - this.radius < 0) this.vy *= -1;
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  split() {
    if (this.isSplit) return;
    this.isSplit = true;
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI / 3) - Math.PI / 6;
      const newVx = this.vx + Math.cos(angle) * 1;
      const newVy = this.vy + Math.sin(angle) * 1;
      const speed = Math.hypot(newVx, newVy);
      const newBall = new Ball(this.x, this.y, this.radius, speed, this.color, this.canvas);
      if (Game.activeBalls.length < 8) Game.activeBalls.push(newBall);
    }
  }
}
