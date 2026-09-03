export class Hud {
  constructor(ctx) {
    this.ctx = ctx;
  }
  render(players, timer, round) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = '18px serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    // P1
    ctx.textAlign = 'left';
    ctx.fillText(players[0].id, 20, 40);
    this.drawBar(ctx, 20, 60, players[0].hp / players[0].maxHp, '#2ECC71', '#E74C3C');
    this.drawBar(ctx, 20, 80, players[0].tempo / 100, '#3498DB', '#F39C12');
    // P2
    ctx.textAlign = 'right';
    ctx.fillText(players[1].id, 1260, 40);
    this.drawBar(ctx, 860, 60, players[1].hp / players[1].maxHp, '#2ECC71', '#E74C3C');
    this.drawBar(ctx, 860, 80, players[1].tempo / 100, '#3498DB', '#F39C12');
    // Timer
    ctx.textAlign = 'center';
    ctx.font = '48px monospace';
    ctx.fillStyle = timer < 10 ? '#E74C3C' : '#FFD700';
    ctx.fillText(Math.max(0, Math.floor(timer)).toString().padStart(2, '0'), 640, 50);
    // Round
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('ROUND ' + round, 640, 80);
    ctx.restore();
  }
  drawBar(ctx, x, y, ratio, c1, c2) {
    const w = 280;
    const h = 16;
    const color = ratio > 0.5 ? c1 : ratio > 0.25 ? '#F1C40F' : c2;
    ctx.fillStyle = '#333';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * ratio, h);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }
}