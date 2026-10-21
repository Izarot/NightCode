// Portal Shift - Main Game Logic
// Color Palette: Deep slate blue background, neon cyan/orange portals, warm white player
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameState = 'MENU';
let currentLevel = 1;
const totalLevels = 30;
let highScore = localStorage.getItem('portalShiftHighScore') || '00:00';
let levelStartTime = 0;
let bestLevelTime = localStorage.getItem('portalShiftBestLevelTime') || null;

// Resize canvas to fit screen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  if (type === 'jump') {
    oscillator.type = 'square';
    oscillator.frequency.value = 200;
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.2);
  } else if (type === 'portal') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
  } else if (type === 'death') {
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } else if (type === 'collect') {
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.1);
  }
}

// Input Handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });

// Mouse/Touch Input
let mouseX = 0, mouseY = 0;
let aimDirection = { x: 1, y: 0 };
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  mouseX = touch.clientX - rect.left;
  mouseY = touch.clientY - rect.top;
});

// Particle System
class Particle {
  constructor() {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.life = 0;
    this.maxLife = 30;
    this.color = '#ffffff';
    this.size = 2;
    this.gravity = 0;
  }
  reset(x, y, vx, vy, life, color, size, gravity) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life;
    this.color = color;
    this.size = size;
    this.gravity = gravity;
  }
  update() {
    if (this.life > 0) {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.life--;
    }
  }
  draw(ctx, camera) {
    if (this.life > 0) {
      const alpha = this.life / this.maxLife;
      ctx.fillStyle = this.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(this.x - camera.x, this.y - camera.y, this.size, this.size);
      ctx.globalAlpha = 1;
    } else {
      this.size = 0;
    }
  }
}
const particlePool = [];
for (let i = 0; i < 200; i++) particlePool.push(new Particle());
function emitParticles(x, y, count, color, spread = 1) {
  for (let i = 0; i < count; i++) {
    const p = particlePool.find(p => p.life <= 0);
    if (p) {
      const angle = (Math.random() - 0.5) * Math.PI * spread;
      const speed = Math.random() * 2 + 1;
      p.reset(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, Math.random() * 20 + 10, color, Math.random() * 3 + 1, 0.1);
    }
  }
}

// Camera System
const camera = { x: 0, y: 0 };
function updateCamera(targetX, targetY, levelWidth, levelHeight) {
  const bufferX = canvas.width / 2 - 100;
  const bufferY = canvas.height / 2 - 100;
  camera.x = targetX - bufferX;
  camera.y = targetY - bufferY;
  camera.x = Math.max(0, Math.min(camera.x, levelWidth - canvas.width));
  camera.y = Math.max(0, Math.min(camera.y, levelHeight - canvas.height));
}

// Level Data (Simplified grid-based)
const levels = [
  {
    name: "LEVEL 01 / 30",
    width: 800,
    height: 600,
    tiles: [
      // Simple platform with gap
      {x:0, y:580, w:800, h:20, type:'solid'},
      {x:0, y:500, w:200, h:20, type:'solid'},
      {x:300, y:400, w:200, h:20, type:'solid'},
      {x:600, y:300, w:200, h:20, type:'solid'},
      {x:0, y:200, w:200, h:20, type:'solid'},
      {x:300, y:100, w:200, h:20, type:'solid'},
      {x:600, y:0, w:200, h:20, type:'solid'}
    ],
    hazards: [],
    keys: [{x: 350, y: 370}],
    doors: [{x: 650, y: 280, w: 20, h: 40, locked: true}],
    start: {x: 50, y: 480},
    end: {x: 750, y: 280}
  }
];

// Player Entity
const player = {
  x: 0, y: 0,
  vx: 0, vy: 0,
  w: 20, h: 20,
  grounded: false,
  coyoteTime: 0,
  jumpBuffer: 0,
  trailParticles: [],
  facing: 1,
  reset(level) {
    this.x = level.start.x;
    this.y = level.start.y;
    this.vx = 0; this.vy = 0;
    this.grounded = false;
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
  },
  update(level) {
    // Horizontal Input
    if (keys['KeyA'] || keys['ArrowLeft']) {
      this.vx -= 0.7;
      this.facing = -1;
      aimDirection.x = -1;
    } else if (keys['KeyD'] || keys['ArrowRight']) {
      this.vx += 0.7;
      this.facing = 1;
      aimDirection.x = 1;
    }
    if (keys['KeyW'] || keys['ArrowUp'] || keys['Space']) {
      this.jumpBuffer = 5;
    } else {
      this.jumpBuffer--;
    }
    // Jump
    if (this.jumpBuffer > 0 && (this.grounded || this.coyoteTime > 0)) {
      this.vy = -11.5;
      this.grounded = false;
      this.coyoteTime = 0;
      this.jumpBuffer = 0;
      playSound('jump');
      emitParticles(this.x, this.y + this.h, 5, '#ffffff', 0.5);
    }
    // Apply Physics
    this.vx = Math.max(-6.5, Math.min(6.5, this.vx));
    this.vy = Math.min(16, this.vy + 0.5);
    // Ground Check
    this.grounded = false;
    for (const tile of level.tiles) {
      if (this.vy >= 0 && this.y + this.h >= tile.y && this.y + this.h <= tile.y + 5 &&
          this.x + this.w > tile.x && this.x < tile.x + tile.w) {
        this.grounded = true;
        this.vy = 0;
        this.y = tile.y - this.h;
        this.coyoteTime = 10;
      }
    }
    if (!this.grounded) {
      this.coyoteTime--;
    }
    // Friction
    if (this.grounded && !keys['KeyA'] && !keys['ArrowLeft'] && !keys['KeyD'] && !keys['ArrowRight']) {
      this.vx *= 0.75;
    } else if (!this.grounded) {
      this.vx *= 0.85;
    }
    // Update Position
    this.x += this.vx;
    this.y += this.vy;
    // Trail Particles
    if (Math.random() < Math.abs(this.vx) * 0.3) {
      emitParticles(this.x, this.y + this.h/2, 1, '#ffffff', 0.2);
    }
    // Boundary Check
    if (this.y > level.height + 100) {
      this.reset(level);
      playSound('death');
    }
  },
  draw(ctx, camera) {
    // Player Core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x + this.w/2 - camera.x, this.y + this.h/2 - camera.y, this.w/2, 0, Math.PI * 2);
    ctx.fill();
    // Aura
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffff00';
    ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.beginPath();
    ctx.arc(this.x + this.w/2 - camera.x, this.y + this.h/2 - camera.y, this.w/2 + 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
};

// Portal System
const portals = { a: null, b: null };
let portalCooldown = 0;
function placePortal(type, x, y, normal) {
  const portal = { x, y, normal, type, cooldown: 0 };
  if (type === 'a') {
    portals.a = portal;
  } else {
    portals.b = portal;
  }
  playSound('portal');
}
function teleportPlayer(player, fromPortal, toPortal) {
  if (portalCooldown > 0) return;
  portalCooldown = 15;
  const dx = player.x - fromPortal.x;
  const dy = player.y - fromPortal.y;
  player.x = toPortal.x + dx * (toPortal.normal.x === 0 ? 1 : -1);
  player.y = toPortal.y + dy * (toPortal.normal.y === 0 ? 1 : -1);
  player.vx *= -1;
}

// Game State Management
function startGame() {
  gameState = 'PLAYING';
  document.getElementById('menu').style.display = 'none';
  currentLevel = 1;
  levelStartTime = Date.now();
  loadLevel(levels[currentLevel - 1]);
}
function showControls() {
  document.getElementById('controlsHint').innerHTML = 'W/UP: Jump | A/D: Move | Q: Portal A | E: Portal B | R: Reset | TAB: Toggle';
}
function exitGame() {
  window.close();
}

// Level Loading
let currentLevelData = null;
function loadLevel(level) {
  currentLevelData = level;
  player.reset(level);
  portals.a = null;
  portals.b = null;
  portalCooldown = 0;
  document.getElementById('levelTitle').textContent = level.name;
  levelStartTime = Date.now();
}

// Timer
function updateTimer() {
  if (gameState !== 'PLAYING') return;
  const elapsed = Math.floor((Date.now() - levelStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');
  document.getElementById('timer').textContent = `TIME: ${minutes}:${seconds}`;
  // Update High Score
  const currentBest = localStorage.getItem('portalShiftHighScore') || '99:99';
  if (`${minutes}:${seconds}` < currentBest) {
    localStorage.setItem('portalShiftHighScore', `${minutes}:${seconds}`);
    highScore = `${minutes}:${seconds}`;
  }
  document.getElementById('highScore').textContent = `HIGH SCORE: ${highScore}`;
}

// Main Game Loop
function gameLoop() {
  // Clear
  ctx.fillStyle = '#121218';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  if (gameState === 'MENU') {
    return;
  }

  if (gameState === 'PLAYING' && currentLevelData) {
    // Update
    updateCamera(player.x, player.y, currentLevelData.width, currentLevelData.height);
    player.update(currentLevelData);
    if (portalCooldown > 0) portalCooldown--;

    // Draw Level
    ctx.fillStyle = '#2a2d3a';
    for (const tile of currentLevelData.tiles) {
      ctx.fillRect(tile.x - camera.x, tile.y - camera.y, tile.w, tile.h);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(tile.x - camera.x, tile.y - camera.y, tile.w, tile.h);
    }

    // Draw Keys
    ctx.fillStyle = '#00f3ff';
    for (const key of currentLevelData.keys) {
      ctx.beginPath();
      ctx.arc(key.x - camera.x, key.y - camera.y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Doors
    ctx.fillStyle = '#ff5e00';
    for (const door of currentLevelData.doors) {
      if (door.locked) {
        ctx.fillRect(door.x - camera.x, door.y - camera.y, door.w, door.h);
      }
    }

    // Draw Portals
    if (portals.a) {
      ctx.fillStyle = '#00f3ff';
      ctx.beginPath();
      ctx.arc(portals.a.x - camera.x, portals.a.y - camera.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (portals.b) {
      ctx.fillStyle = '#ff5e00';
      ctx.beginPath();
      ctx.arc(portals.b.x - camera.x, portals.b.y - camera.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw Particles
    for (const p of particlePool) {
      p.update();
      p.draw(ctx, camera);
    }

    // Draw Player
    player.draw(ctx, camera);

    // Draw End Goal
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.arc(currentLevelData.end.x - camera.x, currentLevelData.end.y - camera.y, 15, 0, Math.PI * 2);
    ctx.fill();
  }

  updateTimer();
  requestAnimationFrame(gameLoop);
}
gameLoop();

// Portal Placement Controls
canvas.addEventListener('click', e => {
  if (gameState !== 'PLAYING') return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left + camera.x;
  const y = e.clientY - rect.top + camera.y;
  if (keys['KeyQ']) {
    placePortal('a', x, y, {x: 0, y: -1});
  } else if (keys['KeyE']) {
    placePortal('b', x, y, {x: 0, y: -1});
  }
});

// Reset Level
canvas.addEventListener('keydown', e => {
  if (e.code === 'KeyR' && gameState === 'PLAYING') {
    player.reset(currentLevelData);
  }
});
