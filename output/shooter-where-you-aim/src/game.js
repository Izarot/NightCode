const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const BG_COLOR = '#0a0a0a';
const PLAYER_COLOR = '#00ffff';
const ENEMY_COLOR = '#ff00ff';
const PROJECTILE_COLOR = '#ffcc00';
const PARTICLE_COLOR = '#ff66ff';
const UI_COLOR = '#ffffff';

const PLAYER_RADIUS = 10;
const PLAYER_SPEED = 5;
const PLAYER_MAX_SPEED = 8;
const PLAYER_ACCEL = 0.2;
const PLAYER_FRICTION = 0.95;
const RECOIL_FORCE = 15;

const FIXED_DT = 1/120;
let lastTime = 0;
let accumulator = 0;

let keys = { w:false, a:false, s:false, d:false };
let mouse = { x:0, y:0 };
let aimTargetAngle = 0;
let aimAngle = 0;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

class Enemy {
  constructor(x,y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.speed = 2;
    this.target = player;
  }
  update(dt) {
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      const nx = dx/dist;
      const ny = dy/dist;
      this.x += nx * this.speed * dt;
      this.y += ny * this.speed * dt;
    }
  }
}

class Particle {
  constructor(x,y,vx,vy,life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.alpha = 1;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.alpha = this.life / 0.5;
  }
}

let player = {
  x: canvas.width/2,
  y: canvas.height/2,
  vx:0,
  vy:0,
  radius: PLAYER_RADIUS,
  health: 100,
  aimAngle: 0,
  recoil: {x:0, y:0}
};

let enemies = [];
let projectiles = [];
let particles = [];

let score = 0;
let highScore = localStorage.getItem('gravityLockHighScore') || 0;
let startTime = 0;
let gameState = 'start'; // start, play, pause, gameover

const projectilePool = [];
const particlePool = [];

function getProjectile() {
  return projectilePool.pop() || {x:0, y:0, vx:0, vy:0, radius:4, life:2};
}
function releaseProjectile(p) {
  projectilePool.push(p);
}
function getParticle() {
  return particlePool.pop() || {x:0, y:0, vx:0, vy:0, life:0.5, alpha:1};
}
function releaseParticle(p) {
  particlePool.push(p);
}

function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined') {
    window.addEventListener('deviceorientation', e => {
      const alpha = e.alpha * Math.PI/180;
      aimTargetAngle = Math.atan2(mouse.y - player.y, mouse.x - player.x) + alpha;
    });
  }
}
requestOrientationPermission();

function initUI() {
  document.getElementById('startBtn').addEventListener('click', () => {
    document.getElementById('startScreen').style.display = 'none';
    startTime = performance.now();
    gameState = 'play';
  });
  document.getElementById('resumeBtn').addEventListener('click', () => {
    gameState = 'play';
  });
  document.getElementById('quitBtn').addEventListener('click', () => {
    gameState = 'pause';
  });
  document.getElementById('restartBtn').addEventListener('click', () => {
    location.reload();
  });
}
function handleKeys(e) {
  if (e.key === ' ') keys[' '] = true;
  else if (e.key.toLowerCase() === 'w') keys['w'] = true;
  else if (e.key.toLowerCase() === 'a') keys['a'] = true;
  else if (e.key.toLowerCase() === 's') keys['s'] = true;
  else if (e.key.toLowerCase() === 'd') keys['d'] = true;
}
function handleKeyUp(e) {
  if (e.key === ' ') keys[' '] = false;
  else if (e.key.toLowerCase() === 'w') keys['w'] = false;
  else if (e.key.toLowerCase() === 'a') keys['a'] = false;
  else if (e.key.toLowerCase() === 's') keys['s'] = false;
  else if (e.key.toLowerCase() === 'd') keys['d'] = false;
}
function handleMouseMove(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
}
function lerp(a,b,t){return a + (b-a)*t;}

function update(dt) {
  // aim smoothing
  aimAngle = lerp(aimAngle, aimTargetAngle, 0.1);
  // player movement
  let ax = 0, ay = 0;
  if (keys['w']) ay -= 1;
  if (keys['s']) ay += 1;
  if (keys['a']) ax -= 1;
  if (keys['d']) ax += 1;
  if (Math.hypot(ax, ay) > 0) {
    const len = Math.hypot(ax, ay);
    ax = (ax/len) * PLAYER_ACCEL;
    ay = (ay/len) * PLAYER_ACCEL;
  } else {
    ax = 0;
    ay = 0;
  }
  // apply recoil
  player.vx += player.recoil.x;
  player.vy += player.recoil.y;
  player.recoil = {x:0, y:0};
  // apply acceleration
  player.vx += Math.cos(aimAngle) * ax;
  player.vy += Math.sin(aimAngle) * ay;
  // limit speed
  let speed = Math.hypot(player.vx, player.vy);
  if (speed > PLAYER_MAX_SPEED) {
    player.vx = (player.vx/speed) * PLAYER_MAX_SPEED;
    player.vy = (player.vy/speed) * PLAYER_MAX_SPEED;
  }
  // friction
  player.vx *= PLAYER_FRICTION;
  player.vy *= PLAYER_FRICTION;
  // update position
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  // wall collision (simple clamp)
  player.x = Math.max(PLAYER_RADIUS, Math.min(player.x, canvas.width - PLAYER_RADIUS));
  player.y = Math.max(PLAYER_RADIUS, Math.min(player.y, canvas.height - PLAYER_RADIUS));

  // shooting
  if (keys[' ']) {
    const angle = aimAngle;
    const p = getProjectile();
    p.x = player.x + Math.cos(angle) * 10;
    p.y = player.y + Math.sin(angle) * 10;
    p.vx = Math.cos(angle) * 10;
    p.vy = Math.sin(angle) * 10;
    p.radius = 4;
    p.life = 2;
    projectiles.push(p);
    // recoil
    player.recoil.x = -Math.cos(angle) * RECOIL_FORCE;
    player.recoil.y = -Math.sin(angle) * RECOIL_FORCE;
    // play sound
    playBeep();
  }

  // update projectiles
  for (let i = projectiles.length-1; i>=0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // check collision with enemies
    for (let j = enemies.length-1; j>=0; j--) {
      const e = enemies[j];
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist < p.radius + e.radius) {
        // enemy death
        score += 10;
        // spawn particles
        for (let k=0; k<12; k++) {
          const angle = Math.random()*Math.PI*2;
          const speed = 2 + Math.random()*3;
          const px = e.x + Math.cos(angle)*e.radius;
          const py = e.y + Math.sin(angle)*e.radius;
          const pParticle = getParticle();
          pParticle.x = px;
          pParticle.y = py;
          pParticle.vx = Math.cos(angle)*speed;
          pParticle.vy = Math.sin(angle)*speed;
          pParticle.life = 0.5;
          particles.push(pParticle);
        }
        enemies.splice(j,1);
        projectiles.splice(i,1);
        break;
      }
    }
    // remove off-screen
    if (p.x < -p.radius || p.x > canvas.width+p.radius || p.y < -p.radius || p.y > canvas.height+p.radius) {
      projectiles.splice(i,1);
    }
  }

  // update enemies
  for (let i=enemies.length-1; i>=0; i--) {
    const e = enemies[i];
    e.update(dt);
    // check collision with player
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    if (dist < player.radius + e.radius) {
      player.health -= 1;
      if (player.health <= 0) {
        gameState = 'gameover';
      }
    }
  }

  // spawn enemies at edges
  if (Math.random() < 0.02) {
    const side = Math.floor(Math.random()*4);
    let ex, ey;
    if (side===0) { ex = -20; ey = Math.random()*canvas.height; }
    else if (side===1) { ex = canvas.width+20; ey = Math.random()*canvas.height; }
    else if (side===2) { ex = Math.random()*canvas.width; ey = -20; }
    else { ex = Math.random()*canvas.width; ey = canvas.height+20; }
    enemies.push(new Enemy(ex, ey));
  }

  // particle update
  for (let i=particles.length-1; i>=0; i--) {
    const p = particles[i];
    p.update(dt);
    if (p.life <= 0) {
      particles.splice(i,1);
    }
  }

  // draw
  // background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // grid parallax
  const gridSize = 50;
  ctx.fillStyle = '#111111';
  for (let x=0; x<canvas.width; x+=gridSize) {
    for (let y=0; y<canvas.height; y+=gridSize) {
      const offsetX = (player.x - x) * 0.001;
      const offsetY = (player.y - y) * 0.001;
      ctx.beginPath();
      ctx.arc(x+offsetX, y+offsetY, 2, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // player
  ctx.fillStyle = PLAYER_COLOR;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
  ctx.fill();

  // enemies
  ctx.fillStyle = ENEMY_COLOR;
  for (const e of enemies) {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2);
    ctx.fill();
  }

  // projectiles
  ctx.fillStyle = PROJECTILE_COLOR;
  for (const p of projectiles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
    ctx.fill();
  }

  // particles
  ctx.fillStyle = PARTICLE_COLOR;
  for (const p of particles) {
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // HUD
  // crosshair
  const crossSize = 5 + Math.abs(mouse.x - player.x) + Math.abs(mouse.y - player.y) * 0.1;
  ctx.strokeStyle = UI_COLOR;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x - crossSize, player.y);
  ctx.lineTo(player.x + crossSize, player.y);
  ctx.moveTo(player.x, player.y - crossSize);
  ctx.lineTo(player.x, player.y + crossSize);
  ctx.stroke();

  // health bar
  const healthWidth = player.health * 2;
  ctx.fillStyle = '#0f0';
  ctx.fillRect(10, 10, healthWidth, 8);
  ctx.strokeStyle = '#333';
  ctx.strokeRect(10, 10, 200, 8);

  // score
  ctx.fillStyle = UI_COLOR;
  ctx.font = '18px monospace';
  ctx.fillText('Score: '+score, canvas.width-150, 30);

  // timer
  const elapsed = performance.now() - startTime;
  const minutes = Math.floor(elapsed/60000);
  const seconds = Math.floor((elapsed%60000)/1000);
  ctx.fillText('Time: '+minutes+':'+seconds, canvas.width-150, 60);

  // high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('gravityLockHighScore', highScore);
  }
  ctx.fillText('High Score: '+highScore, canvas.width-150, 80);

  // UI overlay
  if (gameState === 'start') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = UI_COLOR;
    ctx.textAlign = 'center';
    ctx.fillText('Tap to Play', canvas.width/2, canvas.height/2);
  } else if (gameState === 'pause') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = UI_COLOR;
    ctx.fillText('Paused', canvas.width/2, canvas.height/2-20);
    ctx.fillText('Resume', canvas.width/2, canvas.height/2+20);
    ctx.fillText('Quit', canvas.width/2, canvas.height/2+60);
  } else if (gameState === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = UI_COLOR;
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/3);
    ctx.fillText('Score: '+score, canvas.width/2, canvas.height/2-20);
    ctx.fillText('High Score: '+highScore, canvas.width/2, canvas.height/2-10);
    ctx.fillText('Play Again', canvas.width/2, canvas.height/2+20);
  }
}

function playBeep() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 440;
  gain.gain.value = 0.2;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

function gameLoop(timestamp) {
  if (!startTime) startTime = timestamp;
  const dt = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;
  accumulator += dt;
  while (accumulator >= FIXED_DT) {
    update(FIXED_DT);
    accumulator -= FIXED_DT;
  }
  requestAnimationFrame(gameLoop);
}

function init() {
  initUI();
  document.addEventListener('keydown', handleKeys);
  document.addEventListener('keyup', handleKeyUp);
  canvas.addEventListener('mousemove', handleMouseMove);
  requestAnimationFrame(gameLoop);
}
init();