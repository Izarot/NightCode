import { CONFIG } from './utils.js';

export class UIManager {
  constructor() {
    this.font = '16pt "Segoe UI"';
  }

  render(ctx, state) {
    // Health bar
    ctx.fillStyle = CONFIG.COLORS.healthBg;
    ctx.fillRect(10, CONFIG.CANVAS_HEIGHT - 30, 200, 12);
    const healthPct = state.health / state.maxHealth;
    ctx.fillStyle = healthPct > 0.5 ? CONFIG.COLORS.healthHigh : healthPct > 0.25 ? CONFIG.COLORS.healthMid : CONFIG.COLORS.healthLow;
    ctx.fillRect(10, CONFIG.CANVAS_HEIGHT - 30, 200 * healthPct, 12);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, CONFIG.CANVAS_HEIGHT - 30, 200, 12);

    // Score
    ctx.fillStyle = CONFIG.COLORS.score;
    ctx.font = '16pt "Segoe UI"';
    ctx.fillText(`Score: ${state.score}`, 10, 30);

    // Wave and timer
    ctx.fillStyle = '#ffffff';
    ctx.font = '14pt "Segoe UI"';
    const minutes = Math.floor(state.gameTime / 60);
    const seconds = Math.floor(state.gameTime % 60);
    ctx.fillText(`Wave ${state.wave} / ${minutes}:${seconds.toString().padStart(2, '0')}`, CONFIG.CANVAS_WIDTH / 2 - 60, 30);

    // High score
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`High Score: ${state.highScore}`, 10, 50);

    // Pause button
    ctx.fillStyle = CONFIG.COLORS.pauseBtn;
    ctx.fillRect(CONFIG.CANVAS_WIDTH - 40, 10, 30, 30);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(CONFIG.CANVAS_WIDTH - 40, 10, 30, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14pt "Segoe UI"';
    ctx.fillText('⋮', CONFIG.CANVAS_WIDTH - 30, 30);

    // Game over
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      ctx.fillStyle = '#ff4444';
      ctx.font = '36pt "Segoe UI"';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
      ctx.font = '18pt "Segoe UI"';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Score: ${state.score} | High Score: ${state.highScore}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 40);
      ctx.fillText('Refresh to restart', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 80);
      ctx.textAlign = 'left';
    }

    if (state.paused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24pt "Segoe UI"';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
      ctx.textAlign = 'left';
    }
  }
}
