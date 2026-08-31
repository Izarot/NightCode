const TYPES = [
  { c1:'#ff2bd6', c2:'#6e2bff', pts:10 },
  { c1:'#2bf0ff', c2:'#6e2bff', pts:15 },
  { c1:'#ffae00', c2:'#ff2bd6', pts:20 }
];
export class Invader {
  constructor(x, y, row, col) {
    this.x = x; this.y = y;
    this.r = 18; this.w = 36; this.h = 28;
    this.row = row; this.col = col;
    this.type = TYPES[Math.min(row, 2)];
    this.frame = 0;
    this.dead = false;
    this.expl = 0;
    this.pts = this.type.pts;
  }
  update(dt) {
    if (this.expl > 0) { this.expl += dt; return; }
    this.frame = (this.frame + 0.04) % 2;
  }
  draw(ctx) {
    if (this.expl > 0) {
      const t = Math.min(1, this.expl / 0.5);
      ctx.fillStyle = `rgba(255,255,255,${1-t})`;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r*(1+t), 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = `rgba(255,140,0,${1-t})`;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r*(1.5+t), 0, Math.PI*2); ctx.fill();
      return;
    }
    const ox = this.frame > 1 ? 2 : 0;
    ctx.fillStyle = this.type.c1;
    ctx.fillRect(this.x-18, this.y-14, 36, 24);
    ctx.fillStyle = '#06041a';
    ctx.fillRect(this.x-14+ox, this.y-8, 6, 6);
    ctx.fillRect(this.x+8-ox, this.y-8, 6, 6);
    ctx.fillStyle = this.type.c2;
    ctx.fillRect(this.x-12, this.y+6, 24, 4);
    ctx.fillRect(this.x-6, this.y-14, 12, 4);
  }
}
