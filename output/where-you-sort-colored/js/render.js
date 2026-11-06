// render.js
export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.tubeWidth = 80;
    this.tubeSpacing = 20;
    this.particleCount = 0;
    this.particles = [];
    this.drawBackground();
  }

  resize() {
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.drawBackground();
    this.redrawTubes();
  }

  drawBackground() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, 'var(--bg-start)');
    grad.addColorStop(1, 'var(--bg-end)');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  redrawTubes() {
    const game = this.game;
    const w = this.width;
    const h = this.height;
    const tubeWidth = this.tubeWidth;
    const spacing = this.tubeSpacing;
    const startX = (w - (game.tubes.length * tubeWidth + (game.tubes.length - 1) * spacing)) / 2;
    game.tubes.forEach((tube, i) => {
      tube.x = startX + i * (tubeWidth + spacing);
      tube.y = h * 0.6;
    });
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);
    this.drawBackground();
    this.redrawTubes();
    for (const tube of this.game.tubes) {
      tube.draw(ctx);
    }
    this.drawParticles();
    this.drawHUD();
  }

  drawParticles() {
    this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      if (!p) continue;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawHUD() {
    const game = this.game;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
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