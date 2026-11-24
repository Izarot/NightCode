const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = window.innerWidth;
let H = window.innerHeight;
canvas.width = W;
canvas.height = H;
function resize() { W = window.innerWidth; H = window.innerHeight; canvas.width = W; canvas.height = H; }
window.addEventListener('resize', resize);
resize();
const COLORS = { bg: '#0a0a0f', cyan: '#00f2ff', magenta: '#ff00ff', red: '#ff3131', slate: '#2b2b3a' };
let highScore = Number(localStorage.getItem('railbreaker_high_score') || 0);
localStorage.setItem('railbreaker_high_score', String(highScore));
let startTime = performance.now();
let timerId = setInterval(() => { const elapsed = (performance.now() - startTime) / 1000; }, 100);
function loop() { ctx.fillStyle = COLORS.bg; ctx.fillRect(0, 0, W, H); ctx.fillStyle = COLORS.cyan; ctx.fillRect(W / 2 - 24, H / 2 - 24, 48, 48); ctx.strokeStyle = COLORS.cyan; ctx.beginPath(); ctx.moveTo(W / 2 - 20, H / 2); ctx.lineTo(W / 2 - 10, H / 2); ctx.moveTo(W / 2 + 10, H / 2); ctx.lineTo(W / 2 + 20, H / 2); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.fillText('TIME ' + Math.floor(elapsed), 20, 40); requestAnimationFrame(loop); }
loop();
function beep() { try { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 440; g.gain.value = 0.1; o.start(); o.stop(ctx.currentTime + 0.1); } catch (e) { } }
function shoot() { beep(); }