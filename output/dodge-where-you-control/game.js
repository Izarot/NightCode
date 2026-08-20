// ===== Constants =====
const CONFIG = {
  CANVAS_WIDTH: 1024,
  CANVAS_HEIGHT: 576,
  PLAYER_RADIUS: 12,
  MAX_SPEED: 5,
  ACCELERATION: 0.4,
  FRICTION: 0.95,
  SPAWN_INTERVAL_BASE: 1200,
  SPAWN_INTERVAL_MIN: 400,
  ENEMY_SPEED_BASE: 2,
  ENEMY_SPEED_MAX: 4,
  MAX_ENEMIES_MOBILE: 30,
  MAX_ENEMIES_DESKTOP: 60,
  CHAOS_MODE_TIME: 60000,
  DANGER_ZONE_CHANCE: 0.3,
  MILESTONE_SCORE: 100,
  MILESTONE_BONUS: 10,
  STORAGE_KEY: 'dodgeDot_highScore',
  STORAGE_LIST_KEY: 'dodgeDot_highScores'
};

// ===== State Machine =====
const GameState = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover'
};
let currentState = GameState.MENU;

// ===== Globals =====
let canvas, ctx;
let player = { x: 0, y: 0, vx: 0, vy: 0, radius: CONFIG.PLAYER_RADIUS };
let enemies = [];
let particles = [];
let keys = {};
touchStartX = 0, touchStartY = 0, touchActive = false;
let score = 0;
let highScore = 0;
let startTime = 0;
let lastSpawn = 0;
let lastTime = 0;
let spawnInterval = CONFIG.SPAWN_INTERVAL_BASE;
let enemySpeed = CONFIG.ENEMY_SPEED_BASE;
let isMobile = false;
let maxEnemies = CONFIG.MAX_ENEMIES_DESKTOP;
let audioCtx = null;
let bgMusic = null;
let volume = 0.8;
let graphicsQuality = 'medium';
let controlsMode = 'auto';
let highScoreList = [];

// ===== DOM Elements =====
const $ = id => document.getElementById(id);
const canvasEl = $('gameCanvas');
const uiEl = $('ui');
const menuEl = $('menu');
const pauseOverlay = $('pauseOverlay');
const gameOverOverlay = $('gameOverOverlay');
const settingsOverlay = $('settingsOverlay');
const highScoresOverlay = $('highScoresOverlay');
const scoreEl = $('score');
const highScoreEl = $('highScore');
const timerEl = $('timer');
const finalScoreEl = $('finalScore');
const highScoreListEl = $('highScoreList');
const startBtn = $('startBtn');
const settingsBtn = $('settingsBtn');
const highScoresBtn = $('highScoresBtn');
const resumeBtn = $('resumeBtn');
const menuFromPauseBtn = $('menuFromPauseBtn');
const retryBtn = $('retryBtn');
const mainMenuBtn = $('mainMenuBtn');
const shareBtn = $('shareBtn');
const volumeSlider = $('volumeSlider');
const graphicsSelect = $('graphicsSelect');
const controlsSelect = $('controlsSelect');
const closeSettingsBtn = $('closeSettingsBtn');
const closeHighScoresBtn = $('closeHighScoresBtn');

// ===== Initialization =====
function init() {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  canvas.width = CONFIG.CANVAS_WIDTH;
  canvas.height = CONFIG.CANVAS_HEIGHT;
  ctx.imageSmoothingEnabled = true;
  isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|wp-droid/i.test(navigator.userAgent);
  maxEnemies = isMobile ? CONFIG.MAX_ENEMIES_MOBILE : CONFIG.MAX_ENEMIES_DESKTOP;
  loadHighScore();
  loadHighScores();
  setupEventListeners();
  setupUI();
  showScreen(menuEl);
}

function setupUI() {
  startBtn.addEventListener('click', startGame);
  settingsBtn.addEventListener('click', () => showScreen(settingsOverlay));
  highScoresBtn.addEventListener('click', () => { renderHighScoreList(); showScreen(highScoresOverlay); });
  resumeBtn.addEventListener('click', resumeGame);
  menuFromPauseBtn.addEventListener('click', () => { stopAudio(); showScreen(menuEl); });
  retryBtn.addEventListener('click', startGame);
  mainMenuBtn.addEventListener('click', () => { stopAudio(); showScreen(menuEl); });
  shareBtn.addEventListener('click', shareScore);
  closeSettingsBtn.addEventListener('click', () => showScreen(menuEl));
  closeHighScoresBtn.addEventListener('click', () => showScreen(menuEl));
  volumeSlider.addEventListener('input', e => setVolume(e.target.value / 100));
  graphicsSelect.addEventListener('change', e => graphicsQuality = e.target.value.toLowerCase());
  controlsSelect.addEventListener('change', e => controlsMode = e.target.value.toLowerCase());
}

function setupEventListeners() {
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      togglePause();
      return;
    }
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    touchStartX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    touchStartY = (touch.clientY - rect.top) * (canvas.height / rect.height);
    touchActive = true;
    if (currentState === GameState.PLAYING) togglePause();
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    if (!touchActive || currentState !== GameState.PLAYING) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
    player.vx += (x - touchStartX) * 0.05;
    player.vy += (y - touchStartY) * 0.05;
    touchStartX = x;
    touchStartY = y;
  }, { passive: false });
  canvas.addEventListener('touchend', e => { touchActive = false; }, { passive: false });
}

function showScreen(el) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  if (el) el.classList.add('active');
}

// ===== Game Flow =====
function startGame() {
  resetGame();
  playAudio();
  showScreen(null);
  currentState = GameState.PLAYING;
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  player = { x: CONFIG.CANVAS_WIDTH / 2, y: CONFIG.CANVAS_HEIGHT / 2, vx: 0, vy: 0, radius: CONFIG.PLAYER_RADIUS };
  enemies = [];
  particles = [];
  score = 0;
  startTime = performance.now();
  lastSpawn = startTime;
  spawnInterval = CONFIG.SPAWN_INTERVAL_BASE;
  enemySpeed = CONFIG.ENEMY_SPEED_BASE;
  lastTime = startTime;
}

function togglePause() {
  if (currentState === GameState.PLAYING) {
    currentState = GameState.PAUSED;
    showScreen(pauseOverlay);
    playSound('pause');
  } else if (currentState === GameState.PAUSED) {
    resumeGame();
  }
}

function resumeGame() {
  currentState = GameState.PLAYING;
  showScreen(null);
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function gameOver() {
  currentState = GameState.GAMEOVER;
  playSound('hit');
  createExplosion(player.x, player.y);
  updateHighScore(score);
  finalScoreEl.textContent = formatTime(score);
  showScreen(gameOverOverlay);
  stopAudio();
}

function shareScore() {
  if (navigator.share) {
    navigator.share({ title: 'Dodge Dot', text: `I survived ${formatTime(score)} in Dodge Dot!`, url: window.location.href });
  } else {
    alert(`I survived ${formatTime(score)} in Dodge Dot!`);
  }
}

// ===== Game Loop =====
function gameLoop(timestamp) {
  if (currentState !== GameState.PLAYING) return;
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  update(delta, timestamp);
  render();
  requestAnimationFrame(gameLoop);
}

function update(delta, timestamp) {
  // Movement
  const inputX = (keys['ArrowLeft'] || keys['KeyA'] ? -1 : 0) + (keys['ArrowRight'] || keys['KeyD'] ? 1 : 0);
  const inputY = (keys['ArrowUp'] || keys['KeyW'] ? -1 : 0) + (keys['ArrowDown'] || keys['KeyS'] ? 1 : 0);
  if (inputX !== 0 || inputY !== 0) {
    player.vx += inputX * CONFIG.ACCELERATION;
    player.vy += inputY * CONFIG.ACCELERATION;
  }
  player.vx *= CONFIG.FRICTION;
  player.vy *= CONFIG.FRICTION;
  const speed = Math.hypot(player.vx, player.vy);
  if (speed > CONFIG.MAX_SPEED) {
    player.vx = (player.vx / speed) * CONFIG.MAX_SPEED;
    player.vy = (player.vy / speed) * CONFIG.MAX_SPEED;
  }
  player.x += player.vx;
  player.y += player.vy;
  // Bounds
  player.x = Math.max(player.radius, Math.min(CONFIG.CANVAS_WIDTH - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(CONFIG.CANVAS_HEIGHT - player.radius, player.y));

  // Spawning
  if (timestamp - lastSpawn > spawnInterval) {
    spawnEnemy();
    lastSpawn = timestamp;
    const elapsed = (timestamp - startTime) / 1000;
    spawnInterval = Math.max(CONFIG.SPAWN_INTERVAL_MIN, CONFIG.SPAWN_INTERVAL_BASE - elapsed * 10);
    enemySpeed = Math.min(CONFIG.ENEMY_SPEED_MAX, CONFIG.ENEMY_SPEED_BASE + elapsed * 0.005);
  }

  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.y += e.speed;
    if (e.y - e.radius > CONFIG.CANVAS_HEIGHT + 50) {
      enemies.splice(i, 1);
      continue;
    }
    if (checkCollision(player, e)) {
      gameOver();
      return;
    }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Score
  score = Math.floor((timestamp - startTime) / 1000);
  if (score > 0 && score % CONFIG.MILESTONE_SCORE === 0 && score !== (score - 1)) {
    playSound('point');
  }
  updateHUD();
}

function spawnEnemy() {
  if (enemies.length >= maxEnemies) return;
  const type = Math.random() < 0.5 ? 'circle' : Math.random() < 0.5 ? 'square' : 'triangle';
  const radius = 15 + Math.random() * 15;
  const x = Math.random() * (CONFIG.CANVAS_WIDTH - 2 * radius) + radius;
  enemies.push({ type, x, y: -50, radius, speed: enemySpeed + Math.random() });
}

function checkCollision(player, enemy) {
  if (enemy.type === 'circle') {
    return Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius;
  } else {
    // AABB for square/triangle
    const half = enemy.radius;
    if (player.x + player.radius < enemy.x - half || player.x - player.radius > enemy.x + half ||
        player.y + player.radius < enemy.y - half || player.y - player.radius > enemy.y + half) {
      return false;
    }
    // Per-edge distance test (simplified)
    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    return dist < player.radius + enemy.radius;
  }
}

function createExplosion(x, y) {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * (1 + Math.random() * 2),
      vy: Math.sin(angle) * (1 + Math.random() * 2),
      life: 30,
      maxLife: 30
    });
  }
}

function updateHUD() {
  scoreEl.textContent = formatTime(score);
  highScoreEl.textContent = 'HS: ' + formatTime(highScore);
  const elapsed = Math.floor((performance.now() - startTime) / 1000);
  timerEl.textContent = 'Time: ' + formatTime(elapsed);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ===== Rendering =====
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawPlayerTrail();
  drawPlayer();
  drawEnemies();
  drawParticles();
  drawHUD();
}

function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#1a1f2e');
  grad.addColorStop(1, '#2a3040');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawPlayerTrail() {
  // Simplified trail
  ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius + 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.radius);
  grad.addColorStop(0, '#00ffff');
  grad.addColorStop(1, '#0088ff');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemies() {
  enemies.forEach(e => {
    if (e.type === 'circle') {
      const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius);
      grad.addColorStop(0, '#00ffcc');
      grad.addColorStop(1, '#00cc66');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'square') {
      const grad = ctx.createLinearGradient(e.x - e.radius, e.y - e.radius, e.x + e.radius, e.y + e.radius);
      grad.addColorStop(0, '#ff8800');
      grad.addColorStop(1, '#ff0033');
      ctx.fillStyle = grad;
      ctx.fillRect(e.x - e.radius, e.y - e.radius, e.radius * 2, e.radius * 2);
    } else {
      const grad = ctx.createLinearGradient(e.x, e.y - e.radius, e.x, e.y + e.radius);
      grad.addColorStop(0, '#cc00ff');
      grad.addColorStop(1, '#ff00cc');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(e.x, e.y - e.radius);
      ctx.lineTo(e.x + e.radius, e.y + e.radius);
      ctx.lineTo(e.x - e.radius, e.y + e.radius);
      ctx.closePath();
      ctx.fill();
    }
  });
}

function drawParticles() {
  particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawHUD() {
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px "Roboto Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
  ctx.shadowBlur = 8;
  ctx.fillText(formatTime(score), 10, 10);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.7;
  ctx.fillText('HS: ' + formatTime(highScore), canvas.width - 150, 10);
  ctx.globalAlpha = 1;
  ctx.font = '18px "Roboto Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Time: ' + formatTime(Math.floor((performance.now() - startTime) / 1000)), canvas.width / 2, canvas.height - 30);
}

// ===== Audio =====
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.value = volume * 0.3;
  if (type === 'hit') {
    osc.type = 'square';
    osc.frequency.value = 150;
    osc.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'point') {
    osc.type = 'sine';
    osc.frequency.value = 600;
    osc.stop(audioCtx.currentTime + 0.2);
  } else if (type === 'pause') {
    osc.type = 'triangle';
    osc.frequency.value = 300;
    osc.stop(audioCtx.currentTime + 0.1);
  }
  osc.start();
}

function playAudio() {
  initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function stopAudio() {
  if (audioCtx) audioCtx.suspend();
}

function setVolume(v) {
  volume = v;
}

// ===== Storage =====
function loadHighScore() {
  const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
  highScore = stored ? parseInt(stored, 10) : 0;
}

function updateHighScore(newScore) {
  if (newScore > highScore) {
    highScore = newScore;
    localStorage.setItem(CONFIG.STORAGE_KEY, highScore);
  }
  const list = JSON.parse(localStorage.getItem(CONFIG.STORAGE_LIST_KEY) || '[]');
  list.push({ score: newScore, date: new Date().toISOString() });
  list.sort((a, b) => b.score - a.score);
  highScoreList = list.slice(0, 10);
  localStorage.setItem(CONFIG.STORAGE_LIST_KEY, JSON.stringify(highScoreList));
}

function loadHighScores() {
  const stored = localStorage.getItem(CONFIG.STORAGE_LIST_KEY);
  highScoreList = stored ? JSON.parse(stored) : [];
}

function renderHighScoreList() {
  highScoreListEl.innerHTML = '';
  highScoreList.slice(0, 10).forEach((entry, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}. ${formatTime(entry.score)} - ${new Date(entry.date).toLocaleDateString()}`;
    highScoreListEl.appendChild(li);
  });
}

// ===== Bootstrap =====
window.addEventListener('load', init);
