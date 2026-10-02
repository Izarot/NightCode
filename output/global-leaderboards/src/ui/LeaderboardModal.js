export class LeaderboardModal {
  constructor() {
    this.visible = false;
  }
  show() { this.visible = true; }
  hide() { this.visible = false; }
  render(ctx) {
    if (!this.visible) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#0ff';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Leaderboard (Stub)', ctx.canvas.width/2, 80);
    ctx.font = '24px sans-serif';
    ctx.fillText('No API connected yet.', ctx.canvas.width/2, ctx.canvas.height/2);
    ctx.restore();
  }
}
