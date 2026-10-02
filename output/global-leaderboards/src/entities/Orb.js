export class Orb {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.width = 16; this.height = 16;
    this.collected = false;
    this.timer = 0;
  }
  update(dt) { if (!this.collected) this.timer += dt; }
  draw(ctx) {
    if (this.collected) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    const pulse = Math.sin(this.timer * 0.005) * 0.2 + 0.8;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(0,0,8*pulse,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}
