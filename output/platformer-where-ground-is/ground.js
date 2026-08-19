export class GroundSystem {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.baseColor = 'hsl(200,30%,80%)';
    this.effects = [];
  }
  addStep(x, y, color) {
    this.effects.push({x, y, r:32, age:0, color});
  }
  update() {
    this.effects.forEach(e => e.age++);
    this.effects = this.effects.filter(e => e.age < 180);
  }
  render() {
    this.ctx.fillStyle = this.baseColor;
    this.ctx.fillRect(0,0,this.width,this.height);
    this.effects.forEach(e => {
      const alpha = 1 - e.age/180;
      this.ctx.fillStyle = e.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;
  }
}