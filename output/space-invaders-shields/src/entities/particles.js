export class Particle {
  constructor(x, y, color) {
    this.x = x; this.y = y;
    this.vx = (Math.random()-0.5)*3;
    this.vy = (Math.random()-0.5)*3;
    this.life = 0.4 + Math.random()*0.4;
    this.age = 0;
    this.color = color;
    this.sz = 2 + Math.random()*3;
  }
  update(dt) {
    this.age += dt;
    this.x += this.vx; this.y += this.vy;
    this.vy += 0.1;
    return this.age < this.life;
  }
  draw(ctx) {
    const t = this.age / this.life;
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 1 - t;
    ctx.fillRect(this.x, this.y, this.sz*(1-t), this.sz*(1-t));
    ctx.globalAlpha = 1;
  }
}
