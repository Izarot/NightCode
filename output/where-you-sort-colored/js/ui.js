export class UI {
  constructor(game) { this.game = game; this.width = 0; this.height = 0; }
  resize(w, h) { this.width = w; this.height = h; }
  draw(moves, timer, hints, state) {
    const { ctx } = this.game.renderer;
    ctx.save();
    ctx.font = 'bold 20px system-ui';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(`Level ${this.game.currentLevel + 1}`, 20, 35);
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(timer/60).toString().padStart(2,'0')}:${(timer%60).toFixed(0).padStart(2,'0')}`, this.width/2, 35);
    ctx.textAlign = 'right';
    ctx.fillText(`Moves: ${moves}`, this.width - 20, 35);
    const btnY = this.height - 50;
    const btnW = 80;
    const gap = 15;
    const startX = (this.width - (btnW * 3 + gap * 2)) / 2;
    this.drawBtn(ctx, startX, btnY, btnW, 40, '💡 Hint', hints > 0 ? '#f39c12' : '#555', hints === 0);
    this.drawBtn(ctx, startX + btnW + gap, btnY, btnW, 40, '↩ Undo', this.game.history.length > 0 ? '#3498db' : '#555', this.game.history.length === 0);
    this.drawBtn(ctx, startX + (btnW + gap) * 2, btnY, btnW, 40, '⏸ Pause', '#e74c3c', false);
    this.hintBtn = { x: startX, y: btnY, w: btnW, h: 40 };
    this.undoBtn = { x: startX + btnW + gap, y: btnY, w: btnW, h: 40 };
    this.pauseBtn = { x: startX + (btnW + gap) * 2, y: btnY, w: btnW, h: 40 };
    ctx.restore();
  }
  drawBtn(ctx, x, y, w, h, text, color, disabled) {
    ctx.fillStyle = disabled ? '#333' : color;
    ctx.globalAlpha = disabled ? 0.5 : 1;
    this.game.renderer.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w/2, y + h/2 + 5);
  }
  hitTest(p) {
    if (this.hintBtn && this.inBtn(p, this.hintBtn)) this.game.hint();
    else if (this.undoBtn && this.inBtn(p, this.undoBtn)) this.game.undo();
    else if (this.pauseBtn && this.inBtn(p, this.pauseBtn)) this.game.pause();
  }
  inBtn(p, b) { return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h; }
  showWin(moves, time, bestTime, bestMove, hasNext) {
    const toast = document.getElementById('toast');
    let msg = `Level Complete! ${Math.floor(time/60)}:${(time%60).toFixed(0).padStart(2,'0')}`;
    if (bestTime) msg += ' ⚡ New Best Time!'; if (bestMove) msg += ' 🏆 Fewest Moves!'; toast.textContent = msg; toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
    if (hasNext) setTimeout(() => this.game.nextLevel(), 1500);
  }
  showMenu(done, total) {}
  handleMenuClick(p) {}
  handleWinClick(p) {}
  handlePauseClick(p) {}
}