export class HUD {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(score, timer, lives, speedrunTime) {
    const ctx = this.ctx;
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`SCORE: ${score}`, 10, 20);
    ctx.fillText(`TIME: ${this.formatTime(timer)}`, 350, 20);
    ctx.fillText(`LIVES: ${lives}`, 700, 20);
    ctx.fillText(`SPEEDRUN: ${this.formatTime(speedrunTime)}`, 10, 40);
  }

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
