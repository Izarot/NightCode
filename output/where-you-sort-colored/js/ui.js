// ui.js
export class UI {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.ctx = canvas.getContext('2d');
  }

  drawHUD() {
    const game = this.game;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Time: ${game.formatTime(game.timer)}`, 10, 30);
    ctx.fillText(`Moves: ${game.moves}`, 10, 60);
    ctx.fillText(`Best: ${game.highScore}`, 10, 90);
    // hint button
    ctx.fillStyle = '#ff0';
    ctx.fillRect(w - 120, h - 50, 80, 30);
    ctx.fillStyle = '#fff';
    ctx.fillText('Hint', w - 115, h - 35);
    // undo button
    ctx.fillStyle = '#f00';
    ctx.fillRect(w - 200, h - 50, 80, 30);
    ctx.fillText('Undo', w - 195, h - 35);
  }
}