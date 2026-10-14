const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hud = document.getElementById('hud');
const overlay = document.getElementById('overlay');
let dpr = window.devicePixelRatio || 1;
let scale = 1;
function resize() {
  scale = Math.min(window.innerWidth / canvas.width, window.innerHeight / canvas.height);
  canvas.style.width = (canvas.width * scale) + 'px';
  canvas.style.height = (canvas.height * scale) + 'px';
}
window.addEventListener('resize', resize);
resize();

// Audio context
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, dur, type='sine', vol=0.3) {
  let osc = audioCtx.createOscillator();
  let gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.value = vol;
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

// Game state
let gameState = 'menu';
let players = [];
let currentPlayer = 0;
let laps = 3;
let track = [];
let keys = {};
let lastTime = 0;
let speedTimer = 0;
let highScore = localStorage.getItem('highScore') || 0;

// Colors
const COLORS = {
  bg:'#0a0a0a', wall:'#333333', phaseWall:'#00ffff',
  bike:'#ff00ff', glow:'#00ffff', trail:'#ff00ff', phaseTrail:'#00ffff',
  hud:'#ffffff', panel:'#000000'
};

// Bike class
class Bike {
  constructor(x, y, name, color) {
    this.x = x; this.y = y;
    this.name = name;
    this.color = color;
    this.angle = 0;
    this.speed = 0;
    this.lap = 0;
    this.phaseCharge = 1;
    this.isPhased = false;
    this.phaseTimer = 0;
    this.trail = [];
    this.phaseTrail = [];
    this.collisions = 0;
    this.score = 0;
    this.finished = false;
  }
  update(dt) {
    if (this.finished) return;
    // Movement
    if (keys['ArrowUp'] || keys['w']) this.speed = Math.min(this.speed + 0.25, 8);
    if (keys['ArrowDown'] || keys['s']) this.speed = Math.max(this.speed - 0.25, -4);
    if (!(keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s'])) {
      if (this.speed > 0) this.speed = Math.max(this.speed - 0.15, 0);
      else if (this.speed < 0) this.speed = Math.min(this.speed + 0.15, 0);
    }
    if (keys['ArrowLeft'] || keys['a']) this.angle -= 4 * Math.PI/180;
    if (keys['ArrowRight'] || keys['d']) this.angle += 4 * Math.PI/180;
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    // Bounds
    if (this.x < 0) this.x = 0;
    if (this.x > canvas.width) this.x = canvas.width;
    if (this.y < 0) this.y = 0;
    if (this.y > canvas.height) this.y = canvas.height;
    // Trail
    this.trail.push({x:this.x, y:this.y, t:performance.now()});
    if (this.trail.length > 100) this.trail.shift();
    // Phase
    if (this.isPhased) {
      this.phaseTimer -= dt;
      if (this.phaseTimer <= 0) {
        this.isPhased = false;
        playSound(300, 0.3, 'square', 0.4);
      }
    }
  }
  draw() {
    // Trail
    ctx.strokeStyle = this.isPhased ? COLORS.phaseTrail : COLORS.trail;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 1; i < this.trail.length; i++) {
      let alpha = Math.max(0, 1 - (performance.now() - this.trail[i].t)/2000);
      ctx.globalAlpha = alpha * 0.7;
      if (i === 1) ctx.moveTo(this.trail[i-1].x, this.trail[i-1].y);
      ctx.lineTo(this.trail[i].x, this.trail[i].y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    // Bike
    if (this.isPhased) {
      ctx.globalAlpha = 0.4;
      ctx.shadowBlur = 8;
      ctx.shadowColor = COLORS.glow;
    } else {
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + 16*Math.cos(this.angle), this.y + 16*Math.sin(this.angle));
    ctx.lineTo(this.x + 12*Math.cos(this.angle+0.5), this.y + 12*Math.sin(this.angle+0.5));
    ctx.lineTo(this.x + 12*Math.cos(this.angle-0.5), this.y + 12*Math.sin(this.angle-0.5));
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
  activatePhase() {
    if (this.phaseCharge > 0 && !this.isPhased) {
      this.phaseCharge = 0;
      this.isPhased = true;
      this.phaseTimer = 1.5;
      playSound(600, 0.2, 'sine', 0.4);
    }
  }
}

// Track generation
function generateTrack() {
  track = [];
  let cx = canvas.width/2, cy = canvas.height/2;
  let angle = 0;
  let radius = 150;
  for (let i = 0; i < 100; i++) {
    angle += 0.1;
    let r = radius + Math.sin(i*0.2)*20;
    let x = cx + Math.cos(angle)*r;
    let y = cy + Math.sin(angle)*r;
    track.push({x, y});
  }
}

// Collision
function checkCollisions(bike) {
  // Simple wall bounds
  if (!bike.isPhased) {
    if (bike.x < 10 || bike.x > canvas.width-10 || bike.y < 10 || bike.y > canvas.height-10) {
      bike.speed *= -0.3;
      bike.collisions++;
      bike.score -= 20;
      playSound(100, 0.2, 'square', 0.5);
    }
  }
  // Lap counting
  if (bike.lap < laps && bike.x > canvas.width/2 - 20 && bike.x < canvas.width/2 + 20 && bike.y > canvas.height/2 - 20 && bike.y < canvas.height/2 + 20) {
    bike.lap++;
    bike.phaseCharge = 1;
    bike.score += 100;
    playSound(800, 0.3, 'sine', 0.4);
  }
  if (bike.lap >= laps && !bike.finished) {
    bike.finished = true;
    bike.score += 50;
    playSound(1000, 0.5, 'sine', 0.6);
  }
}

// Game init
function initGame() {
  players = [new Bike(canvas.width/2, canvas.height/2, 'Player 1', COLORS.bike)];
  currentPlayer = 0;
  generateTrack();
  gameState = 'playing';
  speedTimer = 0;
  overlay.innerHTML = '';
}

// Menu
function showMenu() {
  gameState = 'menu';
  overlay.innerHTML = '<h1>LIGHT-CYCLE PHASE</h1><button onclick="selectMode(3)">ARCADE (3 LAPS)</button><button onclick="selectMode(10)">MARATHON (10 LAPS)</button><button onclick="showSettings()">SETTINGS</button>';
}

function selectMode(lapCount) {
  laps = lapCount;
  initGame();
}

function showSettings() {
  overlay.innerHTML = '<h1>SETTINGS</h1><button onclick="toggleSound()">Toggle Sound</button><button onclick="showMenu()">Back</button>';
}

// Main loop
function gameLoop(timestamp) {
  let dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  if (dt > 0.1) dt = 0.1;
  
  // Clear
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  if (gameState === 'menu') {
    showMenu();
    return;
  }
  
  if (gameState === 'playing') {
    speedTimer += dt;
    // Update
    players.forEach(p => p.update(dt));
    // Collisions
    players.forEach(p => checkCollisions(p));
    // Draw track
    ctx.strokeStyle = COLORS.wall;
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let i = 1; i < track.length; i++) {
      if (i === 1) ctx.moveTo(track[i-1].x, track[i-1].y);
      ctx.lineTo(track[i].x, track[i].y);
    }
    ctx.stroke();
    // Draw bikes
    players.forEach(p => p.draw());
    // HUD
    let p = players[0];
    hud.innerHTML = `<div>${p.name} | Lap ${p.lap}/${laps} | Score: ${p.score} | Collisions: ${p.collisions}</div>
      <div>Phase: ${p.phaseCharge ? 'READY' : 'COOLDOWN'} | Speed: ${Math.round(p.speed*100/8)}%</div>
      <div>High Score: ${highScore}</div>`;
    // Win check
    if (players.some(p => p.finished)) {
      gameState = 'gameover';
      let winner = players.find(p => p.finished);
      if (winner.score > highScore) {
        highScore = winner.score;
        localStorage.setItem('highScore', highScore);
      }
      overlay.innerHTML = `<h1>GAME OVER</h1><p>Winner: ${winner.name}</p><p>Score: ${winner.score}</p><button onclick="showMenu()">Main Menu</button><button onclick="initGame()">Replay</button>`;
    }
  }
  
  requestAnimationFrame(gameLoop);
}

// Input
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === ' ') { players[0].activatePhase(); e.preventDefault(); }
  if (e.key === 'p' || e.key === 'P') { gameState = gameState === 'playing' ? 'paused' : 'playing'; }
  if (e.key === 'r' || e.key === 'R') { if (gameState !== 'menu') initGame(); }
  if (e.key === 'Escape') { showMenu(); }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Start
requestAnimationFrame(gameLoop);
