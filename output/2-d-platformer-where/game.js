// PhaseShift: Veil of Shadows - Core Game Engine
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive canvas sizing
function resizeCanvas() {
  const w = window.innerWidth;
  const h = Math.min(window.innerHeight, 600);
  canvas.width = w;
  canvas.height = h;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Vibrant color palette
const COLORS = {
  bg: '#0f0f2a',
  player: '#4fc3f7',
  playerAccent: '#ffffff',
  enemy: '#ff5252',
  enemyAccent: '#ffc107',
  platform: '#4caf50',
  hazard: '#ff1744',
  phase: '#b388ff',
  ui: '#00e676',
  text: '#ffffff'
};

// Audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration, type='sine') {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

// Game state
const gameState = {
  score: 0,
  highScore: parseInt(localStorage.getItem('phaseShiftHighScore')) || 0,
  speedrunTime: 0,
  phaseCooldown: 0,
  phaseActive: false,
  phaseTimer: 0,
  gameTime: 0
};

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });
canvas.addEventListener('mousedown', e => { if (!gameState.phaseActive && gameState.phaseCooldown <= 0 && player.onGround) activatePhase(); });

// Player class
class Player {
  constructor() {
    this.x = 100;
    this.y = canvas.height - 150;
    this.width = 30;
    this.height = 40;
    this.vx = 0;
    this.vy = 0;
    this.speed = 5;
    this.maxSpeed = 8;
    this.jumpPower = 15;
    this.gravity = 0.8;
    this.onGround = false;
    this.health = 100;
    this.phaseAlpha = 1;
  }
  update(dt) {
    // Horizontal movement
    if (keys['ArrowLeft'] || keys['KeyA']) {
      this.vx = Math.min(this.vx + this.speed * dt * 60, this.maxSpeed);
    } else if (keys['ArrowRight'] || keys['KeyD']) {
      this.vx = Math.max(this.vx - this.speed * dt * 60, -this.maxSpeed);
    } else {
      this.vx *= 0.85;
    }
    
    // Jumping
    if ((keys['Space'] || keys['ArrowUp']) && this.onGround && !gameState.phaseActive) {
      this.vy = -this.jumpPower;
      this.onGround = false;
      playSound(300, 0.1, 'square');
    }
    
    // Apply gravity
    this.vy += this.gravity * dt * 60;
    this.y += this.vy * dt * 60;
    this.x += this.vx * dt * 60;
    
    // Boundary check
    if (this.x < 0) this.x = 0;
    if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;
    
    // Platform collision (simplified ground check)
    let onAnyPlatform = false;
    for (const p of platforms) {
        if (this.vy >= 0 && 
            this.y + this.height >= p.y && 
            this.y + this.height <= p.y + p.height + 10 && 
            this.x + this.width > p.x && 
            this.x < p.x + p.width) {
            this.y = p.y - this.height;
            this.vy = 0;
            this.onGround = true;
            onAnyPlatform = true;
        }
    }
    if (!onAnyPlatform) this.onGround = false;

    // Fall off screen
    if (this.y > canvas.height) {
        this.health = 0;
    }
    
    // Phase input
    if (keys['KeyE'] && !gameState.phaseActive && gameState.phaseCooldown <= 0 && this.onGround) {
      activatePhase();
    }
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = gameState.phaseActive ? this.phaseAlpha : 1;
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = COLORS.playerAccent;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }
}

const player = new Player();

// Enemy class
class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    this.vx = 0;
    this.vy = 0;
    this.patrolDir = 1;
    this.health = 100;
    this.stunned = false;
    this.stunTimer = 0;
  }
  update(dt) {
    if (this.stunned) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) this.stunned = false;
      return;
    }
    this.vx = this.patrolDir * 2;
    this.x += this.vx * dt * 60;
    
    // Simple patrol
    if (this.x < 0 || this.x > canvas.width - this.width) {
      this.patrolDir *= -1;
    }
    
    // Ground check
    if (this.y < canvas.height - this.height) {
        this.vy += 0.5 * dt * 60;
        this.y += this.vy * dt * 60;
    } else {
        this.y = canvas.height - this.height;
        this.vy = 0;
    }
  }
  draw() {
    ctx.fillStyle = this.stunned ? '#8e44ad' : COLORS.enemy;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = COLORS.enemyAccent;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
}

const enemies = [new Enemy(300, 0), new Enemy(600, 0)];

// Platforms
const platforms = [
  {x: 0, y: canvas.height - 10, width: canvas.width, height: 10},
  {x: 200, y: canvas.height - 100, width: 100, height: 10},
  {x: 500, y: canvas.height - 200, width: 100, height: 10}
];

// Hazards
const hazards = [
  {x: 400, y: canvas.height - 30, width: 20, height: 20}
];

// Phase functions
function activatePhase() {
  gameState.phaseActive = true;
  gameState.phaseTimer = 3;
  gameState.phaseCooldown = 3;
  player.phaseAlpha = 0.5;
  playSound(800, 0.2, 'sine');
}

function updatePhase(dt) {
  if (gameState.phaseActive) {
    gameState.phaseTimer -= dt;
    player.phaseAlpha = 0.3 + Math.sin(gameState.phaseTimer * 20) * 0.2;
    if (gameState.phaseTimer <= 0) {
      gameState.phaseActive = false;
      player.phaseAlpha = 1;
      playSound(600, 0.15, 'sine');
    }
  }
  if (gameState.phaseCooldown > 0) {
    gameState.phaseCooldown -= dt;
  }
}

// Collision detection
function checkCollisions() {
  // Hazard collisions
  for (const h of hazards) {
    if (!gameState.phaseActive && player.x + player.width > h.x && player.x < h.x + h.width &&
        player.y + player.height > h.y && player.y < h.y + h.height) {
      player.health -= 10;
      playSound(100, 0.2, 'square');
    }
  }
  
  // Enemy collisions
  for (const e of enemies) {
    if (player.x + player.width > e.x && player.x < e.x + e.width &&
        player.y + player.height > e.y && player.y < e.y + e.height) {
      if (gameState.phaseActive) {
        if (!e.stunned) {
            e.stunned = true;
            e.stunTimer = 2;
            e.health -= 20;
            if (e.health <= 0) {
                enemies.splice(enemies.indexOf(e), 1);
                gameState.score += 100;
            }
        }
      } else {
        player.health -= 0.5;
        playSound(150, 0.1, 'square');
      }
    }
  }
}

// HUD drawing
function drawHUD() {
  // Health bar
  ctx.fillStyle = COLORS.ui;
  ctx.fillRect(20, 20, 200, 20);
  ctx.fillStyle = COLORS.hazard;
  ctx.fillRect(20, 20, Math.max(0, player.health * 2), 20);
  ctx.strokeStyle = COLORS.text;
  ctx.strokeRect(20, 20, 200, 20);
  ctx.fillStyle = COLORS.text;
  ctx.font = '14px Arial';
  ctx.fillText('HP', 25, 35);
  
  // Phase meter
  ctx.fillStyle = COLORS.phase;
  ctx.beginPath();
  ctx.arc(250, 30, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.text;
  ctx.stroke();
  
  // Cooldown text
  ctx.fillStyle = COLORS.text;
  ctx.font = '14px Arial';
  ctx.fillText(`Phase: ${Math.max(0, gameState.phaseCooldown).toFixed(1)}s`, 280, 35);
  
  // Score
  ctx.fillStyle = COLORS.text;
  ctx.font = '18px Arial';
  ctx.fillText(`Score: ${gameState.score}`, 20, 60);
  
  // High score
  ctx.fillText(`High: ${gameState.highScore}`, 20, 80);
  
  // Speedrun timer
  ctx.fillStyle = COLORS.ui;
  ctx.font = '16px Arial';
  ctx.fillText(`Time: ${gameState.speedrunTime.toFixed(1)}s`, canvas.width - 150, 30);
}

// Background with parallax
function drawBackground() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Parallax layers
  ctx.fillStyle = '#1a1a4a';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc((gameState.gameTime * 20 + i * 150) % (canvas.width + 300) - 150, 100, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Main game loop
let lastTime = 0;
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  
  // Update
  gameState.gameTime += dt;
  gameState.speedrunTime += dt;
  updatePhase(dt);
  player.update(dt);
  for (const e of enemies) e.update(dt);
  checkCollisions();
  
  // Score increment
  gameState.score = Math.floor(gameState.gameTime * 10);
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem('phaseShiftHighScore', gameState.highScore);
  }
  
  // Draw
  drawBackground();
  for (const p of platforms) {
    ctx.fillStyle = COLORS.platform;
    ctx.fillRect(p.x, p.y, p.width, p.height);
  }
  for (const h of hazards) {
    ctx.fillStyle = COLORS.hazard;
    ctx.fillRect(h.x, h.y, h.width, h.height);
  }
  for (const e of enemies) e.draw();
  player.draw();
  drawHUD();

  if (player.health <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
      return;
  }
  
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);