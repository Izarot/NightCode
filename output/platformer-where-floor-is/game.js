// Ignis Ascent - Core Game
const CANVAS = document.getElementById('game');
const CTX = CANVAS.getContext('2d');
const TIMER_EL = document.getElementById('timer');
const STAMINA_FILL = document.getElementById('staminaFill');
const DEATH_OVERLAY = document.getElementById('deathOverlay');
const DEATH_STATS = document.getElementById('deathStats');

// Responsive canvas
function resize() {
  const scale = Math.min(window.innerWidth / 480, window.innerHeight / 270);
  CANVAS.width = 480;
  CANVAS.height = 270;
  CANVAS.style.width = (480 * scale) + 'px';
  CANVAS.style.height = (270 * scale) + 'px';
}
window.addEventListener('resize', resize);
resize();

// Game constants
const GRAVITY = 2200;
const JUMP_VEL = -620;
const MAX_SPEED_X = 320;
const MOVE_ACCEL = 4800;
const AIR_ACCEL = 1800;
const DASH_SPEED = 900;
const DASH_DURATION = 0.15;
const DASH_COOLDOWN = 1.0;
const LAVA_BASE_SPEED = 15;
const LAVA_ACCEL = 0.8;

// Game state
let player = { x: 240, y: 135, vx: 0, vy: 0, onGround: false, state: 'idle', stamina: 100, dashCooldown: 0, dashTimer: 0, jumpPressed: false, dashPressed: false, lastJumpTime: 0, coyoteTimer: 0 };
let lavaY = 250;
let timeSurvived = 0;
let height = 0;
let highScore = 0;
let lastTime = 0;
let running = true;

// Audio context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let lavaOsc, masterGain;

function initAudio() {
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(audioCtx.destination);
  
  lavaOsc = audioCtx.createOscillator();
  lavaOsc.type = 'sine';
  lavaOsc.frequency.value = 30;
  const lavaGain = audioCtx.createGain();
  lavaGain.gain.value = 0.1;
  lavaOsc.connect(lavaGain);
  lavaGain.connect(masterGain);
  lavaOsc.start();
}

function playJumpSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

function playDashSound() {
  const noise = audioCtx.createBufferSource();
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  noise.buffer = buffer;
  noise.connect(masterGain);
  noise.start();
}

function playLandSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(80, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });

// Game loop
function gameLoop(timestamp) {
  if (!running) return;
  
  const dt = 1/60;
  const delta = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  
  // Update
  update(dt);
  
  // Render
  render();
  
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  timeSurvived += dt;
  height += player.vy * dt;
  
  // Lava rise
  const speed = LAVA_BASE_SPEED + timeSurvived * LAVA_ACCEL;
  lavaY -= speed * dt;
  
  // Update dash cooldown
  if (player.dashCooldown > 0) player.dashCooldown -= dt;
  
  // Input
  if (keys['Space'] || keys['ArrowUp'] || keys['KeyW']) {
    if (!player.jumpPressed && player.lastJumpTime + 0.12 < timeSurvived) {
      player.jumpPressed = true;
    }
  } else {
    player.jumpPressed = false;
  }
  
  if (keys['ShiftLeft'] || keys['ControlLeft'] || keys['KeyC']) {
    if (!player.dashPressed && player.dashCooldown <= 0 && player.stamina >= 25) {
      player.dashPressed = true;
    }
  } else {
    player.dashPressed = false;
  }
  
  // Player physics
  if (player.state !== 'dash' && player.state !== 'dead') {
    // Horizontal movement
    let targetVx = 0;
    if (keys['ArrowLeft'] || keys['KeyA']) targetVx = -1;
    if (keys['ArrowRight'] || keys['KeyD']) targetVx = 1;
    
    const accel = player.onGround ? MOVE_ACCEL : AIR_ACCEL;
    player.vx += targetVx * accel * dt;
    player.vx = Math.max(-MAX_SPEED_X, Math.min(MAX_SPEED_X, player.vx));
    
    // Apply friction when not moving
    if (targetVx === 0 && player.onGround) {
      player.vx *= 0.9;
    }
    
    // Jump
    if (player.jumpPressed && (player.onGround || player.coyoteTimer > 0)) {
      player.vy = JUMP_VEL;
      player.onGround = false;
      player.lastJumpTime = timeSurvived;
      playJumpSound();
    }
    
    // Gravity
    player.vy += GRAVITY * dt;
    
    // Ground collision
    if (player.y + player.vy >= lavaY - 36) {
      player.y = lavaY - 36;
      player.vy = 0;
      player.onGround = true;
      player.coyoteTimer = 0.1;
    }
    
    // Update position
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    
    // Screen bounds
    if (player.x < 0) player.x = 0;
    if (player.x > 480 - 24) player.x = 480 - 24;
    
    // Coyote time
    if (player.coyoteTimer > 0) player.coyoteTimer -= dt;
  }
  
  // Dash
  if (player.dashPressed && player.dashCooldown <= 0 && player.stamina >= 25) {
    player.state = 'dash';
    player.dashTimer = DASH_DURATION;
    player.dashCooldown = DASH_COOLDOWN;
    player.stamina -= 25;
    playDashSound();
  }
  
  if (player.state === 'dash') {
    player.dashTimer -= dt;
    if (player.dashTimer <= 0) {
      player.state = 'idle';
    }
  }
  
  // Stamina
  if (player.onGround && player.state !== 'dash') {
    player.stamina = Math.min(100, player.stamina + 5 * dt);
  }
  
  // Death check
  if (player.y + 36 >= lavaY) {
    player.state = 'dead';
    running = false;
    showDeathScreen();
  }
  
  // Update timer
  const mins = Math.floor(timeSurvived / 60);
  const secs = Math.floor(timeSurvived % 60);
  const centi = Math.floor((timeSurvived % 1) * 100);
  TIMER_EL.textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}.${centi.toString().padStart(2,'0')}`;
  
  // Update stamina bar
  STAMINA_FILL.style.width = player.stamina + '%';
  STAMINA_FILL.style.background = player.stamina < 25 ? 'linear-gradient(90deg, #ff4444, #ffaa00)' : 'linear-gradient(90deg, #44ff88, #ff4444)';
  
  // High score
  if (timeSurvived > highScore) {
    highScore = timeSurvived;
    localStorage.setItem('ignis_ascent_hs', highScore.toString());
  }
}

function showDeathScreen() {
  const mins = Math.floor(timeSurvived / 60);
  const secs = Math.floor(timeSurvived % 60);
  DEATH_STATS.innerHTML = `
    <div>Survival Time: ${mins}m ${secs}s</div>
    <div>Height: ${Math.floor(height)}m</div>
    <div>High Score: ${Math.floor(highScore / 60)}m ${Math.floor(highScore % 60)}s</div>
  `;
  DEATH_OVERLAY.style.display = 'flex';
}

function restartGame() {
  player = { x: 240, y: 135, vx: 0, vy: 0, onGround: false, state: 'idle', stamina: 100, dashCooldown: 0, dashTimer: 0, jumpPressed: false, dashPressed: false, lastJumpTime: 0, coyoteTimer: 0 };
  lavaY = 250;
  timeSurvived = 0;
  height = 0;
  running = true;
  DEATH_OVERLAY.style.display = 'none';
  lastTime = 0;
  requestAnimationFrame(gameLoop);
}

// Render
function render() {
  CTX.clearRect(0, 0, 480, 270);
  
  // Lava
  CTX.fillStyle = '#FF3300';
  CTX.fillRect(0, lavaY, 480, 270 - lavaY);
  
  // Lava glow
  CTX.fillStyle = '#FF8800';
  CTX.globalAlpha = 0.3;
  CTX.fillRect(0, lavaY - 10, 480, 10);
  CTX.globalAlpha = 0.2;
  CTX.fillRect(0, lavaY - 20, 480, 10);
  CTX.globalAlpha = 0.1;
  CTX.fillRect(0, lavaY - 30, 480, 10);
  CTX.globalAlpha = 1;
  
  // Player
  CTX.fillStyle = player.state === 'dash' ? '#FFFFFF' : '#00FFAA';
  CTX.fillRect(player.x, player.y, 24, 36);
  
  // Stamina bar background
  CTX.fillStyle = '#2d2d4a';
  CTX.fillRect(140, 250, 200, 16);
  CTX.strokeStyle = '#4a4a6a';
  CTX.lineWidth = 2;
  CTX.strokeRect(140, 250, 200, 16);
  
  // Stamina fill
  CTX.fillStyle = player.stamina < 25 ? '#FFAA00' : '#44FF88';
  CTX.fillRect(142, 252, (player.stamina / 100) * 196, 12);
  
  // Timer
  CTX.fillStyle = '#44FF88';
  CTX.textShadow = '0 0 5px #44FF88';
  CTX.font = '14px JetBrains Mono';
  const mins = Math.floor(timeSurvived / 60);
  const secs = Math.floor(timeSurvived % 60);
  const centi = Math.floor((timeSurvived % 1) * 100);
  CTX.fillText(`${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}.${centi.toString().padStart(2,'0')}`, 10, 20);
}

// Init
function init() {
  const saved = localStorage.getItem('ignis_ascent_hs');
  if (saved) highScore = parseFloat(saved);
  
  initAudio();
  requestAnimationFrame(gameLoop);
}

init();

// Mobile touch controls
let touchStartX = 0;
let touchStartY = 0;

CANVAS.addEventListener('touchstart', e => {
  e.preventDefault();
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: false });

CANVAS.addEventListener('touchend', e => {
  e.preventDefault();
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  
  // Jump if tap near top
  if (touch.clientY < window.innerHeight * 0.5) {
    player.jumpPressed = true;
    player.lastJumpTime = timeSurvived;
    playJumpSound();
  }
  
  // Dash if tap near bottom
  if (touch.clientY > window.innerHeight * 0.5 && player.dashCooldown <= 0 && player.stamina >= 25) {
    player.dashPressed = true;
    player.dashTimer = DASH_DURATION;
    player.dashCooldown = DASH_COOLDOWN;
    player.stamina -= 25;
    playDashSound();
  }
}, { passive: false });