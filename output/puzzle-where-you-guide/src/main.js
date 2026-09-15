// Water Drop Maze - Main Game Logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelDisplay = document.getElementById('levelDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const sizeDisplay = document.getElementById('sizeDisplay');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const startBtn = document.getElementById('startBtn');
const levelSelect = document.getElementById('levelSelect');

// Responsive canvas sizing
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game state
let gameState = 'menu';
let currentLevel = 1;
let score = 0;
let highScore = localStorage.getItem('waterDropHighScore') || 0;
highScoreDisplay.textContent = highScore;

// Timer
let startTime = 0;
let elapsedTime = 0;

// Audio context
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}
function playSound(frequency, duration, type = 'sine') {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = frequency;
  osc.type = type;
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

// Player (water drop)
const player = {
  x: 50,
  y: 50,
  vx: 0,
  vy: 0,
  radius: 12,
  maxRadius: 20,
  minRadius: 8,
  color: '#00e5ff',
  pH: 7,
  pHColors: {
    0: '#ff0000',
    3: '#ff9800',
    7: '#00e5ff',
    11: '#9c27b0',
    14: '#e91e63'
  }
};

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Touch controls
let touchStartX = 0, touchStartY = 0;
canvas.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  e.preventDefault();
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  const touch = e.touches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const mag = Math.sqrt(dx*dx + dy*dy);
  if (mag > 30) {
    player.vx += dx * 0.001;
    player.vy += dy * 0.001;
  }
  e.preventDefault();
}, { passive: false });

// Level data (simplified)
const levels = [
  { walls: [{x:0,y:0,w:800,h:20},{x:0,y:580,w:800,h:20},{x:0,y:0,w:20,h:600}], goal: {x:760,y:560,r:15} },
  { walls: [{x:0,y:0,w:800,h:20},{x:0,y:580,w:800,h:20},{x:0,y:0,w:20,h:600},{x:400,y:200,w:20,h:400}], goal: {x:760,y:560,r:15} },
  { walls: [{x:0,y:0,w:800,h:20},{x:0,y:580,w:800,h:20},{x:0,y:0,w:20,h:600},{x:200,y:100,w:400,h:20},{x:200,y:300,w:400,h:20}], goal: {x:760,y:560,r:15} }
];

// Hazards and collectibles
const droplets = [];
const evaporators = [];
const oilSlicks = [];
const icePatches = [];
const fans = [];
const currents = [];
const pressurePlates = [];
const bridges = [];

function resetLevel() {
  player.x = 50;
  player.y = 50;
  player.vx = 0;
  player.vy = 0;
  player.radius = 12;
  player.pH = 7;
  droplets.length = 0;
  evaporators.length = 0;
  oilSlicks.length = 0;
  icePatches.length = 0;
  fans.length = 0;
  currents.length = 0;
  pressurePlates.length = 0;
  bridges.length = 0;
  
  const level = levels[currentLevel - 1] || levels[0];
  
  // Generate droplets
  for (let i = 0; i < 5; i++) {
    droplets.push({ x: 100 + i*120, y: 100 + i*80, r: 6, collected: false });
  }
  
  // Generate evaporators
  for (let i = 0; i < 2; i++) {
    evaporators.push({ x: 300 + i*200, y: 300, r: 8, active: true });
  }
  
  // Oil slicks
  oilSlicks.push({ x: 200, y: 200, w: 60, h: 30 });
  
  // Ice patches
  icePatches.push({ x: 500, y: 150, w: 50, h: 30 });
  
  // Fans
  fans.push({ x: 600, y: 400, w: 20, h: 20, direction: {x: -1, y: 0}, strength: 0.5 });
  
  // Currents
  currents.push({ x: 100, y: 500, w: 200, h: 20, direction: {x: 1, y: 0}, strength: 0.3 });
  
  // Pressure plates and bridges
  pressurePlates.push({ x: 400, y: 500, w: 30, h: 30, activated: false });
  bridges.push({ x: 400, y: 470, w: 60, h: 10, active: false });
}

// Collision detection
function circleRectCollision(circle, rect) {
  const distX = Math.abs(circle.x - rect.x - rect.w/2);
  const distY = Math.abs(circle.y - rect.y - rect.h/2);
  if (distX > (rect.w/2 + circle.radius)) return false;
  if (distY > (rect.h/2 + circle.radius)) return false;
  if (distX <= (rect.w/2)) return true;
  if (distY <= (rect.h/2)) return true;
  const dx = distX - rect.w/2;
  const dy = distY - rect.h/2;
  return (dx*dx + dy*dy <= (circle.radius*circle.radius));
}

function circleCircleCollision(c1, c2) {
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  return dist < c1.radius + c2.radius;
}

// Physics update
function update() {
  if (gameState !== 'playing') return;
  
  // Gravity
  player.vy += 0.3;
  if (player.vy > 8) player.vy = 8;
  
  // Friction
  player.vx *= 0.8;
  player.vy *= 0.8;
  
  // Input
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.vx -= 0.5;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) player.vx += 0.5;
  if (keys['ArrowUp'] || keys['w'] || keys['W']) player.vy -= 0.5;
  if (keys['ArrowDown'] || keys['s'] || keys['S']) player.vy += 0.5;
  
  // Apply forces from fans and currents
  fans.forEach(fan => {
    if (circleRectCollision(player, fan)) {
      player.vx += fan.direction.x * fan.strength;
      player.vy += fan.direction.y * fan.strength;
    }
  });
  
  currents.forEach(current => {
    if (circleRectCollision(player, current)) {
      player.vx += current.direction.x * current.strength;
      player.vy += current.direction.y * current.strength;
    } 
  });
  
  // Oil slicks - slow movement
  oilSlicks.forEach(oil => {
    if (circleRectCollision(player, oil)) {
      player.vx *= 0.95;
      player.vy *= 0.95;
    } 
  });
  
  // Ice patches - increase sliding
  icePatches.forEach(ice => {
    if (circleRectCollision(player, ice)) {
      player.vx *= 1.05;
      player.vy *= 1.05;
    } 
  });
  
  // Pressure plates
  pressurePlates.forEach(plate => {
    if (circleRectCollision(player, plate)) {
      plate.activated = true;
      bridges.forEach(b => {
        if (Math.abs(b.x - plate.x) < 50) b.active = true;
      });
    } 
  });
  
  // Move player
  player.x += player.vx;
  player.y += player.vy;
  
  // Wall collisions
  const level = levels[currentLevel - 1] || levels[0];
  level.walls.forEach(wall => {
    if (circleRectCollision(player, wall)) {
      // Elastic collision with 15% energy loss
      player.vx *= -0.85;
      player.vy *= -0.85;
      
      // Resolve penetration
      const distX = Math.abs(player.x - wall.x - wall.w/2);
      const distY = Math.abs(player.y - wall.y - wall.h/2);
      if (distX > distY) {
        player.x += player.vx > 0 ? -1 : 1;
      } else {
        player.y += player.vy > 0 ? -1 : 1;
      }
      playSound(200, 0.1, 'square');
    } 
  });
  
  // Bridge collisions
  bridges.forEach(b => {
    if (b.active && circleRectCollision(player, b)) {
      player.vx *= -0.85;
      player.vy *= -0.85;
    } 
  });
  
  // Collect droplets
  droplets.forEach(d => {
    if (!d.collected && circleCircleCollision(player, d)) {
      d.collected = true;
      player.radius = Math.min(player.radius + 0.5, player.maxRadius);
      player.pH = Math.min(player.pH + 0.5, 14);
      playSound(400, 0.1, 'sine');
    } 
  });
  
  // Avoid evaporators
  evaporators.forEach(e => {
    if (e.active && circleCircleCollision(player, e)) {
      player.radius = Math.max(player.radius - 0.3, player.minRadius);
      player.pH = Math.max(player.pH - 0.3, 0);
      playSound(150, 0.1, 'triangle');
    } 
  });
  
  // Update pH color
  const pHKey = Object.keys(player.pHColors).map(Number).sort((a,b)=>a-b);
  let color = '#00e5ff';
  for (let i = 0; i < pHKey.length; i++) {
    if (player.pH >= pHKey[i]) color = player.pHColors[pHKey[i]];
  } 
  player.color = color;
  
  // Check goal
  if (circleCircleCollision(player, level.goal)) {
    completeLevel();
  } 
  
  // Update timer
  if (startTime > 0) {
    elapsedTime = (Date.now() - startTime) / 1000;
    timerDisplay.textContent = elapsedTime.toFixed(2);
  } 
  
  // Update HUD
  levelDisplay.textContent = currentLevel;
  sizeDisplay.textContent = Math.round((player.radius / player.maxRadius) * 100);
}

function completeLevel() {
  gameState = 'complete';
  score += Math.round(1000 / elapsedTime);
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('waterDropHighScore', highScore);
    highScoreDisplay.textContent = highScore;
  } 
  playSound(800, 0.3, 'sine');
  setTimeout(() => {
    if (currentLevel < levels.length) {
      currentLevel++;
      resetLevel();
      gameState = 'playing';
      startTime = Date.now();
    } else {
      gameState = 'menu';
      showLevelSelect();
    } 
  }, 1000);
}

function showLevelSelect() {
  levelSelect.innerHTML = '';
  for (let i = 1; i <= levels.length; i++) {
    const btn = document.createElement('button');
    btn.className = 'levelBtn';
    btn.textContent = `Level ${i}`;
    btn.onclick = () => {
      currentLevel = i;
      resetLevel();
      gameState = 'playing';
      startTime = Date.now();
      levelSelect.style.display = 'none';
      startBtn.style.display = 'none';
    };
    levelSelect.appendChild(btn);
  }
  levelSelect.style.display = 'flex';
}

// Drawing
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#0f2027');
  bgGrad.addColorStop(1, '#1a2a40');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Parallax background elements
  ctx.fillStyle = '#263238';
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.arc(i * 60 + (player.x * 0.02), 100 + Math.sin(i * 0.5) * 20, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Draw walls
  ctx.fillStyle = '#455a64';
  const level = levels[currentLevel - 1] || levels[0];
  level.walls.forEach(wall => {
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  });
  
  // Draw bridges
  bridges.forEach(b => {
    if (b.active) {
      ctx.fillStyle = '#90a4ae';
      ctx.fillRect(b.x, b.y, b.w, b.h);
    } 
  });
  
  // Draw oil slicks
  ctx.fillStyle = '#795548';
  oilSlicks.forEach(oil => {
    ctx.fillRect(oil.x, oil.y, oil.w, oil.h);
  });
  
  // Draw ice patches
  ctx.fillStyle = '#81d4fa';
  icePatches.forEach(ice => {
    ctx.fillRect(ice.x, ice.y, ice.w, ice.h);
  });
  
  // Draw fans
  ctx.fillStyle = '#607d8b';
  fans.forEach(fan => {
    ctx.fillRect(fan.x, fan.y, fan.w, fan.h);
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(fan.x, fan.y + fan.h/2);
    ctx.lineTo(fan.x - 10 * fan.direction.x, fan.y + fan.h/2 - 5 * fan.direction.y);
    ctx.lineTo(fan.x - 10 * fan.direction.x, fan.y + fan.h/2 + 5 * fan.direction.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#607d8b';
  });
  
  // Draw currents
  ctx.fillStyle = '#00e5ff';
  ctx.globalAlpha = 0.3;
  currents.forEach(current => {
    ctx.fillRect(current.x, current.y, current.w, current.h);
  });
  ctx.globalAlpha = 1.0;
  
  // Draw pressure plates
  ctx.fillStyle = '#ff9800';
  pressurePlates.forEach(plate => {
    ctx.fillRect(plate.x, plate.y, plate.w, plate.h);
  });
  
  // Draw droplets
  ctx.fillStyle = '#00e5ff';
  droplets.forEach(d => {
    if (!d.collected) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    } 
  });
  
  // Draw evaporators
  ctx.fillStyle = '#f44336';
  evaporators.forEach(e => {
    if (e.active) {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    } 
  });
  
  // Draw goal
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.arc(level.goal.x, level.goal.y, level.goal.r, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw player (water drop)
  const grad = ctx.createRadialGradient(
    player.x - player.radius/3, player.y - player.radius/3,
    player.radius/3,
    player.x, player.y, player.radius
  );
  grad.addColorStop(0, player.color);
  grad.addColorStop(1, '#006064');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Surface tension animation
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Draw ripple effect
  if (player.vx !== 0 || player.vy !== 0) {
    ctx.strokeStyle = 'rgba(0,229,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius + 3, 0, Math.PI * 2);
    ctx.stroke();
  } 
  
  // Draw splash particles
  if (Math.random() < 0.1) {
    ctx.fillStyle = '#00e5ff';
    ctx.globalAlpha = 0.5;
    ctx.fillRect(player.x + Math.random()*10 - 5, player.y + Math.random()*10 - 5, 2, 2);
    ctx.globalAlpha = 1.0;
  } 
}

// Game loop
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();

// Start button
startBtn.addEventListener('click', () => {
  initAudio();
  currentLevel = 1;
  resetLevel();
  gameState = 'playing';
  startTime = Date.now();
  startBtn.style.display = 'none';
  levelSelect.style.display = 'none';
});

// Keyboard shortcuts
window.addEventListener('keydown', e => {
  if (e.key === 'p' || e.key === 'P') {
    gameState = gameState === 'playing' ? 'paused' : 'playing';
  } 
  if (e.key === 'r' || e.key === 'R') {
    resetLevel();
    startTime = Date.now();
  } 
});
