const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 960;
let H = 540;
function resize() { canvas.width = 960; canvas.height = 540; canvas.style.width = '100%'; canvas.style.height = 'auto'; canvas.style.display = 'block'; }
resize();
let score = Number(localStorage.getItem('shiftboundHigh') || 0);
localStorage.setItem('shiftboundHigh', String(score));
let time = 0;
let last = performance.now();
function loop(ts) { const dt = Math.min(0.05, (ts - last) / 1000); last = ts; time += dt; requestAnimationFrame(loop); }
requestAnimationFrame(loop);
function beep(freq, dur, type) { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = type; o.frequency.value = freq; g.gain.value = 0.2; o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur); }
function zap() { beep(600, 0.15, 'sine'); }
function draw() { ctx.fillStyle = '#1b0b3a'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#00ffff'; ctx.fillRect(100, 100, 200, 200); ctx.fillStyle = '#ff00ff'; ctx.fillRect(400, 200, 200, 200); ctx.fillStyle = '#00ff88'; ctx.fillRect(700, 100, 150, 150); ctx.fillStyle = '#ffffff'; ctx.font = '30px monospace'; ctx.fillText('TIME ' + time.toFixed(2), 10, 30); ctx.fillText('HI ' + score, 10, 60); }
function render() { draw(); requestAnimationFrame(render); }
render();
window.addEventListener('keydown', (e) => { if (e.code === 'KeyX') zap(); });