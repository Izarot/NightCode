export class Platform {
  constructor(x, y, w, h, type, freq=0, amp=0) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.type = type; // static, sinusoid
    this.freq = freq;
    this.amp = amp;
    this.offset = 0;
  }
  update(dt) {
    if (this.type === 'sinusoid') {
      this.offset = Math.sin(Date.now() * 0.001 * this.freq) * this.amp;
    }
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y + this.offset);
    ctx.fillStyle = '#555';
    ctx.fillRect(0,0,this.w,this.h);
    ctx.restore();
  }
}
