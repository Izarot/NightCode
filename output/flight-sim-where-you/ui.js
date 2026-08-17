function drawUI(ctx, W, H, state) {
  const { score, distance, status, speed, altitude, highScore, timer, started } = state;
  // Top bar
  ctx.fillStyle = 'rgba(26,16,51,0.6)';
    ctx.fillRect(0,0,W,70);
  // Score
  ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 28px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillText(score.toLocaleString(), W/2, 32);
  ctx.fillStyle = '#ffffff'; ctx.font = '14px Segoe UI';
  ctx.fillText(distance.toFixed(0)+'m', W/2, 54);
  // Status
  ctx.textAlign = 'right'; ctx.font = 'bold 16px Segoe UI';
  ctx.fillStyle = status==='CRASHED'?'#ff3b6b':status==='LANDED'?'#00e5a0':'#7df9ff';
  ctx.fillText(status, W-12, 30);
  ctx.fillStyle = '#aaa'; ctx.font = '11px Segoe UI';
  ctx.fillText('HI: '+highScore.toLocaleString(), W-12, 50);
  // Timer (speedrun) top-left
  ctx.textAlign='left'; ctx.fillStyle='#7df9ff'; ctx.font='bold 18px monospace';
  ctx.fillText(formatTime(timer), 12, 30);
  ctx.fillStyle='#aaa'; ctx.font='10px Segoe UI';
  ctx.fillText('SPEEDRUN', 12, 48);
  // Bottom bar
  ctx.fillStyle='rgba(26,16,51,0.6)'; ctx.fillRect(0,H-50,W,50);
  ctx.fillStyle='#7df9ff'; ctx.textAlign='left'; ctx.font='12px Segoe UI';
  ctx.fillText('SPEED', 12, H-30);
  ctx.fillStyle='#ffffff'; ctx.fillRect(12, H-22, (speed/120)*180, 8);
  ctx.strokeStyle='#7df9ff'; ctx.strokeRect(12, H-22, 180, 8);
  ctx.textAlign='right'; ctx.fillStyle='#7df9ff';
  ctx.fillText('ALT', W-12, H-30);
  ctx.fillStyle='#ffffff'; ctx.fillRect(W-192, H-22, (Math.max(0,altitude)/2000)*180, 8);
  ctx.strokeStyle='#7df9ff'; ctx.strokeRect(W-192, H-22, 180, 8);
  // Prompts
  if (!started) {
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ffd23f'; ctx.textAlign='center'; ctx.font='bold 36px Segoe UI';
    ctx.fillText('PAPER PLANE', W/2, H/2-40);
    ctx.fillStyle='#fff'; ctx.font='18px Segoe UI';
    ctx.fillText('Press SPACE / Tap to launch', W/2, H/2+10);
    ctx.font='13px Segoe UI'; ctx.fillStyle='#aaa';
    ctx.fillText('WASD / Arrows to fly • SPACE to flap • Shift+Space to dive', W/2, H/2+40);
  }
  if (status==='CRASHED' || status==='LANDED') {
    ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = status==='LANDED'?'#00e5a0':'#ff3b6b';
    ctx.textAlign='center'; ctx.font='bold 42px Segoe UI';
    ctx.fillText(status==='LANDED'?'LANDED!':'GAME OVER', W/2, H/2-30);
    ctx.fillStyle='#ffd23f'; ctx.font='24px Segoe UI';
    ctx.fillText('Score: '+score.toLocaleString(), W/2, H/2+10);
    ctx.fillStyle='#fff'; ctx.font='16px Segoe UI';
    ctx.fillText('Tap / Press R to restart', W/2, H/2+50);
  }
}
function formatTime(t){ const s=Math.floor(t/1000); const ms=Math.floor((t%1000)/10); return String(s).padStart(2,'0')+':'+String(ms).padStart(2,'0'); }
