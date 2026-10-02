let time = 0;
export function updateTimer(dt) { time += dt; }
export function drawTimer(ctx) {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '16px monospace';
  ctx.fillText(`Time: ${time.toFixed(2)}s`, 10, 30);
}
