class GameOverScreen {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.game = game;
    this.visible = false;
  }
  show() {
    this.visible = true;
    this.game.stop();
  }
  hide() {
    this.visible = false;
    this.game.start();
  }
  render() {
    if (!this.visible) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '48px Arial';
    ctx.fillText('Station Destroyed', w/2, h/2 - 30);
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + this.game.score, w/2, h/2 + 10);
    ctx.fillText('High Score: ' + this.game.highScore, w/2, h/2 + 35);
    const btnY = h/2 + 80;
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(w/2 - 80, btnY - 20, 160, 40);
    ctx.fillStyle = '#fff';
    ctx.fillText('Restart', w/2, btnY + 5);
  }
  onRestart(callback) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const btnY = h/2 + 80;
    ctx.fillStyle = '#4caf50';
    ctx.fillRect(w/2 - 80, btnY - 20, 160, 40);
    ctx.fillStyle = '#fff';
    ctx.fillText('Restart', w/2, btnY + 5);
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      if (clickX >= w/2 - 80 && clickX <= w/2 + 80 && clickY >= btnY - 20 && clickY <= btnY + 40) {
        callback();
      }
    });
  }
}