const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = window.innerWidth;
const H = window.innerHeight;
canvas.width = W;
canvas.height = H;
let score = 0;
let highScore = Number(localStorage.getItem('punctHighScore') || 0);
let timeLeft = 120;
let last = 0;
let word = { x: 50, y: H / 2, vx: 2, vy: 0, w: 60, h: 40, color: '#00f5d4' };

function beep(freq, dur, type) {
  const a = new AudioContext();
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type || 'sine';
  o.frequency.value = freq;
  g.gain.value = 0.2;
  o.connect(g);
  g.connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur);
}

function update() {
  score++;
  timeLeft -= 0.016;
  word.x += word.vx;
  word.y += word.vy;
  word.vx *= 0.99;
  word.vy *= 0.99;
  if (word.x < 0) word.x = 0;
  if (word.x + word.w > W) word.x = W - word.w;
  if (word.y < 0) word.y = 0;
  if (word.y + word.h > H) word.y = H - word.h;
  if (timeLeft <= 0) {
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('punctHighScore', String(highScore));
    }
    alert('Game Over');
  }
}

function draw() {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = word.color;
  ctx.fillRect(word.x, word.y, word.w, word.h);
  ctx.fillStyle = '#ff6ec7';
  ctx.font = '48px sans-serif';
  ctx.fillText('P', word.x + 10, word.y + 35);
  ctx.fillStyle = '#00f5d4';
  ctx.font = '20px sans-serif';
  ctx.fillText('Score: ' + score, 10, 30);
  ctx.fillText('Time: ' + Math.max(0, Math.ceil(timeLeft)), W - 100, 30);
}

function loop(t) {
  const dt = last ? (t - last) / 1000 : 0;
  last = t;
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
  word.y = H / 2;
});

requestAnimationFrame(loop);

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp') word.vy = -2;
  if (e.key === 'ArrowDown') word.vy = 2;
  if (e.key === 'ArrowLeft') word.vx = -2;
  if (e.key === 'ArrowRight') word.vx = 2;
  beep(440, 0.05, 'sine');
});

window.addEventListener('keydown', e => {
  if (e.key === ' ') {
    beep(880, 0.1, 'triangle');
  }
});