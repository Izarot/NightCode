export class HUD {
  constructor() {
    this.font = '14px monospace';
  }

  update(player, score, highScore, hook, startTime) {
    this.player = player;
    this.score = score;
    this.highScore = highScore;
    this.hook = hook;
    this.elapsed = (performance.now() - startTime) / 1000;
  }

  render(ctx) {
    ctx.fillStyle = '#fff';
    ctx.font = this.font;
    ctx.fillText(`Score: ${this.player.score}`, 10, 20);
    ctx.fillText(`High Score: ${this.highScore}`, 10, 40);
    ctx.fillText(`Lives: ${this.player.lives}`, 10, 60);
    ctx.fillText(`Time: ${this.elapsed.toFixed(2)}s`, 10, 80);
    if (this.hook.active) {
      ctx.fillText('Hook: LATCED', 10, 100);
    } else if (this.hook.inFlight) {
      ctx.fillText('Hook: FLYING', 10, 100);
    }
  }
}
