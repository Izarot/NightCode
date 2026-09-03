const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// --- Config ---
const LOGICAL_W = 800, LOGICAL_H = 600;
const COLORS = {
  bg: '#2C3E50',
  player: '#E74C3C',
  ground: '#27AE60',
  gap: '#C0392B',
  coin: '#F1C40F',
  obstacle: '#7F8C8D',
  text: '#ECF0F1',
  timer: '#E67E22',
  high: '#F39C12'
};

// --- Audio ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, dur, type='square', vol=0.1) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g).connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + dur);
}
function jumpSound() { playTone(440, 0.1, 'sine', 0.2); }
function coinSound() { playTone(880, 0.05, 'sine', 0.3); }
function hitSound() { playTone(200, 0.2, 'sawtooth', 0.2); }

// --- Game State ---
let state = 'menu'; // menu, playing, gameover
let score = 0, highScore = +localStorage.getItem('runnerHighScore') || 0;
let lives = 3;
let speed = 120; // px/s
const MAX_SPEED = 300;
const ACCEL = 30;
const DRAG = 5;
let player = { x: 100, y: LOGICAL_H - 60, w: 40, h: 40, vy: 0, onGround: false, jumping: false, boost: 0 };
let groundTiles = []; // each tile: {x, w, solid}
let obstacles = [];
let coins = [];
let particles = [];
let cameraX = 0;
let nextGapAt = 1500;
let gapLength = 3; // tiles
let lastTime = 0;
let timer = 0;
let input = { left: false, right: false, jump: false, jumpBuffered: 0 };

// --- Init Ground ---
function initGround() {
  groundTiles = [];
  for (let i = 0; i < 30; i++) {
    groundTiles.push({ x: i * 64, w: 64, solid: true });
  }
}
initGround();

// --- Input ---
window.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft') input.left = true;
  if (e.code === 'ArrowRight') input.right = true;
  if (e.code === 'Space') { e.preventDefault(); input.jump = true; input.jumpBuffered = 0.15; }
});
window.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft') input.left = false;
  if (e.code === 'ArrowRight') input.right = false;
  if (e.code === 'Space') input.jump = false;
});
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.touches[0];
  if (t.clientX < window.innerWidth / 2) input.left = true;
  else input.right = true;
  input.jump = true; input.jumpBuffered = 0.15;
}, {passive: false});
canvas.addEventListener('touchend', e => {
  input.left = false; input.right = false; input.jump = false;
});

// --- Resize ---
function resize() {
  const scale = Math.min(window.innerWidth / LOGICAL_W, window.innerHeight / LOGICAL_H);
  canvas.width = LOGICAL_W * scale;
  canvas.height = LOGICAL_H * scale;
  canvas.style.width = LOGICAL_W * scale + 'px';
  canvas.style.height = LOGICAL_H * scale + 'px';
}
window.addEventListener('resize', resize);
resize();

// --- Game Loop ---
function loop(ts) {
  if (!lastTime) lastTime = ts;
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  update(dt);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function update(dt) {
  if (state === 'menu') {
    if (input.jump) startGame();
    return;
  }
  if (state === 'gameover') {
    if (input.jump) startGame();
    return;
  }

  timer += dt;
  input.jumpBuffered = Math.max(0, input.jumpBuffered - dt);

  // Horizontal movement
  if (input.right) speed = Math.min(speed + ACCEL * dt, MAX_SPEED);
  else if (input.left) speed = Math.max(speed - ACCEL * dt, 120);
  else speed = Math.max(speed - DRAG * dt, 120);

  cameraX += speed * dt;
  player.x += speed * dt;

  // Jump
  if ((input.jump || input.jumpBuffered > 0) && player.onGround) {
    player.vy = -350;
    player.onGround = false;
    player.jumping = true;
    jumpSound();
    input.jumpBuffered = 0;
  }
  // Boost jump (double tap)
  if (input.jump && !player.onGround && player.boost > 0) {
    player.vy = -200;
    player.boost = 0;
  }
  if (player.jumping && player.vy < 0) player.boost = 0.3;
  player.boost = Math.max(0, player.boost - dt);

  // Gravity
  player.vy += 1000 * dt;
  player.y += player.vy * dt;

  // Ground collision
  player.onGround = false;
  for (const tile of groundTiles) {
    if (tile.solid && player.x < tile.x + tile.w && player.x + player.w > tile.x) {
      if (player.y + player.h >= tile.x + LOGICAL_H - 20 && player.y + player.h <= tile.x + LOGICAL_H - 20 + 20) {
        // Actually ground Y is LOGICAL_H - 20
        if (player.vy > 0) {
          player.y = LOGICAL_H - 20 - player.h;
          player.vy = 0;
          player.onGround = true;
          player.jumping = false;
        }
      }
    }
  }

  // Fall death
  if (player.y > LOGICAL_H + 20) {
    loseLife();
  }

  // Scroll ground
  for (const tile of groundTiles) tile.x -= speed * dt;
  // Remove off-screen left, add new right
  while (groundTiles[0].x + groundTiles[0].w < cameraX) {
    groundTiles.shift();
  }
  const lastTile = groundTiles[groundTiles.length - 1];
  while (lastTile.x + lastTile.w < cameraX + LOGICAL_W + 64) {
    const newX = lastTile.x + lastTile.w;
    let solid = true;
    // Gap logic
    if (newX >= nextGapAt && newX < nextGapAt + gapLength * 64) {
      solid = false;
    }
    if (newX >= nextGapAt + gapLength * 64) {
      nextGapAt += 1500;
    }
    groundTiles.push({ x: newX, w: 64, solid });
  }

  // Obstacles & Coins (simplified spawn)
  if (Math.random() < 0.01 * dt * 60) {
    obstacles.push({ x: cameraX + LOGICAL_W + 30, y: LOGICAL_H - 50, w: 30, h: 30 });
  }
  if (Math.random() < 0.005 * dt * 60) {
    coins.push({ x: cameraX + LOGICAL_W + 24, y: LOGICAL_H - 100, w: 24, h: 24, collected: false });
  }

  // Update obstacles
  for (const obs of obstacles) obs.x -= speed * dt;
  obstacles = obstacles.filter(obs => obs.x + obs.w > cameraX);

  // Update coins
  for (const coin of coins) coin.x -= speed * dt;
  coins = coins.filter(coin => coin.x + coin.w > cameraX);

  // Collisions
  for (const obs of obstacles) {
    if (aabb(player, obs)) {
      loseLife();
      hitSound();
    }
  }
  for (const coin of coins) {
    if (!coin.collected && aabb(player, coin)) {
      coin.collected = true;
      score += 10;
      coinSound();
      spawnParticles(coin.x, coin.y, COLORS.coin);
    }
  }
  coins = coins.filter(c => !c.collected);

  // Particles
  for (const p of particles) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0);

  // Score per distance
  score += Math.floor(speed * dt / 10);
  if (score > highScore) highScore = score;
}

function loseLife() {
  lives--;
  if (lives <= 0) {
    state = 'gameover';
    localStorage.setItem('runnerHighScore', highScore);
  } else {
    // reset player position
    player.x = cameraX + 100;
    player.y = LOGICAL_H - 60;
    player.vy = 0;
    player.onGround = true;
  }
}

function startGame() {
  state = 'playing';
  score = 0; lives = 3; speed = 120; timer = 0;
  player = { x: 100, y: LOGICAL_H - 60, w: 40, h: 40, vy: 0, onGround: true, jumping: false, boost: 0 };
  cameraX = 0;
  nextGapAt = 1500;
  initGround();
  obstacles = []; coins = []; particles = [];
}

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 10; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200 - 100,
      life: 0.5,
      color
    });
  }
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scale = canvas.width / LOGICAL_W;
  ctx.scale(scale, scale);
  ctx.translate(-cameraX, 0);

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(cameraX, 0, LOGICAL_W, LOGICAL_H);

  // Ground tiles
  for (const tile of groundTiles) {
    if (tile.solid) {
      ctx.fillStyle = COLORS.ground;
      ctx.fillRect(tile.x, LOGICAL_H - 20, tile.w, 20);
    } else {
      ctx.fillStyle = COLORS.gap;
      ctx.fillRect(tile.x, LOGICAL_H - 20, tile.w, 20);
      // danger overlay
      ctx.fillStyle = 'rgba(255,0,0,0.2)';
      ctx.fillRect(tile.x, LOGICAL_H - 20, tile.w, 20);
    }
  }

  // Obstacles
  ctx.fillStyle = COLORS.obstacle;
  for (const obs of obstacles) ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

  // Coins
  ctx.fillStyle = COLORS.coin;
  for (const coin of coins) {
    ctx.beginPath();
    ctx.arc(coin.x + coin.w/2, coin.y + coin.h/2, coin.w/2, 0, Math.PI*2);
    ctx.fill();
  }

  // Player
  ctx.fillStyle = player.boost > 0 ? '#F1C40F' : COLORS.player;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  // Eye
  ctx.fillStyle = '#fff';
  ctx.fillRect(player.x + 30, player.y + 10, 8, 8);

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life / 0.5;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
  }
  ctx.globalAlpha = 1;

  // HUD (draw in screen space)
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = COLORS.text;
  ctx.font = '24px Roboto, sans-serif';
  ctx.fillText(`Score: ${score}`, 20, 40);
  ctx.fillText(`High: ${highScore}`, 20, 70);
  ctx.fillText(`Lives: ${'❤️'.repeat(lives)}`, 20, 100);
  ctx.fillStyle = COLORS.timer;
  ctx.font = 'bold 28px Roboto, sans-serif';
  ctx.fillText(`Time: ${timer.toFixed(2)}s`, LOGICAL_W - 200, 40);

  if (state === 'menu') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = COLORS.text;
    ctx.font = '48px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ENDLESS RUNNER', LOGICAL_W/2, LOGICAL_H/2 - 40);
    ctx.font = '24px Roboto, sans-serif';
    ctx.fillText('Press Space / Tap to Start', LOGICAL_W/2, LOGICAL_H/2 + 20);
    ctx.fillText(`High Score: ${highScore}`, LOGICAL_W/2, LOGICAL_H/2 + 60);
    ctx.textAlign = 'left';
  } else if (state === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.fillStyle = COLORS.text;
    ctx.font = '48px Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', LOGICAL_W/2, LOGICAL_H/2 - 40);
    ctx.font = '24px Roboto, sans-serif';
    ctx.fillText(`Score: ${score}`, LOGICAL_W/2, LOGICAL_H/2 + 10);
    ctx.fillText(`Best: ${highScore}`, LOGICAL_W/2, LOGICAL_H/2 + 40);
    ctx.fillText('Press Space / Tap to Restart', LOGICAL_W/2, LOGICAL_H/2 + 80);
    ctx.textAlign = 'left';
  }
}
