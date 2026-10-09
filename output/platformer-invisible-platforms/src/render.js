export function render(ctx, player, level, camera, speedrun, retries, highScore, gameState) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Background stars
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#111';
  for (let i = 0; i < 100; i++) {
    ctx.fillRect((i * 37) % w, (i * 53) % h, 1, 1);
  }

  const offsetX = -camera.x + w / 2;
  const offsetY = -camera.y + h / 2;
  ctx.save();
  ctx.translate(offsetX, offsetY);

  const tileSize = 32;
  const grid = level.tiles;
  const cols = level.cols;
  const rows = level.rows;

  // Proximity glow
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#00F0FF';
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const idx = ty * cols + tx;
      const tile = grid[idx];
      if (tile === 1) {
        const px = tx * tileSize;
        const py = ty * tileSize;
        const dist = Math.hypot(px + tileSize / 2 - player.x, py + tileSize / 2 - player.y);
        if (dist < 40 + player.width) {
          ctx.strokeStyle = 'rgba(0,240,255,0.3)';
          ctx.strokeRect(px, py, tileSize, tileSize);
        }
      }
    }
  }

  // Platforms
  ctx.shadowBlur = 15;
  for (let ty = 0; ty < rows; ty++) {
    for (let tx = 0; tx < cols; tx++) {
      const idx = ty * cols + tx;
      const tile = grid[idx];
      const px = tx * tileSize;
      const py = ty * tileSize;
      if (tile === 2) {
        ctx.fillStyle = '#004455';
        ctx.fillRect(px, py, tileSize, tileSize);
        ctx.strokeStyle = '#00F0FF';
        ctx.strokeRect(px, py, tileSize, tileSize);
      } else if (tile === 3) {
        ctx.fillStyle = '#FF0055';
        ctx.fillRect(px, py, tileSize, tileSize);
      } else if (tile === 4) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(px, py, tileSize, tileSize);
      } else if (tile === 5) {
        ctx.fillStyle = '#7000FF';
        ctx.fillRect(px, py, tileSize, tileSize);
      } else if (tile === 6) {
        ctx.fillStyle = '#00F0FF';
        ctx.fillRect(px, py, tileSize, tileSize);
      }
    }
  }

  // Player
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#FFFFFF';
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.width / 2, 0, Math.PI * 2);
  ctx.fill();

  // Player trail
  ctx.shadowBlur = 5;
  for (let i = 0; i < player.trail.length; i++) {
    const p = player.trail[i];
    ctx.globalAlpha = 0.3 - i * 0.05;
    ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // HUD
  ctx.font = '16px "Courier New"';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('LEVEL ' + (currentLevel + 1) + ' / 20', w / 2 - 60, 30);
  ctx.fillText('RETRIES: ' + retries, w - 120, 30);
  ctx.fillText('SPEEDRUN: ' + speedrun + 's', 20, 30);
  ctx.fillText('HIGH SCORE: ' + highScore + 's', 20, 50);

  // Focus bar
  ctx.fillStyle = 'rgba(112,0,255,0.5)';
  ctx.fillRect(20, h - 40, 150, 15);
  ctx.fillStyle = '#7000FF';
  ctx.fillRect(20, h - 40, player.focus / 100 * 150, 15);
  ctx.strokeStyle = '#FFFFFF';
  ctx.strokeRect(20, h - 40, 150, 15);
  ctx.fillText('FOCUS', 20, h - 55);
}
