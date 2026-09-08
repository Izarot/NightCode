export class Input {
  constructor(canvas, game) {
    this.game = game;
    canvas.addEventListener('click', e => this.onClick(e));
    canvas.addEventListener('touchstart', e => { e.preventDefault(); this.onTouch(e); }, { passive: false });
    window.addEventListener('keydown', e => this.onKey(e));
  }
  getPos(e) {
    const rect = this.game.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * (this.game.width / rect.width), y: (clientY - rect.top) * (this.game.height / rect.height) };
  }
  onClick(e) { const p = this.getPos(e); this.hitTest(p); }
  onTouch(e) { const p = this.getPos(e); this.hitTest(p); }
  hitTest(p) {
    if (this.game.state === 'menu') { this.game.ui.handleMenuClick(p); return; }
    if (this.game.state === 'win') { this.game.ui.handleWinClick(p); return; }
    if (this.game.state === 'paused') { this.game.ui.handlePauseClick(p); return; }
    this.game.tubes.forEach((t, i) => {
      if (p.x >= t.x && p.x <= t.x + t.w && p.y >= t.y && p.y <= t.y + t.h) {
        this.game.onTubeTap(i);
      }
    });
    this.game.ui.hitTest(p);
  }
  onKey(e) {
    if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.game.undo(); }
    if (e.key === 'h') this.game.hint();
    if (e.key === 'Escape') this.game.pause();
    if (e.key === 'r') this.game.restart();
  }
}