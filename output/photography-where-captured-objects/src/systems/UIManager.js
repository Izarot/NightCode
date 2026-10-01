export class UIManager {
  constructor(ctx, storage) {
    this.ctx = ctx;
    this.storage = storage;
    this.floatingTexts = [];
  }

  update(dt) {
    this.floatingTexts = this.floatingTexts.filter(text => text.life > 0);
    this.floatingTexts.forEach(text => {
      text.life -= dt;
      text.y -= 20 * dt;
      text.alpha -= dt * 2;
    });
  }

  showFloatingText(x, y, text) {
    this.floatingTexts.push({
      x, y, text,
      life: 1,
      alpha: 1
    });
  }

  render(score, timerStr, shots, combo, speedrunTime) {
    const ctx = this.ctx;

    // Score (top-left)
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 40);

    // Timer (top-center)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#4ecdc4';
    ctx.fillText(timerStr, 400, 40);

    // Speedrun timer (top-right corner)
    ctx.fillStyle = '#ffe66d';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Speedrun: ${speedrunTime.toFixed(2)}s`, 780, 30);

    // Shots remaining (top-right)
    ctx.fillStyle = '#ff6b6b';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`📷 ${shots}`, 780, 60);

    // Combo
    if (combo > 0) {
      ctx.fillStyle = '#a8e6cf';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Combo x${combo}`, 400, 80);
    }

    // Floating texts
    this.floatingTexts.forEach(text => {
      ctx.save();
      ctx.globalAlpha = text.alpha;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(text.text, text.x, text.y);
      ctx.restore();
    });
  }
}
