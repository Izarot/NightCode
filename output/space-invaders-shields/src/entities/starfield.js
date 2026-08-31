export class Star {
  constructor(w, h, layer) {
    this.layer = w;
    this.reset(h);
    this.y = Math.random() * h;
  }
  reset(h) {
    this.x = Math.random() * this.layer;
    this.y = -5;
    this.sz = 1 + Math.random() * 2;
    this.sp = 0.15 + Math.random() * 0.45;
    this.c = ['#6e2bff','#ff2bd6','#2bf0ff','#fff'][Math.floor(Math.random()*4)];
  }
  update(h) {
    this.y += this.sp * (1 + this.layer/1200);
    if (this.y > h + 5) this.reset(h);
  }
  draw(ctx) {
    ctx.fillStyle = this.c;
    ctx.fillRect(this.x, this.y, this.sz, this.sz);
  }
}
export class Starfield {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.stars = [];
    for (let i = 0; i < 90; i++) this.stars.push(new Star(w, h, Math.random()));
  }
  update() { this.stars.forEach(s => s.update(this.h)); }
  draw(ctx) {
    this.stars.forEach(s => s.draw(ctx));
  }
}
