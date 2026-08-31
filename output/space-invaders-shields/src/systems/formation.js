import { Invader } from '../entities/invader.js';
export class Formation {
  constructor(w, h, wave=1) {
    this.w = w; this.h = h;
    this.wave = wave;
    this.dir = 1;
    this.speed = 1 + wave*0.15;
    this.shootT = 0;
    this.list = [];
    const cols = 10, rows = 5;
    const startX = (w - cols*60)/2;
    for (let r=0; r<rows; r++) {
      for (let c=0; c<cols; c++) {
        const inv = new Invader(startX + c*60 + 30, 80 + r*48, r, c);
        inv.pts = 10 + (wave-1)*5;
        this.list.push(inv);
      }
    }
  }
  bounds() {
    let minX=Infinity, maxX=-Infinity, maxY=-Infinity;
    for (const i of this.list) {
      if (i.expl > 0) continue;
      if (i.x - 18 < minX) minX = i.x - 18;
      if (i.x + 18 > maxX) maxX = i.x + 18;
      if (i.y + 14 > maxY) maxY = i.y + 14;
    }
    return {minX, maxX, maxY};
  }
  update(dt, bullets, ship) {
    let dxv = this.dir * this.speed;
    const b = this.bounds();
    if (b.minX < 10 || b.maxX > this.w - 10) {
      this.dir *= -1;
      dxv = 0;
      for (const i of this.list) i.y += 16;
    }
    for (const i of this.list) {
      if (i.expl > 0) continue;
      i.x += dxv;
      i.update(dt);
    }
    this.shootT -= dt;
    if (this.shootT <= 0 && this.list.some(i => i.expl === 0)) {
      const shooters = this.list.filter(i => i.expl === 0 && i.row === 4 - Math.floor(Math.random()*2));
      const s = shooters[Math.floor(Math.random()*shooters.length)];
      if (s) {
        const ang = Math.atan2(ship.y - s.y, ship.x - s.x);
        bullets.push({
          x:s.x, y:s.y+10,
          vx: Math.cos(ang)*4, vy: Math.sin(ang)*4,
          dmg:5, color:'#ff2bd6', friend:false
        });
        this.shootT = Math.max(0.4, 2 - this.wave*0.1);
      }
    }
    this.list = this.list.filter(i => i.expl < 0.5);
  }
  draw(ctx) { this.list.forEach(i => i.draw(ctx)); }
  alive() { return this.list.filter(i => i.expl === 0); }
}
