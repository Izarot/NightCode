export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.color = COLORS;
  }

  clear() {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    gradient.addColorStop(0, this.color.BACKGROUND_START);
    gradient.addColorStop(1, this.color.BACKGROUND_END);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  }

  drawSnake(snake) {
    const ctx = this.ctx;
    // Head
    ctx.save();
    ctx.fillStyle = COLORS.SNAKE_HEAD;
    ctx.fillRect(snake.segments[0].x, snake.segments[0].y, CELL_SIZE, CELL_SIZE);
    ctx.restore();

    // Body
    ctx.fillStyle = COLORS.SNAKE_TAIL;
    for (let i = 1; i < snake.segments.length; i++) {
      ctx.fillRect(snake.segments[i].x, snake.segments[i].y, CELL_SIZE, CELL_SIZE);
    }
  }

  drawFood(food) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = food.color;
    ctx.beginPath();
    const x = food.x + CELL_SIZE / 2;
    const y = food.y + CELL_SIZE / 2;
    const radius = 8 + Math.sin(food.pulse) * 2;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPortals(portalSystem) {
    portalSystem.draw(this.ctx);
  }

  drawParticles(particleSystem) {
    particleSystem.draw(this.ctx);
  }

  drawHUD(state) {
    const ctx = this.ctx;
    ctx.fillStyle = this.color.HUD_TEXT;
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${state.score}`, 10, 20);
    ctx.fillText(`HI: ${state._getHighScore()}`, 10, 40);
    ctx.fillText(`LVL: ${state.level} ×${state.multiplier.toFixed(1)}`, 10, 60);
    ctx.fillText(`TIME: ${this._formatTime(state.gameStartTime)}`, VIRTUAL_WIDTH - 80, 20);
  }

  _formatTime(startTime) {
    const elapsed = Math.floor((performance.now() - startTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }
}