const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = window.innerWidth;
let H = window.innerHeight;
canvas.width = W * devicePixelRatio;
canvas.height = H * devicePixelRatio;
canvas.style.width = W + 'px';
canvas.style.height = H + 'px';
ctx.scale(devicePixelRatio, devicePixelRatio);
let score = 0;
let best = Number(localStorage.getItem('dominoDashBest') || 0);
let state = 'menu';
let last = performance.now();
let raf = 0;
function loop(t) {
  let dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  if (state === 'playing') {
    score += dt * 10;
    if (score > best) {
      best = score;
      localStorage.setItem('dominoDashBest', String(best));
    }
  }
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#1b2735';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f8f8f2';
  ctx.font = '28px sans-serif';
  ctx.fillText('DOMINO DASH', W / 2, 60);
  ctx.fillStyle = '#cfd8dc';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 20, 40);
  ctx.fillText('Best: ' + Math.floor(best), W - 120, 40);
  if (state === 'playing') {
    ctx.fillStyle = '#4dd0e1';
    ctx.fillRect(W / 2 - 60, 80, 120, 8);
  }
  if (state === 'gameover') {
    ctx.fillStyle = '#e74c3c';
    ctx.font = '30px sans-serif';
    ctx.fillText('GAME OVER', W / 2, H / 2);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), W / 2 - 60, H / 2 + 40);
    ctx.fillText('Press R to restart', W / 2 - 80, H / 2 + 70);
  }
  raf = requestAnimationFrame(loop);
}
function start() {
  state = 'playing';
  score = 0;
}
function gameOver() {
  state = 'gameover';
  if (score > best) {
    best = score;
    localStorage.setItem('dominoDashBest', String(best));
  }
}
window.addEventListener('keydown', (e) => {
  if (e.key === ' ') start();
  if (e.key === 'r' && state === 'gameover') start();
});
window.addEventListener('resize', () => {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * devicePixelRatio;
  canvas.height = H * devicePixelRatio;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(devicePixelRatio, devicePixelRatio);
});
raf = requestAnimationFrame(loop);