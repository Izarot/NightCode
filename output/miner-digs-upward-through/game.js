const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ===== CONFIG & CONSTANTS =====
const CONFIG = {
  lanes: 3,
  laneWidth: 0, // calculated
  playerWidth: 0,
  playerHeight: 0,
  obstacleWidth: 0,
  obstacleHeight: 0,
  orbSize: 0,
  baseSpeed: 300,
  maxSpeed: 1200,
  speedAccel: 30,
  spawnInterval: 1.2,
  minSpawnInterval: 0.4,
  orbChance: 0.15,
  screenShakeDuration: 0,
  screenShakeIntensity: 0
};

const COLORS = {
  bg: '#0a0a12',
  grid: '#1a1a2e',
  laneLine: '#00ffff33',
  player: '#00ffff',
  playerGlow: '#00ffff88',
  obstacle: '#ff0080',
  obstacleGlow: '#ff008088',
  orb: '#00ff88',
  orbGlow: '#00ff8888',
  trail: '#00ffff44',
  particle: ['#00ffff', '#ff0080', '#00ff88', '#ffcc00', '#ff4400'],
  text: '#ffffff',
  uiBorder: '#00ffff',
  uiBg: 'rgba(10,10,18,0.85)'
};

// ===== AUDIO ENGINE =====
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
  }
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.3;
  }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }
  createTone(freq, type, duration, volume = 1, freqEnd = null) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(volume * 0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
  playCollect() {
    this.createTone(880, 'sine', 0.15, 0.5);
    setTimeout(() => this.createTone(1320, 'sine', 0.1, 0.3), 50);
    setTimeout(() => this.createTone(1760, 'sine', 0.08, 0.2), 100);
  }
  playHit() {
    this.createTone(200, 'sawtooth', 0.3, 0.6, 60);
    this.createTone(100, 'square', 0.2, 0.4);
  }
  playStart() {
    this.createTone(220, 'triangle', 0.1, 0.4, 440);
    setTimeout(() => this.createTone(440, 'triangle', 0.1, 0.4, 880), 100);
    setTimeout(() => this.createTone(880, 'triangle', 0.2, 0.5), 200);
  }
  playGameOver() {
    this.createTone(440, 'sawtooth', 0.2, 0.5, 110);
    setTimeout(() => this.createTone(220, 'sawtooth', 0.3, 0.4, 55), 150);
    setTimeout(() => this.createTone(110, 'sawtooth', 0.5, 0.3, 30), 300);
  }
  playMove() {
    this.createTone(600, 'square', 0.05, 0.15, 800);
  }
  setVolume(v) { if (this.masterGain) this.masterGain.gain.value = v * 0.3; }
  toggle() { this.enabled = !this.enabled; }
}
const audio = new AudioEngine();

// ===== PARTICLE SYSTEM =====
class Particle {
  constructor(x, y, color, velocity, life, size, gravity = 0) {
    this.x = x; this.y = y; this.color = color;
    this.vx = velocity.x; this.vy = velocity.y;
    this.life = life; this.maxLife = life;
    this.size = size; this.gravity = gravity;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.life -= dt;
    this.rotation += this.rotationSpeed;
    return this.life > 0;
  }
  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.rect(-this.size/2, -this.size/2, this.size, this.size);
    ctx.fill();
    ctx.restore();
  }
}

class ParticleSystem {
  constructor() { this.particles = []; }
  emit(x, y, color, count, speed, life, size, gravity = 0, spread = Math.PI * 2) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * spread;
      const v = speed * (0.5 + Math.random() * 0.5);
      this.particles.push(new Particle(
        x, y, color,
        { x: Math.cos(angle) * v, y: Math.sin(angle) * v },
        life, size, gravity
      ));
    }
  }
  emitBurst(x, y, colors, count) {
    colors.forEach(c => this.emit(x, y, c, count, 300, 0.8, 4, 200));
  }
  update(dt) { this.particles = this.particles.filter(p => p.update(dt)); }
  draw(ctx) { this.particles.forEach(p => p.draw(ctx)); }
  clear() { this.particles = []; }
}
const particles = new ParticleSystem();

// ===== GAME ENTITIES =====
class Player {
  constructor() {
    this.lane = 1;
    this.targetLane = 1;
    this.x = 0; this.y = 0;
    this.width = 0; this.height = 0;
    this.trail = [];
    this.invulnerable = 0;
    this.flash = 0;
  }
  init(canvasWidth, canvasHeight, laneWidth) {
    this.width = laneWidth * 0.6;
    this.height = this.width * 1.5;
    this.y = canvasHeight - this.height - 40;
    this.updatePosition(canvasWidth, laneWidth);
  }
  updatePosition(canvasWidth, laneWidth) {
    this.x = canvasWidth / 2 + (this.lane - 1) * laneWidth - laneWidth + laneWidth / 2;
  }
  move(dir) {
    if (this.targetLane !== this.lane) return false;
    const newLane = this.lane + dir;
    if (newLane >= 0 && newLane < CONFIG.lanes) {
      this.targetLane = newLane;
      audio.playMove();
      particles.emit(this.x, this.y + this.height/2, COLORS.player, 8, 200, 0.3, 3);
      return true;
    }
    return false;
  }
  update(dt, canvasWidth, laneWidth) {
    const targetX = canvasWidth / 2 + (this.targetLane - 1) * laneWidth - laneWidth + laneWidth / 2;
    const diff = targetX - this.x;
    if (Math.abs(diff) > 2) {
      this.x += diff * 15 * dt;
    } else {
      this.x = targetX;
      this.lane = this.targetLane;
    }
    this.trail.unshift({ x: this.x, y: this.y + this.height/2, life: 0.3 });
    this.trail = this.trail.filter(t => (t.life -= dt) > 0);
    if (this.invulnerable > 0) this.invulnerable -= dt;
    if (this.flash > 0) this.flash -= dt;
  }
  draw(ctx) {
    ctx.save();
    this.trail.forEach((t, i) => {
      const alpha = (t.life / 0.3) * 0.3 * (1 - i / this.trail.length);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS.trail;
      ctx.beginPath();
      const w = this.width * (t.life / 0.3);
      ctx.roundRect(t.x - w/2, t.y - this.height/4, w, this.height/2, 8).fill();
    });
    ctx.globalAlpha = this.invulnerable > 0 && Math.floor(this.invulnerable * 10) % 2 === 0 ? 0.3 : 1;
    const glow = this.invulnerable > 0 ? COLORS.obstacleGlow : COLORS.playerGlow;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 20;
    ctx.fillStyle = this.invulnerable > 0 ? COLORS.obstacle : COLORS.player;
    ctx.beginPath();
    ctx.roundRect(this.x - this.width/2, this.y, this.width, this.height, 8).fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0a0a12';
    ctx.font = `${this.width * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▲', this.x, this.y + this.height/2);
    ctx.restore();
  }
  getBounds() {
    return { x: this.x - this.width/2, y: this.y, w: this.width, h: this.height };
  }
  hit() {
    this.invulnerable = 1.5;
    this.flash = 0.5;
    CONFIG.screenShakeDuration = 0.3;
    CONFIG.screenShakeIntensity = 8;
    particles.emitBurst(this.x, this.y + this.height/2, [COLORS.obstacle, '#ff4400', '#ffcc00'], 20);
  }
}

class Obstacle {
  constructor(lane, y, speed, width, height) {
    this.lane = lane;
    this.y = y;
    this.speed = speed;
    this.width = width;
    this.height = height;
    this.x = 0;
    this.passed = false;
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 2;
    this.pulse = Math.random() * Math.PI * 2;
  }
  update(dt, canvasWidth, laneWidth) {
    this.y += this.speed * dt;
    this.x = canvasWidth / 2 + (this.lane - 1) * laneWidth - laneWidth + laneWidth / 2;
    this.rotation += this.rotationSpeed * dt;
    this.pulse += dt * 8;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y + this.height/2);
    ctx.rotate(this.rotation);
    const pulseScale = 1 + Math.sin(this.pulse) * 0.05;
    ctx.scale(pulseScale, pulseScale);
    ctx.shadowColor = COLORS.obstacleGlow;
    ctx.shadowBlur = 15;
    ctx.fillStyle = COLORS.obstacle;
    ctx.beginPath();
    const s = this.width * 0.7;
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(
        Math.cos(i * Math.PI/2 - Math.PI/4) * s,
        Math.sin(i * Math.PI/2 - Math.PI/4) * s
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  getBounds() {
    const s = this.width * 0.7;
    return { x: this.x - s, y: this.y, w: s*2, h: this.height };
  }
}

class Orb {
  constructor(lane, y, speed, size) {
    this.lane = lane;
    this.y = y;
    this.speed = speed;
    this.size = size;
    this.x = 0;
    this.collected = false;
    this.bob = Math.random() * Math.PI * 2;
    this.spin = 0;
  }
  update(dt, canvasWidth, laneWidth) {
    this.y += this.speed * dt;
    this.x = canvasWidth / 2 + (this.lane - 1) * laneWidth - laneWidth + laneWidth / 2;
    this.bob += dt * 4;
    this.spin += dt * 3;
  }
  draw(ctx) {
    const bobY = Math.sin(this.bob) * 8;
    ctx.save();
    ctx.translate(this.x, this.y + this.size/2 + bobY);
    ctx.rotate(this.spin);
    ctx.shadowColor = COLORS.orbGlow;
    ctx.shadowBlur = 20;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, COLORS.orb);
    grad.addColorStop(1, '#008844');
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const r = i % 2 === 0 ? this.size : this.size * 0.5;
      ctx.lineTo(
        Math.cos(i * Math.PI/3 - Math.PI/2) * r,
        Math.sin(i * Math.PI/3 - Math.PI/2) * r
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  getBounds() {
    return { x: this.x - this.size, y: this.y, w: this.size*2, h: this.size*2 };
  }
  collect() {
    this.collected = true;
    audio.playCollect();
    particles.emitBurst(this.x, this.y + this.size/2, [COLORS.orb, '#88ffaa', '#ffff00'], 15);
  }
}

// ===== GAME STATE =====
const State = {
  MENU: 'menu',
  PLAYING: 'playing',
  GAME_OVER: 'gameover'
};

let gameState = State.MENU;
let player = new Player();
let obstacles = [];
let orbs = [];
let score = 0;
let highScore = parseInt(localStorage.getItem('neonDashHighScore') || '0', 10);
let timer = 0;
let spawnTimer = 0;
let currentSpeed = CONFIG.baseSpeed;
let currentSpawnInterval = CONFIG.spawnInterval;
let lastTime = 0;
let animationId = null;

// ===== DOM ELEMENTS =====
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalTimeEl = document.getElementById('final-time');
const finalScoreEl = document.getElementById('final-score');
const finalBestEl = document.getElementById('final-best');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

// ===== INIT & RESIZE =====
function resize() {
  const container = document.getElementById('game-container');
  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  ctx.scale(dpr, dpr);
  
  CONFIG.laneWidth = rect.width / CONFIG.lanes;
  CONFIG.playerWidth = CONFIG.laneWidth * 0.6;
  CONFIG.playerHeight = CONFIG.playerWidth * 1.5;
  CONFIG.obstacleWidth = CONFIG.laneWidth * 0.7;
  CONFIG.obstacleHeight = CONFIG.obstacleWidth;
  CONFIG.orbSize = CONFIG.laneWidth * 0.25;
  
  player.init(rect.width, rect.height, CONFIG.laneWidth);
}

function init() {
  audio.init();
  resize();
  window.addEventListener('resize', resize);
  
  // Touch controls
  btnLeft.addEventListener('touchstart', e => { e.preventDefault(); player.move(-1); }, { passive: false });
  btnRight.addEventListener('touchstart', e => { e.preventDefault(); player.move(1); }, { passive: false });
  btnLeft.addEventListener('click', () => player.move(-1));
  btnRight.addEventListener('click', () => player.move(1));
  
  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') player.move(-1);
    else if (e.key === 'ArrowRight') player.move(1);
    else if (e.key === ' ' && gameState === State.GAME_OVER) startGame();
    else if (e.key === 'Escape' && gameState === State.PLAYING) return;
  });
  
  // Buttons
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  menuBtn.addEventListener('click', showMenu);
  
  // Prevent scroll on touch
  document.body.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  
  bestEl.textContent = highScore;
  requestAnimationFrame(gameLoop);
}

function startGame() {
  audio.resume();
  audio.playStart();
  gameState = State.PLAYING;
  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  
  player = new Player();
  player.init(canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1), CONFIG.laneWidth);
  obstacles = [];
  orbs = [];
  score = 0;
  timer = 0;
  currentSpeed = CONFIG.baseSpeed;
  currentSpawnInterval = CONFIG.spawnInterval;
  spawnTimer = 0;
  particles.clear();
  lastTime = performance.now();
}

function showMenu() {
  gameState = State.MENU;
  gameOverScreen.style.display = 'none';
  startScreen.style.display = 'flex';
}

function spawnEntities() {
  const lane = Math.floor(Math.random() * CONFIG.lanes);
  if (Math.random() < CONFIG.orbChance) {
    orbs.push(new Orb(lane, -CONFIG.orbSize, currentSpeed, CONFIG.orbSize));
  } else {
    obstacles.push(new Obstacle(lane, -CONFIG.obstacleHeight, currentSpeed, CONFIG.obstacleWidth, CONFIG.obstacleHeight));
  }
}

function checkCollisions() {
  const pBounds = player.getBounds();
  
  for (const obs of obstacles) {
    if (obs.y > canvas.height / (window.devicePixelRatio || 1) + 100) continue;
    const oBounds = obs.getBounds();
    if (pBounds.x < oBounds.x + oBounds.w &&
        pBounds.x + pBounds.w > oBounds.x &&
        pBounds.y < oBounds.y + oBounds.h &&
        pBounds.y + pBounds.h > oBounds.y) {
      if (player.invulnerable <= 0) {
        player.hit();
        audio.playHit();
        return true;
      }
    }
  }
  
  for (const orb of orbs) {
    if (orb.collected) continue;
    const oBounds = orb.getBounds();
    if (pBounds.x < oBounds.x + oBounds.w &&
        pBounds.x + pBounds.w > oBounds.x &&
        pBounds.y < oBounds.y + oBounds.h &&
        pBounds.y + pBounds.h > oBounds.y) {
      orb.collect();
      score += 10;
      scoreEl.textContent = score;
    }
  }
  return false;
}

function update(dt) {
  if (gameState !== State.PLAYING) return;
  
  timer += dt;
  timerEl.textContent = timer.toFixed(2) + 's';
  
  currentSpeed = Math.min(CONFIG.maxSpeed, currentSpeed + CONFIG.speedAccel * dt);
  currentSpawnInterval = Math.max(CONFIG.minSpawnInterval, currentSpawnInterval - dt * 0.15);
  
  spawnTimer += dt;
  if (spawnTimer >= currentSpawnInterval) {
    spawnEntities();
    spawnTimer = 0;
  }
  
  const cw = canvas.width / (window.devicePixelRatio || 1);
  player.update(dt, cw, CONFIG.laneWidth);
  
  obstacles.forEach(obs => obs.update(dt, cw, CONFIG.laneWidth));
  orbs.forEach(orb => orb.update(dt, cw, CONFIG.laneWidth));
  
  obstacles = obstacles.filter(obs => obs.y < cw + 100);
  orbs = orbs.filter(orb => !orb.collected && orb.y < cw + 100);
  
  if (checkCollisions()) {
    gameOver();
  }
  
  particles.update(dt);
  
  if (CONFIG.screenShakeDuration > 0) {
    CONFIG.screenShakeDuration -= dt;
  }
}

function gameOver() {
  gameState = State.GAME_OVER;
  audio.playGameOver();
  
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('neonDashHighScore', highScore.toString());
  }
  
  finalTimeEl.textContent = timer.toFixed(2) + 's';
  finalScoreEl.textContent = score;
  finalBestEl.textContent = highScore;
  bestEl.textContent = highScore;
  
  gameOverScreen.style.display = 'flex';
}

function drawBackground() {
  const cw = canvas.width / (window.devicePixelRatio || 1);
  const ch = canvas.height / (window.devicePixelRatio || 1);
  
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, cw, ch);
  
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x <= cw; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ch);
    ctx.stroke();
  }
  for (let y = 0; y <= ch; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cw, y);
    ctx.stroke();
  }
  
  ctx.strokeStyle = COLORS.laneLine;
  ctx.lineWidth = 2;
  ctx.setLineDash([20, 20]);
  for (let i = 1; i < CONFIG.lanes; i++) {
    const x = cw / 2 + (i - 1) * CONFIG.laneWidth - CONFIG.laneWidth + CONFIG.laneWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ch);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function draw() {
  const cw = canvas.width / (window.devicePixelRatio || 1);
  const ch = canvas.height / (window.devicePixelRatio || 1);
  
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  
  if (CONFIG.screenShakeDuration > 0) {
    const intensity = CONFIG.screenShakeIntensity * (CONFIG.screenShakeDuration / 0.3);
    ctx.translate(
      (Math.random() - 0.5) * intensity,
      (Math.random() - 0.5) * intensity
    );
  }
  
  drawBackground();
  
  orbs.forEach(orb => orb.draw(ctx));
  obstacles.forEach(obs => obs.draw(ctx));
  player.draw(ctx);
  particles.draw(ctx);
  
  ctx.restore();
}

function gameLoop(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  
  update(dt);
  draw();
  
  animationId = requestAnimationFrame(gameLoop);
}

init();
