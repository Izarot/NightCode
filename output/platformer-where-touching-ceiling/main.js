// === GRAV FLIP - Main Entry Point ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');

// Responsive canvas sizing
function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// === Web Audio API Setup ===
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  switch(type) {
    case 'jump':
      osc.frequency.value = 440; osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      break;
    case 'flip':
      osc.frequency.setValueAtTime(120, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.4);
      osc.type = 'sweep';
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      break;
    case 'collect':
      osc.frequency.value = 880; osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      break;
    case 'death':
      osc.frequency.value = 80; osc.type = 'square';
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      break;
    case 'checkpoint':
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.3);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      break;
  }
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}

// === Game Constants ===
const TILE_SIZE = 32;
const GRAV_DOWN = 0;
const GRAV_UP = 1;
const STATE = {
  MENU: 0, LEVEL_SELECT: 1, PLAYING: 2, PAUSED: 3, GAME_OVER: 4, LEVEL_COMPLETE: 5
};

// === Input Manager ===
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });

const ACTION = {
  LEFT: ['KeyA', 'ArrowLeft'],
  RIGHT: ['KeyD', 'ArrowRight'],
  JUMP: ['KeyW', 'ArrowUp', 'Space'],
  PAUSE: ['Escape']
};

function isActionPressed(action) {
  return ACTION[action].some(k => keys[k]);
}

// === Game State ===
let gameState = STATE.MENU;
let gravityState = GRAV_DOWN;
let player = { x: 100, y: 300, vx: 0, vy: 0, w: 24, h: 24, grounded: false, jumpBuffered: 0, coyoteTime: 0 };
let shards = [];
let shardCount = 0;
let checkpoints = [];
let checkpointActive = false;
let levelIndex = 0;
let speedrunTimer = 0;
let highScore = localStorage.getItem('gravFlipHighScore') || Infinity;
let particles = [];
let screenShake = 0;

// === Level Definitions ===
const levels = [
  {
    name: 'LEVEL 01: INVERSION PIT',
    tiles: [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    shardPositions: [{x:150,y:200},{x:250,y:180},{x:350,y:220},{x:450,y:160},{x:550,y:200}],
    checkpoint: {x: 500, y: 300},
    exit: {x: 850, y: 300}
  }
];

// === Particle System ===
function createParticles(x, y, color, count=10) {
  for(let i=0;i<count;i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random()-0.5)*200, vy: (Math.random()-0.5)*200,
      life: 0.5, color: color, size: 3
    });
  }
}

// === Physics & Collision ===
function getTile(level, tx, ty) { return level.tiles[ty] && level.tiles[ty][tx]; }
function tileToWorld(tx, ty) { return {x: tx*TILE_SIZE, y: ty*TILE_SIZE}; }

function checkCollision(level, rect, gravity) {
  const tx1 = Math.floor(rect.x / TILE_SIZE);
  const tx2 = Math.floor((rect.x + rect.w) / TILE_SIZE);
  const ty1 = Math.floor(rect.y / TILE_SIZE);
  const ty2 = Math.floor((rect.y + rect.h) / TILE_SIZE);
  for(let ty=ty1; ty<=ty2; ty++) {
    for(let tx=tx1; tx<=tx2; tx++) {
      if(getTile(level, tx, ty) === 1) return true;
    }
  }
  return false;
}

function resolveCollision(level, gravity) {
  // X-axis
  if(checkCollision(level, player, gravity)) {
    player.vx = 0;
  }
  // Y-axis
  if(gravity === GRAV_DOWN) {
    const feetY = player.y + player.h;
    const belowTile = getTile(level, Math.floor(player.x/TILE_SIZE), Math.floor(feetY/TILE_SIZE));
    const belowTile2 = getTile(level, Math.floor((player.x+player.w)/TILE_SIZE), Math.floor(feetY/TILE_SIZE));
    if((belowTile === 1 || belowTile2 === 1) && player.vy >= 0) {
      player.grounded = true;
      player.vy = 0;
      player.y = Math.floor(feetY/TILE_SIZE)*TILE_SIZE - player.h;
    } else {
      player.grounded = false;
    }
    // Ceiling flip trigger
    const headY = player.y;
    const aboveTile = getTile(level, Math.floor(player.x/TILE_SIZE), Math.floor(headY/TILE_SIZE));
    const aboveTile2 = getTile(level, Math.floor((player.x+player.w)/TILE_SIZE), Math.floor(headY/TILE_SIZE));
    if((aboveTile === 1 || aboveTile2 === 1) && player.vy < 0) {
      gravityState = GRAV_UP;
      player.vy = -player.vy * 0.8;
      player.y = Math.floor(headY/TILE_SIZE)*TILE_SIZE + TILE_SIZE;
      createParticles(player.x+player.w/2, player.y+player.h/2, '#ff00cc', 20);
      screenShake = 0.2;
      playSound('flip');
    }
  } else {
    const headY = player.y;
    const aboveTile = getTile(level, Math.floor(player.x/TILE_SIZE), Math.floor(headY/TILE_SIZE));
    const aboveTile2 = getTile(level, Math.floor((player.x+player.w)/TILE_SIZE), Math.floor(headY/TILE_SIZE));
    if((aboveTile === 1 || aboveTile2 === 1) && player.vy <= 0) {
      player.grounded = true;
      player.vy = 0;
      player.y = Math.floor(headY/TILE_SIZE)*TILE_SIZE + TILE_SIZE;
    } else {
      player.grounded = false;
    }
    // Floor flip trigger
    const feetY = player.y + player.h;
    const belowTile = getTile(level, Math.floor(player.x/TILE_SIZE), Math.floor(feetY/TILE_SIZE));
    const belowTile2 = getTile(level, Math.floor((player.x+player.w)/TILE_SIZE), Math.floor(feetY/TILE_SIZE));
    if((belowTile === 1 || belowTile2 === 1) && player.vy > 0) {
      gravityState = GRAV_DOWN;
      player.vy = -player.vy * 0.8;
      player.y = Math.floor(feetY/TILE_SIZE)*TILE_SIZE - player.h;
      createParticles(player.x+player.w/2, player.y+player.h/2, '#00f3ff', 20);
      screenShake = 0.2;
      playSound('flip');
    }
  }
}

// === Game Logic ===
function update(dt) {
  const level = levels[levelIndex];
  if(gameState !== STATE.PLAYING) return;

  // Movement
  if(isActionPressed('LEFT')) player.vx = Math.max(player.vx - 400*dt, -250);
  if(isActionPressed('RIGHT')) player.vx = Math.min(player.vx + 400*dt, 250);
  if(!isActionPressed('LEFT') && !isActionPressed('RIGHT')) {
    if(player.vx > 0) player.vx = Math.max(player.vx - 500*dt, 0);
    else if(player.vx < 0) player.vx = Math.min(player.vx + 500*dt, 0);
  }

  // Gravity
  const g = 1200;
  if(gravityState === GRAV_DOWN) player.vy += g*dt;
  else player.vy -= g*dt;
  player.vy = Math.max(-600, Math.min(600, player.vy));

  // Jump
  if(isActionPressed('JUMP')) {
    if(player.grounded || player.coyoteTime > 0) {
      player.vy = gravityState === GRAV_DOWN ? -450 : 450;
      player.grounded = false;
      player.coyoteTime = 0;
      playSound('jump');
    } else if(player.jumpBuffered > 0 && !player.grounded) {
      player.vy = gravityState === GRAV_DOWN ? -450 : 450;
      player.jumpBuffered = 0;
      playSound('jump');
    }
  }

  // Coyote time & jump buffer
  if(player.grounded) player.coyoteTime = 0.1;
  else player.coyoteTime -= dt;
  if(isActionPressed('JUMP')) player.jumpBuffered = 0.1;
  else player.jumpBuffered -= dt;

  // Update position
  player.x += player.vx*dt;
  player.y += player.vy*dt;

  // Collisions
  resolveCollision(level, gravityState);

  // Boundary check
  if(player.y > canvas.height + 100 || player.y < -100) {
    die();
  }

  // Shards
  for(let i=shards.length-1; i>=0; i--) {
    const s = shards[i];
    if(Math.abs(player.x - s.x) < 30 && Math.abs(player.y - s.y) < 30) {
      shards.splice(i, 1);
      shardCount++;
      playSound('collect');
      createParticles(s.x, s.y, '#ffd600', 15);
    }
  }

  // Checkpoint
  if(!checkpointActive && Math.abs(player.x - level.checkpoint.x) < 30 && Math.abs(player.y - level.checkpoint.y) < 30) {
    checkpointActive = true;
    playSound('checkpoint');
    createParticles(level.checkpoint.x, level.checkpoint.y, '#00f3ff', 20);
  }

  // Exit
  if(shardCount >= 5 && Math.abs(player.x - level.exit.x) < 40 && Math.abs(player.y - level.exit.y) < 60) {
    completeLevel();
  }

  // Particles
  for(let i=particles.length-1; i>=0; i--) {
    const p = particles[i];
    p.x += p.vx*dt; p.y += p.vy*dt;
    p.life -= dt;
    if(p.life <= 0) particles.splice(i, 1);
  }

  // Timer
  speedrunTimer += dt;
  if(speedrunTimer < highScore) {
    highScore = speedrunTimer;
    localStorage.setItem('gravFlipHighScore', highScore);
  }
}

function die() {
  gameState = STATE.GAME_OVER;
  playSound('death');
}

function completeLevel() {
  gameState = STATE.LEVEL_COMPLETE;
  if(speedrunTimer < highScore) {
    highScore = speedrunTimer;
    localStorage.setItem('gravFlipHighScore', highScore);
  }
}

function resetLevel() {
  player = { x: 100, y: 300, vx: 0, vy: 0, w: 24, h: 24, grounded: false, jumpBuffered: 0, coyoteTime: 0 };
  gravityState = GRAV_DOWN;
  shardCount = 0;
  checkpointActive = false;
  speedrunTimer = 0;
  shards = levels[levelIndex].shardPositions.map(s => ({...s}));
  particles = [];
}

// === Rendering ===
function render() {
  const level = levels[levelIndex];
  const shakeX = (Math.random()-0.5)*screenShake*4;
  const shakeY = (Math.random()-0.5)*screenShake*4;
  ctx.save();
  ctx.translate(shakeX, shakeY);
  screenShake = Math.max(0, screenShake - 0.02);

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#050510');
  bgGrad.addColorStop(1, '#0a0a1f');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if(gameState === STATE.MENU) {
    drawMenu();
  } else if(gameState === STATE.PLAYING || gameState === STATE.GAME_OVER || gameState === STATE.LEVEL_COMPLETE) {
    drawLevel(level);
    drawPlayer();
    drawShards();
    drawCheckpoint(level);
    drawExit(level);
    drawParticles();
    drawHUD(level);
  }

  ctx.restore();
}

function drawMenu() {
  ctx.fillStyle = '#00f3ff';
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GRAV FLIP', canvas.width/2, canvas.height/2 - 50);
  ctx.font = '20px sans-serif';
  ctx.fillText('Press SPACE to Start', canvas.width/2, canvas.height/2 + 20);
  ctx.fillText('High Score: ' + (highScore === Infinity ? '--:--' : formatTime(highScore)), canvas.width/2, canvas.height/2 + 50);
}

function drawLevel(level) {
  for(let ty=0; ty<level.tiles.length; ty++) {
    for(let tx=0; tx<level.tiles[ty].length; tx++) {
      if(level.tiles[ty][tx] === 1) {
        const x = tx*TILE_SIZE;
        const y = ty*TILE_SIZE;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = gravityState === GRAV_DOWN ? '#00f3ff' : '#ff00cc';
        ctx.lineWidth = 2;
        if(gravityState === GRAV_DOWN) ctx.strokeRect(x, y, TILE_SIZE, 2);
        else ctx.strokeRect(x, y+TILE_SIZE-2, TILE_SIZE, 2);
      }
    }
  }
}

function drawPlayer() {
  const color = gravityState === GRAV_DOWN ? '#00f3ff' : '#ff00cc';
  ctx.fillStyle = color;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(player.x, player.y, player.w, player.h);
  // Direction indicator
  ctx.beginPath();
  ctx.moveTo(player.x+player.w/2, player.y+player.h/2);
  ctx.lineTo(player.x+player.w/2, player.y + (gravityState === GRAV_DOWN ? player.h+10 : -10));
  ctx.stroke();
}

function drawShards() {
  shards.forEach(s => {
    ctx.fillStyle = '#ffd600';
    ctx.beginPath();
    ctx.moveTo(s.x, s.y-5);
    ctx.lineTo(s.x+8, s.y+5);
    ctx.lineTo(s.x-8, s.y+5);
    ctx.closePath();
    ctx.fill();
  });
}

function drawCheckpoint(level) {
  if(checkpointActive) return;
  ctx.fillStyle = '#00f3ff';
  ctx.beginPath();
  ctx.arc(level.checkpoint.x, level.checkpoint.y, 12, 0, Math.PI*2);
  ctx.fill();
}

function drawExit(level) {
  ctx.strokeStyle = '#ff00cc';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(level.exit.x, level.exit.y-30);
  ctx.lineTo(level.exit.x, level.exit.y+30);
  ctx.moveTo(level.exit.x-15, level.exit.y);
  ctx.lineTo(level.exit.x+15, level.exit.y);
  ctx.stroke();
}

function drawParticles() {
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life/0.5;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}

function drawHUD(level) {
  // Gravity indicator
  const cx = canvas.width/2 - 100;
  const cy = 50;
  ctx.strokeStyle = gravityState === GRAV_DOWN ? '#00f3ff' : '#ff00cc';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 25, 0, Math.PI*2);
  ctx.stroke();
  ctx.fillStyle = gravityState === GRAV_DOWN ? '#00f3ff' : '#ff00cc';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(gravityState === GRAV_DOWN ? 'G-DOWN' : 'G-UP', cx, cy+40);

  // Shards
  ctx.fillStyle = '#ffd600';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${shardCount} / 5`, canvas.width - 20, 30);

  // Level title & timer
  ctx.fillStyle = '#00f3ff';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(level.name, 20, 30);
  ctx.fillText('Time: ' + formatTime(speedrunTimer), 20, 50);
  ctx.fillText('Best: ' + formatTime(highScore), 20, 70);
}

function formatTime(t) {
  if(t === Infinity) return '--:--';
  const mins = Math.floor(t/60);
  const secs = Math.floor(t%60);
  const ms = Math.floor((t%1)*100);
  return `${mins}:${secs.toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`;
}

// === Game Loop ===
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

// Start
resetLevel();
gameLoop(0);

// Menu controls
window.addEventListener('keydown', e => {
  if(gameState === STATE.MENU && e.code === 'Space') {
    gameState = STATE.PLAYING;
  }
  if(gameState === STATE.GAME_OVER && e.code === 'Space') {
    resetLevel();
    gameState = STATE.PLAYING;
  }
  if(gameState === STATE.LEVEL_COMPLETE && e.code === 'Space') {
    levelIndex = (levelIndex + 1) % levels.length;
    resetLevel();
    gameState = STATE.PLAYING;
  }
});