const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');
const centerMsg = document.getElementById('center-message');
const startBtn = document.getElementById('start-btn');

const COLORS = {
  bg: '#050510',
  player: '#00ffc8',
  playerGlow: '#00ffc8',
  obstacle: '#ff006e',
  obstacleGlow: '#ff006e',
  platform: '#8338ec',
  platformGlow: '#8338ec',
  particle: ['#00ffc8', '#ff006e', '#8338ec', '#ffbe0b', '#fb5607'],
  text: '#ffffff',
  grid: 'rgba(0, 255, 200, 0.05)'
};

let width = 0, height = 0, dpr = 1;
function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = Math.floor(rect.width * dpr);
  height = Math.floor(rect.height * dpr);
  canvas.width = width;
  canvas.height = height;
  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
}
window.addEventListener('resize', resize);
resize();

const GAME_W = canvas.parentElement.clientWidth;
const GAME_H = canvas.parentElement.clientHeight;
const SCALE = GAME_W / 360;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, dur, type='square', vol=0.1, start=0) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain).connect(audioCtx.destination);
  const t = audioCtx.currentTime + start;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t);
  osc.stop(t + dur);
}
function sfxJump() { playTone(440, 0.1, 'sine', 0.15); playTone(880, 0.08, 'sine', 0.1, 0.02); }
function sfxScore() { playTone(660, 0.08, 'triangle', 0.12); playTone(880, 0.08, 'triangle', 0.1, 0.05); playTone(1320, 0.1, 'triangle', 0.08, 0.1); }
function sfxHit() { playTone(200, 0.3, 'sawtooth', 0.2); playTone(100, 0.4, 'sawtooth', 0.15, 0.05); }
function sfxStart() { playTone(220, 0.1, 'square', 0.15); playTone(330, 0.1, 'square', 0.12, 0.08); playTone(440, 0.15, 'square', 0.1, 0.16); }

let highScore = parseInt(localStorage.getItem('neonDashHighScore') || '0');
highscoreEl.textContent = highScore;

const GRAVITY = 0.5 * SCALE;
const JUMP_FORCE = -13 * SCALE;
const MOVE_SPEED = 7 * SCALE;
const BASE_SCROLL_SPEED = 4 * SCALE;
const MAX_SCROLL_SPEED = 14 * SCALE;

let player = { x: 0, y: 0, w: 36*SCALE, h: 36*SCALE, vy: 0, onGround: false, invincible: 0 };
let obstacles = [];
let platforms = [];
let particles = [];
let scrollSpeed = BASE_SCROLL_SPEED;
let score = 0;
let time = 0;
let running = false;
let lastTime = 0;
let spawnTimer = 0;
let difficulty = 1;
let screenShake = 0;

const keys = { left: false, right: false };
window.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if (e.code === 'Space' && running) { if (player.onGround) { player.vy = JUMP_FORCE; player.onGround = false; sfxJump(); } }
  if (e.code === 'Space' && !running) startGame();
});
window.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
});

let touchX = null;
canvas.addEventListener('touchstart', e => { e.preventDefault(); touchX = e.touches[0].clientX; if (!running) startGame(); }, { passive: false });
canvas.addEventListener('touchmove', e => { e.preventDefault(); touchX = e.touches[0].clientX; }, { passive: false });
canvas.addEventListener('touchend', () => { touchX = null; });
startBtn.addEventListener('click', startGame);

function startGame() {
  if (running) return;
  running = true;
  centerMsg.style.display = 'none';
  sfxStart();
  resetGame();
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  player.x = GAME_W / 2 - player.w / 2;
  player.y = GAME_H - 100 * SCALE - player.h;
  player.vy = 0;
  player.onGround = true;
  player.invincible = 0;
  obstacles = [];
  platforms = [];
  particles = [];
  scrollSpeed = BASE_SCROLL_SPEED;
  score = 0;
  time = 0;
  difficulty = 1;
  spawnTimer = 0;
  screenShake = 0;
  scoreEl.textContent = '0';
  timerEl.textContent = '0.00s';
  createPlatform(GAME_W / 2 - 60*SCALE, GAME_H - 100*SCALE, 120*SCALE);
}

function createPlatform(x, y, w) {
  platforms.push({ x, y, w, h: 16*SCALE, passed: false });
}

function spawnObstacle() {
  const gap = 120 * SCALE;
  const platform = platforms[platforms.length - 1];
  if (!platform) return;
  const type = Math.random() < 0.6 ? 'spike' : 'block';
  const size = (30 + Math.random() * 20) * SCALE;
  const x = platform.x + Math.random() * (platform.w - size);
  obstacles.push({ x, y: platform.y - size, w: size, h: size, type, passed: false });
}

function addParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (2 + Math.random() * 5) * SCALE;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      decay: 0.02 + Math.random() * 0.03,
      size: (2 + Math.random() * 4) * SCALE,
      color
    });
  }
}

function gameLoop(now) {
  if (!running) return;
  const dt = Math.min((now - lastTime) / 16.67, 3);
  lastTime = now;
  time += dt / 60;
  timerEl.textContent = time.toFixed(2) + 's';

  difficulty = 1 + time * 0.08;
  scrollSpeed = Math.min(BASE_SCROLL_SPEED * difficulty, MAX_SCROLL_SPEED);

  if (keys.left) player.x -= MOVE_SPEED * dt;
  if (keys.right) player.x += MOVE_SPEED * dt;
  if (touchX !== null) {
    const targetX = (touchX / dpr) - player.w / 2;
    player.x += (targetX - player.x) * 0.15 * dt;
  }
  player.x = Math.max(0, Math.min(GAME_W - player.w, player.x));

  player.vy += GRAVITY * dt;
  player.y += player.vy * dt;
  player.onGround = false;

  platforms.forEach(p => {
    p.y += scrollSpeed * dt;
    if (player.vy > 0 && player.y + player.h >= p.y && player.y + player.h - player.vy * dt <= p.y && player.x + player.w > p.x && player.x < p.x + p.w) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  });

  obstacles.forEach(o => {
    o.y += scrollSpeed * dt;
    if (!o.passed && o.y > player.y + player.h) {
      o.passed = true;
      score += 10;
      scoreEl.textContent = score;
      sfxScore();
      addParticles(o.x + o.w/2, o.y + o.h/2, COLORS.particle[Math.floor(Math.random()*COLORS.particle.length)], 8);
    }
  });

  platforms = platforms.filter(p => p.y < GAME_H + 50*SCALE);
  obstacles = obstacles.filter(o => o.y < GAME_H + 50*SCALE);

  if (platforms.length === 0 || platforms[platforms.length - 1].y > 100*SCALE) {
    const lastY = platforms.length ? platforms[platforms.length - 1].y : GAME_H;
    const newY = lastY - (80 + Math.random() * 60) * SCALE;
    const w = (100 + Math.random() * 80) * SCALE;
    const x = Math.random() * (GAME_W - w);
    createPlatform(x, newY, w);
    if (Math.random() < 0.7) spawnObstacle();
  }

  if (player.invincible > 0) player.invincible -= dt;

  obstacles.forEach(o => {
    if (player.invincible <= 0 && player.x < o.x + o.w && player.x + player.w > o.x && player.y < o.y + o.h && player.y + player.h > o.y) {
      gameOver();
    }
  });

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1 * SCALE;
    p.life -= p.decay;
  });
  particles = particles.filter(p => p.life > 0);

  if (screenShake > 0) screenShake -= dt;

  render();
  requestAnimationFrame(gameLoop);
}

function gameOver() {
  running = false;
  sfxHit();
  screenShake = 15;
  player.invincible = 60;
  addParticles(player.x + player.w/2, player.y + player.h/2, COLORS.obstacle, 30);
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('neonDashHighScore', highScore);
    highscoreEl.textContent = highScore;
  }
  setTimeout(() => {
    centerMsg.style.display = 'flex';
    centerMsg.querySelector('.title').textContent = 'GAME OVER';
    centerMsg.querySelector('.subtitle').textContent = `Score: ${score} | Time: ${time.toFixed(2)}s`;
    startBtn.textContent = 'TRY AGAIN';
  }, 500);
}

function render() {
  const cw = GAME_W, ch = GAME_H;
  ctx.save();
  if (screenShake > 0) {
    ctx.translate((Math.random()-0.5)*screenShake, (Math.random()-0.5)*screenShake);
  }

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, cw, ch);

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  const gridSize = 40 * SCALE;
  const offset = (time * 50 * SCALE) % gridSize;
  for (let x = -offset; x < cw + gridSize; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke();
  }
  for (let y = -offset; y < ch + gridSize; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke();
  }

  platforms.forEach(p => {
    const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    grad.addColorStop(0, COLORS.platform);
    grad.addColorStop(1, '#5a189a');
    ctx.fillStyle = grad;
    ctx.shadowColor = COLORS.platformGlow;
    ctx.shadowBlur = 15;
    roundRect(ctx, p.x, p.y, p.w, p.h, 8*SCALE);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  obstacles.forEach(o => {
    ctx.shadowColor = COLORS.obstacleGlow;
    ctx.shadowBlur = 20;
    if (o.type === 'spike') {
      ctx.fillStyle = COLORS.obstacle;
      ctx.beginPath();
      ctx.moveTo(o.x + o.w/2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.lineTo(o.x, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    } else {
      const grad = ctx.createRadialGradient(o.x + o.w/2, o.y + o.h/2, 0, o.x + o.w/2, o.y + o.h/2, o.w/2);
      grad.addColorStop(0, '#ff4d94');
      grad.addColorStop(1, COLORS.obstacle);
      ctx.fillStyle = grad;
      roundRect(ctx, o.x, o.y, o.w, o.h, 4*SCALE);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  });

  ctx.shadowColor = COLORS.playerGlow;
  ctx.shadowBlur = 20;
  const pGrad = ctx.createRadialGradient(player.x + player.w/2, player.y + player.h/2, 0, player.x + player.w/2, player.y + player.h/2, player.w/2);
  pGrad.addColorStop(0, '#7dfff5');
  pGrad.addColorStop(1, COLORS.player);
  ctx.fillStyle = pGrad;
  roundRect(ctx, player.x, player.y, player.w, player.h, 8*SCALE);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(player.x + player.w * 0.3, player.y + player.h * 0.35, 3*SCALE, 0, Math.PI*2);
  ctx.arc(player.x + player.w * 0.7, player.y + player.h * 0.35, 3*SCALE, 0, Math.PI*2);
  ctx.fill();

  particles.forEach(p => {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
