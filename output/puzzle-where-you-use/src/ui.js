export function renderHUD(ctx, magnet, score, par, startTime, highScore) {
  const barWidth = 200;
  const barHeight = 20;
  const x = 20;
  const y = 20;
  ctx.fillStyle = '#222';
  ctx.fillRect(x, y, barWidth, barHeight);
  const energyRatio = Math.max(0, Math.min(1, magnet.energy / magnet.maxEnergy));
  const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
  gradient.addColorStop(0, '#0f0');
  gradient.addColorStop(0.5, '#ff0');
  gradient.addColorStop(1, '#f00');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, barWidth * energyRatio, barHeight);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, barWidth, barHeight);
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Energy: ' + Math.round(magnet.energy) + '/' + magnet.maxEnergy, x + barWidth + 10, y + 15);
  ctx.textAlign = 'center';
  ctx.fillText('Moves: ' + magnet.moves + '/' + par, ctx.canvas.width/2, y + 15);
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Timer: ' + Math.floor((Date.now() - startTime)/1000) + 's', ctx.canvas.width - 120, y + 15);
  ctx.fillText('High Score: ' + highScore, ctx.canvas.width - 120, y + 35);
}
