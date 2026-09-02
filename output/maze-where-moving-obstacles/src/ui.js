import { levels } from '../assets/levels.js';

export class UI {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
  }

  formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t * 100) % 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  renderHUD(game) {
    const ctx = this.ctx;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(10, 10, 220, 36);
    ctx.fillStyle = '#00e5ff';
    ctx.font = '16px "Share Tech Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`LVL ${game.currentLevelIndex + 1}  ${this.formatTime(game.elapsedTime)}`, 18, 34);
    ctx.restore();

    this.renderMinimap(game);
    this.renderStamina(game);
    this.renderProximityWarning(game);
  }

  renderMinimap(game) {
    const ctx = this.ctx;
    const size = 150;
    const x = 960 - size - 15;
    const y = 15;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);

    const scale = size / 960;
    ctx.fillStyle = 'rgba(0, 229, 255, 0.7)';
    ctx.fillRect(x + game.player.pos.x * scale - 2, y + game.player.pos.y * scale - 2, 4, 4);
    if (game.level.exitPos) {
      ctx.fillStyle = '#ffb703';
      ctx.fillRect(x + game.level.exitPos.x * scale - 3, y + game.level.exitPos.y * scale - 3, 6, 6);
    }
    game.sentries.forEach(s => {
      ctx.fillStyle = '#ff3864';
      ctx.beginPath();
      ctx.arc(x + s.pos.x * scale, y + s.pos.y * scale, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  renderStamina(game) {
    const ctx = this.ctx;
    const w = 200;
    const x = 15;
    const y = 540 - 30;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(x - 4, y - 4, w + 8, 18);
    const ratio = game.player.stamina / 100;
    const color = ratio < 0.3 ? '#ffb703' : '#00e5ff';
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * ratio, 10);
    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, w, 10);
    ctx.fillStyle = color;
    ctx.font = '12px "Share Tech Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('STAMINA', x, y - 6);
    ctx.restore();
  }

  renderProximityWarning(game) {
    let nearDist = Infinity;
    game.sentries.forEach(s => {
      const d = Math.hypot(s.pos.x - game.player.pos.x, s.pos.y - game.player.pos.y);
      if (s.detects(game.player) || d < 80) {
        if (d < nearDist) nearDist = d;
      }
    });
    if (nearDist < 100) {
      const intensity = Math.max(0, 1 - nearDist / 100);
      const pulse = 0.5 + Math.sin(performance.now() / 100) * 0.5;
      const alpha = intensity * 0.6 * pulse;
      const ctx = this.ctx;
      ctx.save();
      const grad = ctx.createRadialGradient(480, 270, 200, 480, 270, 500);
      grad.addColorStop(0, 'rgba(255, 56, 100, 0)');
      grad.addColorStop(1, `rgba(255, 56, 100, ${alpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 960, 540);
      ctx.restore();
    }
  }

  renderMenu(game) {
    const ctx = this.ctx;
    ctx.fillStyle = '#050b18';
    ctx.fillRect(0, 0, 960, 540);
    ctx.save();
    ctx.shadowBlur = 30;
    ctx.shadowColor = '#00e5ff';
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 64px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText("PREDATOR'S", 480, 200);
    ctx.fillText("LABYRINTH", 480, 270);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff3864';
    ctx.font = '20px "Share Tech Mono", monospace';
    const blink = Math.sin(performance.now() / 400) > 0;
    if (blink) ctx.fillText('[ PRESS ENTER TO START ]', 480, 360);

    ctx.fillStyle = '#ffb703';
    ctx.font = '14px "Share Tech Mono", monospace';
    ctx.fillText(`HIGH SCORE: ${this.formatTime(game.highScore || 0)}`, 480, 410);
    ctx.fillText('WASD/Arrows: Move  |  Shift: Sprint', 480, 450);
    ctx.fillText(`${levels.length} Levels of Cyber-Noir Stealth`, 480, 475);
    ctx.restore();
  }

  renderOverlay(game) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = `rgba(5, 11, 24, ${game.transitionAlpha * 0.85})`;
    ctx.fillRect(0, 0, 960, 540);
    const text = game.state === 'GAME_OVER' ? 'DETECTED' : 'LEVEL COMPLETE';
    const color = game.state === 'GAME_OVER' ? '#ff3864' : '#00e5ff';
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.font = 'bold 56px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    const offset = Math.sin(performance.now() / 80) * 4;
    ctx.fillText(text, 480 + offset, 260);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#d0e1ff';
    ctx.font = '18px "Share Tech Mono", monospace';
    if (game.state === 'LEVEL_COMPLETE') {
      ctx.fillText(`Time: ${this.formatTime(game.elapsedTime)}`, 480, 310);
    }
    if (game.transitionAlpha >= 1) {
      ctx.fillStyle = '#ffb703';
      const blink = Math.sin(performance.now() / 400) > 0;
      if (blink) ctx.fillText('[ PRESS ENTER ]', 480, 360);
    }
    ctx.restore();
  }
}
