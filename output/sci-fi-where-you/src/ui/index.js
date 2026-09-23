// UI module for NEXUS INFILTRATOR
import { Store } from '../store/index.js';

export function initUI(ctx, gameState) {
  const palette = {
    primary: '#00ffff',     // Cyan
    secondary: '#ff00ff',   // Magenta
    accent: '#00aaff',      // Electric Blue
    background: '#0a0a1a',
    text: '#ffffff',
    health: '#00ff88',
    energy: '#ff44aa',
    warning: '#ffaa00'
  };

  return {
    palette,
    update: (delta) => {
      // Update UI animations
    },
    render: () => {
      // Draw HUD
      drawHUD(ctx, gameState, palette);
      drawSpeedrunTimer(ctx, gameState, palette);
      drawHighScore(ctx, gameState, palette);
    }
  };
}

function drawHUD(ctx, gameState, palette) {
  // Health/Energy bar
  ctx.fillStyle = palette.background;
  ctx.fillRect(20, 20, 200, 30);
  ctx.strokeStyle = palette.primary;
  ctx.strokeRect(20, 20, 200, 30);

  // Health segment
  ctx.fillStyle = palette.health;
  const healthWidth = 100;
  ctx.fillRect(20, 20, healthWidth, 15);

  // Energy segment
  ctx.fillStyle = palette.energy;
  const energyWidth = 100;
  ctx.fillRect(20, 35, energyWidth, 15);

  // Hacking meter (radial)
  ctx.beginPath();
  ctx.arc(260, 35, 20, 0, Math.PI * 2);
  ctx.strokeStyle = palette.secondary;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawSpeedrunTimer(ctx, gameState, palette) {
  const minutes = Math.floor(gameState.speedrunTime / 60);
  const seconds = Math.floor(gameState.speedrunTime % 60);
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  ctx.fillStyle = palette.text;
  ctx.font = '18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('SPEEDRUN', 20, 70);
  ctx.fillStyle = palette.accent;
  ctx.fillText(timeStr, 20, 90);
}

function drawHighScore(ctx, gameState, palette) {
  ctx.fillStyle = palette.text;
  ctx.font = '18px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('HIGH SCORE', window.innerWidth - 20, 70);
  ctx.fillStyle = palette.warning;
  ctx.fillText(gameState.highScore.toString(), window.innerWidth - 20, 90);
}
