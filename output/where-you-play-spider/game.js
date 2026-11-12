const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = window.innerWidth;
let H = window.innerHeight;
canvas.width = W * window.devicePixelRatio;
canvas.height = H * window.devicePixelRatio;
canvas.style.width = W + 'px';
canvas.style.height = H + 'px';
ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
let altitude = 0;
let fuel = 100;
let health = 100;
let highScore = Number(localStorage.getItem('spiderHigh') || 0);
localStorage.setItem('spiderHigh', highScore);
let speedrun = 0;
let startTime = performance.now();
let audio;
function beep() { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); const o = audio.createOscillator(); const g = audio.createGain(); o.connect(g); g.connect(audio.destination); o.frequency.value = 440; g.gain.value = 0.1; o.start(); o.stop(audio.currentTime + 0.1); }
function loop(t) { requestAnimationFrame(loop); const dt = Math.min(0.016, (t - startTime) / 1000); startTime = t; speedrun += dt; altitude += dt * 0.01; fuel = Math.max(0, fuel - dt * 0.01); health = Math.max(0, health - dt * 0.001); if (fuel <= 0) beep(); if (altitude > highScore) { highScore = altitude; localStorage.setItem('spiderHigh', highScore); } ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#ff2d95'; ctx.beginPath(); ctx.arc(W / 2, H / 2, 30, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.fillText('Speedrun: ' + speedrun.toFixed(2) + 's', 20, H - 20); ctx.fillText('High: ' + highScore.toFixed(1), 20, H - 45); }
loop();