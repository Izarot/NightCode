export function run(canvas) {
  const ctx = canvas.getContext('2d');
  let score = 0;
  const highScore = parseInt(localStorage.getItem('gearSync_hs_v1') || '0', 10);
  localStorage.setItem('gearSync_hs_v1', String(Math.max(highScore, score)));
  let startTime = performance.now();
  let lastTime = startTime;
  let speedrunTime = 0;
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function resumeAudio() { if (audioCtx.state === 'suspended') audioCtx.resume(); }
  window.addEventListener('pointerdown', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  function loop(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    speedrunTime += dt;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'hsl(200, 80%, 60%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px Orbitron, sans-serif';
    ctx.fillText('BEST: ' + highScore, 20, 60);
    ctx.fillText('TIME: ' + speedrunTime.toFixed(2), canvas.width - 150, 60);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}