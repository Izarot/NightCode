export class HUD {
  render(ctx, {time, orbsCollected, orbsTotal, lives, rewindActive, highScore}) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${(time/1000).toFixed(2)}s`, 20, 30);
    ctx.fillText(`Orbs: ${orbsCollected}/${orbsTotal}`, 20, 60);
    ctx.fillText(`Lives: ${'❤️'.repeat(lives)}`, 20, 90);
    ctx.fillText(`High Score: ${highScore}`, 20, 120);
    if (rewindActive) {
      ctx.fillStyle = '#0ff';
      ctx.font = '20px sans-serif';
      ctx.fillText('REWIND ACTIVE', ctx.canvas.width/2 - 80, 30);
    }
    ctx.restore();
  }
}
