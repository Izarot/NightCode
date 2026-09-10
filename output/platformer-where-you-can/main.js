// Shadow Hop – main game logic
const CANVAS_ID = 'gameCanvas';
const BASE_WIDTH = 960;
const BASE_HEIGHT = 540; // 16:9
let canvas, ctx;
let scale = 1;
let lastTime = 0;
let gameState = 'playing'; // playing, paused, gameOver

// Input
const keys = { left: false, right: false, jump: false };
let touchJoystick = { active: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 };
let touchJump = false;

// Player
const player = {
  w: 32, h: 48,
  x: 0, y: 0,
  vx: 0, vy: 0,
  onGround: false,
  invincible: 0,
  jumpHoldTime: 0,
  maxJumpHold: 0.2, // seconds
  state: 'idle'
};

// Physics constants
const ACCEL = 0.5;
const FRICTION = 0.8;
const MAX_SPEED = 6;
const JUMP_VEL = -12;
const EXTRA_JUMP_ACC = 3; // extra upward acc while holding jump
const GRAVITY = 0.7;
const TERMINAL_VEL = 15;

// Light
const lights = [
  { x: BASE_WIDTH / 2, y: BASE_HEIGHT / 2, radius: 200, moving: false }
];

// Tilemap
let tileMap = [];
let mapWidthInTiles = 0, mapHeightInTiles = 0;
const TILE_SIZE = 32;

// HUD
let score = 0;
let timer = 0;
let health = 3;
let shadowMeter = 100; // 0-100
let shadowMeterDecreaseRate = 20; // per second in lit
let shadowMeterIncreaseRate = 30; // per second in shadow

// Audio
let audioCtx = null;
function initAudio() {
  if (window.AudioContext || window.webkitAudioContext) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}
function playJump() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(440, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.25);
}
function playBounce() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.25);
}
function playDeath() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}
function playAmbient() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'noise';
  osc.frequency.setValueAtTime(50, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
}

// Game functions
function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const ratio = Math.min(w / BASE_WIDTH, h / BASE_HEIGHT);
  scale = ratio;
  canvas.width = BASE_WIDTH * scale;
  canvas.height = BASE_HEIGHT * scale;
  ctx.scale(scale, scale);
}

function loadLevel() {
  // Simple flat level
  mapWidthInTiles = 20;
  mapHeightInTiles = 15;
  tileMap = [];
  for (let row = 0; row < mapHeightInTiles; row++) {
    tileMap[row] = [];
    for (let col = 0; col < mapWidthInTiles; col++) {
      tileMap[row][col] = { type: 'ground' };
    }
  }
  // spawn player at bottom-left
  player.x = TILE_SIZE;
  player.y = (mapHeightInTiles - 2) * TILE_SIZE; // above ground
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
}

function getTileAtPixel(px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  if (tx < 0 || tx >= mapWidthInTiles || ty < 0 || ty >= mapHeightInTiles) return null;
  return tileMap[ty][tx];
}

function isTileLit(tileX, tileY) {
  const worldX = tileX * TILE_SIZE + TILE_SIZE / 2;
  const worldY = tileY * TILE_SIZE + TILE_SIZE / 2;
  for (const light of lights) {
    const dx = worldX - light.x;
    const dy = worldY - light.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < light.radius * light.radius) return true;
  }
  return false;
}

function pointInLight(px, py) {
  for (const light of lights) {
    const dx = px - light.x;
    const dy = py - light.y;
    if (dx * dx + dy * dy < light.radius * light.radius) return true;
  }
  return false;
}

function updatePlayer(dt) {
  // Horizontal input
  const inputDir = (keys.left ? -1 : 0) + (keys.right ? 1 : 0) + touchJoystick.offsetX;
  const acc = inputDir * ACCEL;
  if (inputDir === 0) {
    player.vx *= FRICTION;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
  } else {
    player.vx += acc * dt;
    if (player.vx > MAX_SPEED) player.vx = MAX_SPEED;
    if (player.vx < -MAX_SPEED) player.vx = -MAX_SPEED;
  }

  // Jump
  if (keys.jump || touchJump) {
    if (player.onGround && player.state !== 'jumping') {
      player.vy = JUMP_VEL;
      player.jumpHoldTime = 0;
      player.state = 'jumping';
      playJump();
    } else if (player.state === 'jumping' && player.jumpHoldTime < player.maxJumpHold) {
      // extra upward acceleration while holding jump
      player.vy -= EXTRA_JUMP_ACC * dt;
      player.jumpHoldTime += dt;
    }
  } else {
    if (player.state === 'jumping') player.state = 'falling';
  }

  // Gravity
  player.vy += GRAVITY * dt;
  if (player.vy > TERMINAL_VEL) player.vy = TERMINAL_VEL;

  // Apply movement
  const newX = player.x + player.vx * dt;
  const newY = player.y + player.vy * dt;

  // Collision X
  player.x = newX;
  let hitX = false;
  const px1 = player.x;
  const px2 = player.x + player.w;
  const py1 = player.y + 1;
  const py2 = player.y + player.h - 1;
  const tilesToCheck = [
    { x: Math.floor(px1 / TILE_SIZE), y: Math.floor(py1 / TILE_SIZE) },
    { x: Math.floor(px2 / TILE_SIZE), y: Math.floor(py1 / TILE_SIZE) },
    { x: Math.floor(px1 / TILE_SIZE), y: Math.floor(py2 / TILE_SIZE) },
    { x: Math.floor(px2 / TILE_SIZE), y: Math.floor(py2 / TILE_SIZE) }
  ];
  for (const t of tilesToCheck) {
    const tile = getTileAtPixel(t.x * TILE_SIZE + TILE_SIZE / 2, t.y * TILE_SIZE + TILE_SIZE / 2);
    if (tile) {
      if (pointInLight(t.x * TILE_SIZE + TILE_SIZE / 2, t.y * TILE_SIZE + TILE_SIZE / 2)) {
        // lit tile -> bounce
        player.vx = -player.vx * 0.5;
        player.vy = 2;
        player.invincible = 0.2;
        playBounce();
        health--;
        if (health <= 0) gameState = 'gameOver';
        hitX = true;
        break;
      }
    }
  }
  if (hitX) player.x = newX; // keep attempted position for bounce effect

  // Collision Y
  player.y = newY;
  let hitY = false;
  const tilesToCheckY = [
    { x: Math.floor((player.x + 1) / TILE_SIZE), y: Math.floor(player.y / TILE_SIZE) },
    { x: Math.floor((player.x + player.w - 2) / TILE_SIZE), y: Math.floor(player.y / TILE_SIZE) },
    { x: Math.floor((player.x + 1) / TILE_SIZE), y: Math.floor((player.y + player.h) / TILE_SIZE) },
    { x: Math.floor((player.x + player.w - 2) / TILE_SIZE), y: Math.floor((player.y + player.h) / TILE_SIZE) }
  ];
  for (const t of tilesToCheckY) {
    const tile = getTileAtPixel(t.x * TILE_SIZE + TILE_SIZE / 2, t.y * TILE_SIZE + TILE_SIZE / 2);
    if (tile) {
      const lit = pointInLight(t.x * TILE_SIZE + TILE_SIZE / 2, t.y * TILE_SIZE + TILE_SIZE / 2);
      if (lit) {
        // lit tile -> bounce
        player.vy = 2;
        player.invincible = 0.2;
        playBounce();
        health--;
        if (health <= 0) gameState = 'gameOver';
        hitY = true;
        break;
      } else {
        // shadow tile -> can stand
        player.onGround = true;
        player.vy = 0;
        player.state = 'idle';
        hitY = true;
        // landing from jump gives score
        if (player.state === 'landing') {
          score += 10;
          player.state = 'idle';
        }
        break;
      }
    }
  }
  if (!hitY) {
    player.onGround = false;
    if (player.vy > 0) player.state = 'falling';
    else if (player.vy < 0) player.state = 'jumping';
  }

  // Invincibility timer
  if (player.invincible > 0) player.invincible -= dt;

  // Update animation state
  if (player.onGround) {
    if (Math.abs(player.vx) > 0.1) player.state = 'running';
    else player.state = 'idle';
  }
}

function updateShadowMeter(dt) {
  const playerFeetY = player.y + player.h;
  const inLight = pointInLight(player.x + player.w / 2, playerFeetY);
  if (inLight) {
    shadowMeter -= shadowMeterDecreaseRate * dt;
    if (shadowMeter < 0) shadowMeter = 0;
  } else {
    shadowMeter += shadowMeterIncreaseRate * dt;
    if (shadowMeter > 100) shadowMeter = 100;
  }
  if (shadowMeter <= 0) {
    // lose health
    health--;
    playBounce();
    shadowMeter = 100;
    if (health <= 0) gameState = 'gameOver';
  }
}

function updateTimer(dt) {
  if (gameState === 'playing') timer += dt;
}

function updateScore(dt) {
  // score per second survived
  score += Math.floor(dt * 10);
}

function checkEnemyCollision() {
  // placeholder: no enemies for brevity
}

function render() {
  ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  // draw background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, BASE_HEIGHT);
  grad.addColorStop(0, '#0a0a0a');
  grad.addColorStop(1, '#000000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

  // draw tiles
  for (let row = 0; row < mapHeightInTiles; row++) {
    for (let col = 0; col < mapWidthInTiles; col++) {
      const lit = pointInLight(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2);
      ctx.fillStyle = lit ? '#FFD700' : '#0A0A0A';
      ctx.globalAlpha = lit ? 0.8 : 1.0;
      ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
  ctx.globalAlpha = 1.0;

  // draw light sources (glow)
  for (const light of lights) {
    const grad = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
    grad.addColorStop(0, 'rgba(255,255,200,0.4)');
    grad.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(light.x - light.radius, light.y - light.radius, light.radius * 2, light.radius * 2);
  }

  // draw player
  ctx.fillStyle = player.invincible > 0 ? '#FF5555' : '#FFFFFF'; // outline flash
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(player.x, player.y, player.w, player.h, 4);
  ctx.stroke();
  ctx.fillStyle = '#111111';
  ctx.fill();

  // draw HUD (already in HTML overlay)
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;

  if (gameState === 'playing') {
    updatePlayer(dt);
    updateShadowMeter(dt);
    updateTimer(dt);
    updateScore(dt);
    checkEnemyCollision();
  }

  render();

  // update HUD elements
  document.getElementById('score').textContent = score;
  document.getElementById('timer').textContent = timer.toFixed(1);
  document.getElementById('health').textContent = health;
  document.getElementById('shadowMeter').value = shadowMeter;

  if (gameState !== 'gameOver') requestAnimationFrame(gameLoop);
  else {
    // show game over overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0'; overlay.style.left = '0';
    overlay.style.width = '100%'; overlay.style.height = '100%';
    overlay.style.background = 'rgba(0,0,0,0.8)';
    overlay.style.color = '#fff';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.fontFamily = 'sans-serif';
    overlay.innerHTML = `<h2>Game Over</h2><p>Score: ${score}</p><p>Time: ${timer.toFixed(1)}s</p><button id="restartBtn2">Restart</button>`;
    document.body.appendChild(overlay);
    document.getElementById('restartBtn2').onclick = () => {
      location.reload();
    };
  }
}

function init() {
  canvas = document.getElementById(CANVAS_ID);
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  initAudio();
  playAmbient();

  loadLevel();

  // Keyboard
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') keys.jump = true;
    if (e.key === 'Escape') {
      if (gameState === 'playing') gameState = 'paused';
      else if (gameState === 'paused') gameState = 'playing';
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') keys.jump = false;
  });

  // Touch joystick
  const joystick = document.getElementById('joystick');
  joystick.addEventListener('touchstart', e => {
    e.preventDefault();
    touchJoystick.active = true;
    const rect = joystick.getBoundingClientRect();
    touchJoystick.startX = rect.left + rect.width / 2;
    touchJoystick.startY = rect.top + rect.height / 2;
    touchJoystick.offsetX = 0;
    touchJoystick.offsetY = 0;
  });
  joystick.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!touchJoystick.active) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchJoystick.startX;
    const dy = touch.clientY - touchJoystick.startY;
    const maxDist = 30;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > maxDist) {
      const angle = Math.atan2(dy, dx);
      touchJoystick.offsetX = Math.cos(angle) * (maxDist / 30); // -1..1
      touchJoystick.offsetY = Math.sin(angle) * (maxDist / 30);
    } else {
      touchJoystick.offsetX = dx / 30;
      touchJoystick.offsetY = dy / 30;
    }
  });
  joystick.addEventListener('touchend', e => {
    e.preventDefault();
    touchJoystick.active = false;
    touchJoystick.offsetX = 0;
    touchJoystick.offsetY = 0;
  });

  // Touch jump button
  const jumpBtn = document.getElementById('jumpBtn');
  jumpBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    touchJump = true;
  });
  jumpBtn.addEventListener('touchend', e => {
    e.preventDefault();
    touchJump = false;
  });

  // Pause menu buttons
  document.getElementById('resumeBtn').onclick = () => { gameState = 'playing'; document.getElementById('pauseOverlay').style.display = 'none'; };
  document.getElementById('restartBtn').onclick = () => { location.reload(); };
  document.getElementById('menuBtn').onclick = () => { location.reload(); };

  // Start loop
  requestAnimationFrame(gameLoop);
}

window.onload = init;
