export class Hazard {
  constructor(x, y, w, h, type) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.type = type; // spike, blade
    this.timer = 0;
  }
  update(dt) { this.timer += dt; }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.type === 'spike') {
      ctx.fillStyle = '#f00';
      ctx.beginPath();
      ctx.moveTo(0, this.h);
      ctx.lineTo(this.w/2, 0);
      ctx.lineTo(this.w, this.h);
      ctx.fill();
    } else if (this.type === 'blade') {
      ctx.fillStyle = '#777';
      ctx.fillRect(0,0,this.w,this.h);
      const angle = this.timer * 0.005;
      ctx.save();
      ctx.translate(this.w/2, this.h/2);
      ctx.rotate(angle);
      ctx.fillStyle = '#f00';
      ctx.fillRect(-this.w/2, -2, this.w, 4);
      ctx.restore();
    }
    ctx.restore();
  }
}
