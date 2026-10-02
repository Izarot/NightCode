import { sfx } from '../systems/Audio.js';

export const player = {
  x: 50, y: 300, vx: 0, vy: 0,
  w: 32, h: 32, scale: 1, targetScale: 1,
  onGround: false, chips: 0,
  move(dir) { this.vx += dir * 2000 * 0.016; },
  jump() { if (this.onGround) { this.vy = -700; sfx.jump(); this.onGround = false; } },
  toggleScale() { this.targetScale = this.scale === 1 ? 0.5 : 1; sfx.shrink(); },
  update(dt) {
    this.scale += (this.targetScale - this.scale) * 0.1;
    this.vy += 2500 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.8;
    if (this.y > 400) { this.y = 400; this.vy = 0; this.onGround = true; }
  },
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.fillStyle = this.scale < 0.6 ? '#00F0FF' : '#FF0055';
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.restore();
  }
};
export function updatePlayer(dt) { player.update(dt); }
