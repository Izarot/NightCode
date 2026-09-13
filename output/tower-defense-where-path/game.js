// Path-Painter Tower Defense - Core Game Logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const coinsEl = document.getElementById('coins');
const healthEl = document.getElementById('health');
const waveEl = document.getElementById('wave');
const timeEl = document.getElementById('time');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const towerBtns = document.querySelectorAll('.tower-btn');

// Game state
let gameState = 'playing';
let coins = 1000;
let health = 100;
let wave = 1;
const maxWaves = 5;
let waveTimer = 30;
let enemies = [];
let towers = [];
let pathPoints = [];
let trailSegments = [];
let selectedTowerType = 'archer';
let placingTower = false;
let previewTower = null;
let projectiles = [];
let particles = [];
let highScore = localStorage.getItem('highScore') || 0;
let speedrunStart = null;
let speedrunTime = 0;

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const sfxCache = {};

// Load sounds
function loadSFX(name, url) {
  fetch(url)
    .then(r => r.arrayBuffer())
    .then(arr => audioCtx.decodeAudioData(arr))
    .then(buf => { sfxCache[name] = buf; })
    .catch(() => {});
}

// Generate simple tones for SFX
function generateTone(freq, duration, type='square') {
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < buf.length; i++) {
    const t = i / audioCtx.sampleRate;
    data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 5);
  }
  return buf;
}

// Pre-generate SFX
function initSFX() {
  sfxCache['place'] = generateTone(200, 0.1);
  sfxCache['fire'] = generateTone(400, 0.05);
  sfxCache['hit'] = generateTone(150, 0.1);
  sfxCache['die'] = generateTone(100, 0.2);
  sfxCache['wave'] = generateTone(300, 0.3);
}

function playSFX(name, volume=0.3) {
  if (!sfxCache[name]) return;
  const source = audioCtx.createBufferSource();
  source.buffer = sfxCache[name];
  const gain = audioCtx.createGain();
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(audioCtx.destination);
  source.start(0);
}

// Tower types
const towerTypes = {
  archer: { name: 'Archer', cost: 100, range: 120, damage: 15, speed: 1, color: '#4a9' },
  mage: { name: 'Mage', cost: 150, range: 100, damage: 25, speed: 0.5, color: '#94a', aoe: true },
  cannon: { name: 'Cannon', cost: 200, range: 80, damage: 40, speed: 0.3, color: '#a44', splash: true },
  support: { name: 'Support', cost: 120, range: 150, damage: 0, speed: 0, color: '#4a4', buff: true }
};

// Enemy types
const enemyTypes = [
  { name: 'Goblin', health: 50, speed: 0.8, reward: 20, color: '#e74c3c' },
  { name: 'Orc', health: 100, speed: 0.5, reward: 40, color: '#8e44ad' },
  { name: 'Dragon', health: 200, speed: 0.3, reward: 80, color: '#e67e22' }
];

// Initialize
initSFX();
pathPoints.push({x: 0, y: canvas.height/2});
pathPoints.push({x: canvas.width/2, y: canvas.height/2});
pathPoints.push({x: canvas.width, y: canvas.height/2});

// Input handlers
towerBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    towerBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedTowerType = btn.dataset.type;
  });
});

canvas.addEventListener('mousedown', handlePlace);
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  handlePlace({offsetX: x, offsetY: y});
}, {passive: false});

function handlePlace(e) {
  if (gameState !== 'playing') return;
  const rect = canvas.getBoundingClientRect();
  const x = e.offsetX * (canvas.width / rect.width);
  const y = e.offsetY * (canvas.height / rect.height);
  const type = towerTypes[selectedTowerType];
  if (coins >= type.cost) {
    coins -= type.cost;
    towers.push({x, y, type: selectedTowerType, level: 1, cooldown: 0, health: 100});
    playSFX('place');
    updateHUD();
  }
}

function updateHUD() {
  coinsEl.textContent = coins;
  healthEl.textContent = health;
  waveEl.textContent = wave;
  localStorage.setItem('highScore', Math.max(highScore, wave).toString());
}

// Spawn enemies
function spawnWave() {
  playSFX('wave');
  const enemyCount = 5 + wave * 2;
  for (let i = 0; i < enemyCount; i++) {
    const type = enemyTypes[Math.min(Math.floor(wave/2), enemyTypes.length-1)];
    enemies.push({
      x: 0,
      y: canvas.height/2 + (Math.random()-0.5)*100,
      type,
      health: type.health,
      pathIndex: 0,
      trail: []
    });
  }
  waveTimer = 30;
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  
  if (gameState === 'playing') {
    update(dt);
  }
  render();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Update timer
  if (waveTimer > 0) {
    waveTimer -= dt;
    if (waveTimer <= 0 && enemies.length === 0) {
      wave++;
      if (wave > maxWaves) {
        gameState = 'victory';
        gameOverEl.style.display = 'block';
        finalScoreEl.textContent = `Victory! High Score: ${Math.max(highScore, wave)}`;
        return;
      }
      spawnWave();
    } else if (waveTimer <= 0 && enemies.length > 0) {
      waveTimer = 30;
    }
  }
  
  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    // Move along path
    if (e.pathIndex < pathPoints.length - 1) {
      const p1 = pathPoints[e.pathIndex];
      const p2 = pathPoints[e.pathIndex + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const speed = e.type.speed * 60 * dt;
      if (dist > 0) {
        e.x += (dx/dist) * speed;
        e.y += (dy/dist) * speed;
        // Add trail
        e.trail.push({x: e.x, y: e.y, time: Date.now()});
        if (e.trail.length > 50) e.trail.shift();
      }
      // Check if reached next point
      if (Math.abs(e.x - p2.x) < 5 && Math.abs(e.y - p2.y) < 5) {
        e.pathIndex++;
      }
    } else {
      // Reached base
      health -= 10;
      playSFX('hit');
      enemies.splice(i, 1);
      updateHUD();
      if (health <= 0) {
        gameState = 'gameover';
        gameOverEl.style.display = 'block';
        finalScoreEl.textContent = `Game Over! Wave: ${wave}, High Score: ${highScore}`;
      }
      continue;
    }
    
    // Tower targeting
    for (const t of towers) {
      const type = towerTypes[t.type];
      const dx = e.x - t.x;
      const dy = e.y - t.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist <= type.range && t.cooldown <= 0) {
        t.cooldown = 1 / type.speed;
        playSFX('fire');
        projectiles.push({
          x: t.x, y: t.y, tx: e.x, ty: e.y, damage: type.damage, speed: 200, type: t.type
        });
      }
    }
  }
  
  // Update projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    const dx = p.tx - p.x;
    const dy = p.ty - p.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 5) {
      // Hit enemy
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        const ex = e.x - p.x;
        const ey = e.y - p.y;
        if (Math.sqrt(ex*ex + ey*ey) < 15) {
          e.health -= p.damage;
          playSFX('hit');
          if (e.health <= 0) {
            coins += e.type.reward;
            playSFX('die');
            enemies.splice(j, 1);
            updateHUD();
          }
          break;
        }
      }
      projectiles.splice(i, 1);
    } else {
      p.x += (dx/dist) * p.speed * dt;
      p.y += (dy/dist) * p.speed * dt;
    }
  }
  
  // Update towers
  for (const t of towers) {
    if (t.cooldown > 0) t.cooldown -= dt;
  }
  
  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  
  // Update speedrun timer
  if (speedrunStart) {
    speedrunTime = (Date.now() - speedrunStart) / 1000;
    timeEl.textContent = speedrunTime.toFixed(2);
  }
}

function render() {
  // Clear
  ctx.fillStyle = '#1a1a3a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw background
  drawBackground();
  
  // Draw path
  drawPath();
  
  // Draw trails
  drawTrails();
  
  // Draw towers
  for (const t of towers) {
    const type = towerTypes[t.type];
    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Health bar
    if (t.health < 100) {
      ctx.fillStyle = '#000';
      ctx.fillRect(t.x - 15, t.y - 20, 30, 4);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(t.x - 15, t.y - 20, t.health / 100 * 30, 4);
    }
  }
  
  // Draw projectiles
  for (const p of projectiles) {
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw enemies
  for (const e of enemies) {
    ctx.fillStyle = e.type.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Health bar
    ctx.fillStyle = '#000';
    ctx.fillRect(e.x - 12, e.y - 18, 24, 3);
    ctx.fillStyle = '#f00';
    ctx.fillRect(e.x - 12, e.y - 18, e.health / e.type.health * 24, 3);
  }
  
  // Draw particles
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  
  // Draw timer
  timeEl.textContent = (waveTimer > 0 ? waveTimer : 0).toFixed(2);
}

function drawBackground() {
  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#1a1a3a');
  grad.addColorStop(1, '#0f0f2a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Parallax mountains
  ctx.fillStyle = '#2a2a5a';
  ctx.beginPath();
  ctx.moveTo(0, canvas.height * 0.7);
  ctx.bezierCurveTo(canvas.width * 0.25, canvas.height * 0.5, canvas.width * 0.5, canvas.height * 0.7, canvas.width * 0.75, canvas.height * 0.5);
  ctx.lineTo(canvas.width, canvas.height * 0.7);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.fill();
  
  // Ground
  ctx.fillStyle = '#2e8b57';
  ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
}

function drawPath() {
  if (pathPoints.length < 2) return;
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
  for (let i = 1; i < pathPoints.length; i++) {
    ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
  }
  ctx.stroke();
}

function drawTrails() {
  for (const e of enemies) {
    if (e.trail.length < 2) continue;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.trail[0].x, e.trail[0].y);
    for (let i = 1; i < e.trail.length; i++) {
      ctx.lineTo(e.trail[i].x, e.trail[i].y);
    }
    ctx.stroke();
  }
}

// Start game
speedrunStart = Date.now();
spawnWave();
updateHUD();
requestAnimationFrame(gameLoop);
