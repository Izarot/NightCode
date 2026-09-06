import { W, H, mulberry32 } from './utils.js';
export class Star {
  constructor() { this.x = 0; this.y = 0; this.z = 0; this.size = 1; this.color = '#fff'; }
  init(x, y, z) { this.x = x; this.y = y; this.z = z; this.size = z; this.color = z > 0.7 ? '#aaccff' : (z > 0.4 ? '#88aaff' : '#4466aa'); }
}
export class StarField {
  constructor(count = 120, seed = 1) {
    this.stars = []; this.rng = mulberry32(seed);
    for (let i = 0; i < count; i++) {
      const s = new Star();
      s.init(this.rng() * W, this.rng() * H, this.rng());
      this.stars.push(s);
    }
    this.t = 0;
  }
  update(dt, speed) {
    this.t += dt;
    const flow = speed * 0.0006;
    for (let s of this.stars) {
      s.x -= flow * (0.3 + s.z) * dt * 60;
      if (s.x < 0) s.x += W;
    }
  }
  draw(ctx) {
    ctx.fillStyle = '#000018';
    ctx.fillRect(0, 0, W, H);
    for (let s of this.stars) {
      const tw = 0.6 + 0.4 * Math.sin(this.t * 2 + s.x * 0.01);
      ctx.globalAlpha = (0.3 + s.z * 0.7) * tw;
      ctx.fillStyle = s.color;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 8; i++) {
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.03 + 0.02 * Math.sin(this.t + i)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, i * (H / 8) + (this.t * 30) % (H / 8));
      ctx.lineTo(W, i * (H / 8) + (this.t * 30) % (H / 8));
      ctx.stroke();
    }
  }
}
