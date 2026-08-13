export function drawDebug(ctx, magnet, keys) {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(magnet.x, magnet.y, magnet.radius, 0, Math.PI*2);
  ctx.stroke();
  for (const key of keys) {
    const dx = key.x - magnet.x;
    const dy = key.y - magnet.y;
    const dist = Math.hypot(dx, dy);
    if (dist < magnet.radius) {
      ctx.beginPath();
      ctx.moveTo(magnet.x, magnet.y);
      ctx.lineTo(key.x, key.y);
      ctx.stroke();
    }
  }
  ctx.restore();
}