const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('scoreVal');

let gameState = 'menu';
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let startTime = 0;
let lastTime = 0;
let player = { x: 0, y: 0, size: 20, speed: 5 };
let obstacles = [];
let keys = {};
let audioCtx = null;

const COLORS = {
  bg: '#0f0f2a',
  canvas: '#1a1a3e',
  player: '#4ecca3',
  obstacle: '#ff6b6b',
  hud: '#fff',
  timer: '#ffd93d'
};

function resize() {
  const w = Math.min(window.innerWidth, 600);
  canvas.width = w;
  canvas.height = w * 1.5;
  player.x = canvas.width / 2;
  player.y = canvas.height - 60;
}

window.addEventListener('resize', resize);
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

startBtn.addEventListener('click', () => {
  gameState = 'playing';
  score = 0;
  startTime = performance.now();
  lastTime = startTime;
  obstacles = [];
  startBtn.style.display = 'none';
  gameLoop(startTime);
});

function playSound(freq, dur) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = 'square';
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

function spawnObstacle() {
  const size = 20 + Math.random() * 20;
  const x = Math.random() * (canvas.width - size);
  obstacles.push({ x, y: -size, size, speed: 2 + Math.random() * 3 });
}

function update(delta) {
  if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
  if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
  if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
  if (keys['ArrowDown'] || keys['s']) player.y += player.speed;

  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.y += o.speed;
    if (o.y > canvas.height + o.size) {
      obstacles.splice(i, 1);
      score++;
      playSound(300, 0.1);
    }
    if (rectsOverlap(player, o)) {
      gameState = 'gameover';
      playSound(100, 0.3);
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
      }
    }
  }

  if (Math.random() < 0.02) spawnObstacle();
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.size && a.x + a.size > b.x &&
         a.y < b.y + b.size && a.y + a.size > b.y;
}

function draw() {
  ctx.fillStyle = COLORS.canvas;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = COLORS.player;
  ctx.fillRect(player.x, player.y, player.size, player.size);

  ctx.fillStyle = COLORS.obstacle;
  obstacles.forEach(o => {
    ctx.fillRect(o.x, o.y, o.size, o.size);
  });

  ctx.fillStyle = COLORS.hud;
  ctx.font = '18px Arial';
  ctx.fillText('High Score: ' + highScore, 10, canvas.height - 10);
}

function gameLoop(timestamp) {
  if (gameState !== 'playing') return;
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  update(delta);
  draw();

  const elapsed = ((timestamp - startTime) / 1000).toFixed(2);
  timerEl.textContent = elapsed;
  scoreEl.textContent = score;

  requestAnimationFrame(gameLoop);
}

resize();
