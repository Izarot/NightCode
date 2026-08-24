export default class UI {
  constructor(game) {
    this.game = game;
  }
  draw(ctx) {
    const { width, height } = this.game.canvas;
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${this.game.score}`, 10, 30);
    ctx.fillText('Lives: ' + this.game.lives, width/2 - 60, 30);
    ctx.fillText('Balls: ' + this.game.balls.length, width - 100, 30);
    ctx.fillText('Time: ' + Math.floor(this.game.timeElapsed) + 's', width - 150, 30);
    ctx.fillText('Best: ' + this.game.highScore, width/2 - 80, 50);
    if (this.game.gameOver || this.game.win) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px monospace';
      ctx.fillText(this.game.gameOver ? 'Game Over' : 'Level Complete', width/2 - 80, height/2);
      ctx.font = '20px monospace';
      ctx.fillText('Press R to Restart', width/2 - 80, height/2 + 30);
    }
  }
}
