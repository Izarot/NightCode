import { W, H } from './utils.js';
export class ScreenShake {
  constructor() { this.intensity = 0; this.decay = 0; this.t = 0; this.x = 0; this.y = 0; }
  trigger(intensity = 12, decay = 0.5) { this.intensity = Math.max(this.intensity, intensity); this.decay = decay; }
  update(dt) {
    this.t += dt;
    if (this.intensity > 0) {
      this.x = (Math.random() - 0.5) * this.intensity * 2;
      this.y = (Math.random() - 0.5) * this.intensity * 2;
      this.intensity = Math.max(0, this.intensity - this.decay * dt * 60);
    } else { this.x = 0; this.y = 0; }
  }
  apply(ctx) { ctx.translate(this.x, this.y); }
}
export class FlashEffect {
  constructor() { this.intensity = 0; }
  trigger(v = 0.6) { this.intensity = Math.max(this.intensity, v); }
  update(dt) { this.intensity = Math.max(0, this.intensity - dt * 2); }
  draw(ctx) {
    if (this.intensity > 0) {
      ctx.globalAlpha = this.intensity;
      ctx.fillStyle = '#ff2244';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }
}
