const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;
window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });

// Color palette
const COLORS = {
  bg: '#0f0f23',
  grid: '#2a2a4a',
  water: '#3a86ff',
  road: '#2d2d2d',
  res: '#4cc9f0',
  com: '#4caf50',
  ind: '#ff9800',
  util: '#9e9e9e',
  power: '#ffd700',
  waterPipe: '#00bcd4',
  tree: '#2e7d32',
  text: '#ffffff',
  hud: 'rgba(15,15,35,0.85)',
  neon: '#00f2ff'
};

// Game state
const TILE = 32;
const COLS = 60;
const ROWS = 40;
const grid = Array.from({length: ROWS}, () => Array(COLS).fill(0));
const buildings = [];
let resources = { money: 20000, pop: 0, jobs: 0, power: 0, water: 0 };
let demand = { res: 0, com: 0, ind: 0 };
let gameState = 'GAMEPLAY';
let gameSpeed = 1;
let day = 1;
let speedTimer = 0;
let selected = null;
let placing = null;
let rotate = 0;
let camera = { x: 0, y: 0, zoom: 1 };
let highScore = localStorage.getItem('urbanCanvasHighScore') || 0;
let speedrunStart = null;
let speedrunTime = 0;
let alerts = [];

// Audio
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, dur, type='sine') {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.frequency.value = freq; o.type = type;
  g.gain.setValueAtTime(0.001, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.start(); o.stop(audioCtx.currentTime + dur);
}

// Input
let mouse = { x: 0, y: 0, down: false, btn: 0 };
let panStart = null;
let keys = {};
window.addEventListener('mousedown', e => { mouse.down = true; mouse.btn = e.button; if (e.button === 1) panStart = {x: e.clientX, y: e.clientY}; handlePlace(); });
window.addEventListener('mouseup', e => { mouse.down = false; panStart = null; });
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; if (panStart) { camera.x += (e.clientX - panStart.x) * 0.5; camera.y += (e.clientY - panStart.y) * 0.5; } });
window.addEventListener('wheel', e => { camera.zoom = Math.max(0.5, Math.min(2, camera.zoom + e.deltaY * -0.001)); e.preventDefault(); }, {passive: false});
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if (e.key === 'r' && placing) rotate = (rotate + 1) % 4; if (e.key === 'Escape') { placing = null; selected = null; } if (e.key === ' ') panStart = {x: mouse.x, y: mouse.y}; });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; if (e.key === ' ') panStart = null; });
window.addEventListener('touchstart', e => { if (e.touches.length === 1) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; mouse.down = true; mouse.btn = 0; handlePlace(); } else if (e.touches.length === 2) panStart = {x: e.touches[0].clientX, y: e.touches[0].clientY}; });
window.addEventListener('touchmove', e => { if (e.touches.length === 1 && panStart) { camera.x += (e.touches[0].clientX - panStart.x) * 0.5; camera.y += (e.touches[0].clientY - panStart.y) * 0.5; } e.preventDefault(); }, {passive: false});
window.addEventListener('touchend', e => { mouse.down = false; panStart = null; });

function handlePlace() {
  if (!placing || mouse.btn !== 0) return;
  const gx = Math.floor((mouse.x - camera.x + w/2) / (TILE * camera.zoom)) + Math.floor(COLS/2);
  const gy = Math.floor((mouse.y - camera.y + h/2) / (TILE * camera.zoom)) + Math.floor(ROWS/2);
  if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS) return;
  if (grid[gy][gx] !== 0) return;
  const b = placing;
  if (resources.money < b.cost) { playSound(100, 0.2, 'square'); return; }
  resources.money -= b.cost;
  playSound(300, 0.1);
  const building = { type: b.type, gx, gy, rot: rotate, level: 1 };
  buildings.push(building);
  grid[gy][gx] = building;
  placing = null;
  selected = building;
  updateResources();
}

function updateResources() {
  let pop = 0, jobs = 0, power = 0, water = 0;
  for (const b of buildings) {
    if (b.type === 'res') pop += 50;
    if (b.type === 'com') jobs += 30;
    if (b.type === 'ind') jobs += 40;
    if (b.type === 'power') power += 100;
    if (b.type === 'water') water += 80;
  }
  resources.pop = pop; resources.jobs = jobs; resources.power = power; resources.water = water;
  if (pop > highScore) { highScore = pop; localStorage.setItem('urbanCanvasHighScore', highScore); }
}

function tick() {
  day++;
  if (day % 10 === 0) {
    const tax = resources.pop * 2;
    resources.money += tax;
    playSound(200, 0.05);
  }
  if (resources.money < 0 && day % 5 === 0) {
    resources.money -= 100;
    alerts.push({text: 'Budget Deficit!', time: 180});
    playSound(80, 0.5, 'sawtooth');
  }
  if (resources.power < resources.pop * 0.5) {
    alerts.push({text: 'Power Outage!', time: 180});
  }
  if (resources.water < resources.pop * 0.3) {
    alerts.push({text: 'Water Shortage!', time: 180});
  }
  if (resources.pop >= 10000 && resources.money > 0) {
    gameState = 'WON';
    playSound(500, 1, 'triangle');
  }
  if (resources.money < -5000) {
    gameState = 'GAME_OVER';
    playSound(60, 2, 'sawtooth');
  }
  updateResources();
  for (const a of alerts) a.time--;
  alerts = alerts.filter(a => a.time > 0);
}

function gameLoop() {
  const t = performance.now();
  if (speedrunStart) speedrunTime = t - speedrunStart;
  speedTimer++;
  if (speedTimer >= 60 / gameSpeed && gameState === 'GAMEPLAY') { tick(); speedTimer = 0; }

  // Render
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= COLS; x++) {
    const sx = x * TILE * camera.zoom + camera.x;
    if (sx < -TILE || sx > w + TILE) continue;
    ctx.beginPath();
    ctx.moveTo(sx, 0); ctx.lineTo(sx, h);
    ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    const sy = y * TILE * camera.zoom + camera.y;
    if (sy < -TILE || sy > h + TILE) continue;
    ctx.beginPath();
    ctx.moveTo(0, sy); ctx.lineTo(w, sy);
    ctx.stroke();
  }

  // Water river
  ctx.fillStyle = COLORS.water;
  for (let y = 0; y < ROWS; y++) {
    for (let x = COLS - 5; x < COLS; x++) {
      const sx = x * TILE * camera.zoom + camera.x;
      const sy = y * TILE * camera.zoom + camera.y;
      if (sx < -TILE || sx > w + TILE || sy < -TILE || sy > h + TILE) continue;
      ctx.fillRect(sx, sy, TILE * camera.zoom, TILE * camera.zoom);
    }
  }

  // Buildings
  for (const b of buildings) {
    const sx = b.gx * TILE * camera.zoom + camera.x;
    const sy = b.gy * TILE * camera.zoom + camera.y;
    if (sx < -TILE || sx > w + TILE || sy < -TILE || sy > h + TILE) continue;
    let color;
    if (b.type === 'res') color = COLORS.res;
    else if (b.type === 'com') color = COLORS.com;
    else if (b.type === 'ind') color = COLORS.ind;
    else if (b.type === 'power') color = COLORS.power;
    else if (b.type === 'water') color = COLORS.waterPipe;
    else if (b.type === 'road') color = COLORS.road;
    else if (b.type === 'tree') color = COLORS.tree;
    ctx.fillStyle = color;
    ctx.fillRect(sx, sy, TILE * camera.zoom, TILE * camera.zoom);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, TILE * camera.zoom, TILE * camera.zoom);
    if (b.type === 'ind') {
      ctx.fillStyle = 'rgba(255,152,0,0.3)';
      ctx.beginPath();
      ctx.arc(sx + TILE*camera.zoom/2, sy + TILE*camera.zoom/2, TILE*camera.zoom*0.3, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // Ghost preview
  if (placing) {
    const gx = Math.floor((mouse.x - camera.x + w/2) / (TILE * camera.zoom)) + Math.floor(COLS/2);
    const gy = Math.floor((mouse.y - camera.y + h/2) / (TILE * camera.zoom)) + Math.floor(ROWS/2);
    if (gx >= 0 && gx < COLS && gy >= 0 && gy < ROWS) {
      const valid = grid[gy][gx] === 0 && resources.money >= placing.cost;
      ctx.fillStyle = valid ? 'rgba(76,175,80,0.5)' : 'rgba(244,67,54,0.5)';
      ctx.fillRect(gx * TILE * camera.zoom + camera.x, gy * TILE * camera.zoom + camera.y, TILE * camera.zoom, TILE * camera.zoom);
    }
  }

  // HUD
  drawHUD();

  requestAnimationFrame(gameLoop);
}

function drawHUD() {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, w, 80);

  // Title
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Urban Canvas', 10, 25);
  ctx.font = '14px sans-serif';
  ctx.fillText('Day ' + day, 10, 50);

  // Resources
  const resX = w/2 - 180;
  const res = [
    {icon: '💰', val: resources.money, color: '#4caf50'},
    {icon: '👥', val: resources.pop, color: COLORS.res},
    {icon: '⚡', val: resources.power, color: COLORS.power},
    {icon: '💧', val: resources.water, color: COLORS.waterPipe}
  ];
  res.forEach((r, i) => {
    ctx.fillStyle = r.color;
    ctx.fillText(r.icon + ' ' + r.val, resX + i * 120, 30);
  });

  // Speed controls
  ctx.fillStyle = COLORS.text;
  ctx.fillText('[1x] [2x] [3x] [P]', w/2 + 180, 30);
  ctx.fillText('Speed: ' + gameSpeed + 'x', w/2 + 180, 50);

  // Speedrun timer
  if (speedrunStart) {
    const s = Math.floor(speedrunTime / 1000);
    ctx.fillStyle = COLORS.neon;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('⏱ ' + s + 's', w - 120, 30);
  }

  // High score
  ctx.fillStyle = COLORS.neon;
  ctx.fillText('🏆 ' + highScore, w - 120, 55);

  // Alerts
  if (alerts.length > 0) {
    ctx.fillStyle = 'rgba(244,67,54,0.8)';
    ctx.fillRect(w/2 - 150, h/2 - 30, 300, 40);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(alerts[0].text, w/2 - 140, h/2);
  }

  // Game states
  if (gameState === 'WON') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = COLORS.neon;
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏙️ CITY COMPLETE! 🏙️', w/2, h/2);
    ctx.font = '20px sans-serif';
    ctx.fillText('High Score: ' + highScore, w/2, h/2 + 50);
    ctx.textAlign = 'left';
  } else if (gameState === 'GAME_OVER') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#f44336';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💥 GAME OVER 💥', w/2, h/2);
    ctx.font = '20px sans-serif';
    ctx.fillText('Refresh to rebuild your city', w/2, h/2 + 50);
    ctx.textAlign = 'left';
  }

  // Building palette
  if (!placing) drawPalette();
}

function drawPalette() {
  const palette = [
    {type: 'road', name: 'Road', cost: 10, icon: '🛣️'},
    {type: 'res', name: 'House', cost: 100, icon: '🏠'},
    {type: 'com', name: 'Shop', cost: 150, icon: '🏪'},
    {type: 'ind', name: 'Factory', cost: 200, icon: '🏭'},
    {type: 'power', name: 'Power Plant', cost: 500, icon: '⚡'},
    {type: 'water', name: 'Water Tower', cost: 300, icon: '💧'},
    {type: 'tree', name: 'Tree', cost: 20, icon: '🌳'}
  ];
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(10, h - 100, w - 20, 90);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Building Palette (Click to Place)', 20, h - 80);
  palette.forEach((b, i) => {
    const x = 20 + i * 110;
    ctx.fillStyle = '#333';
    ctx.fillRect(x, h - 60, 90, 50);
    ctx.strokeStyle = COLORS.neon;
    ctx.strokeRect(x, h - 60, 90, 50);
    ctx.font = '24px sans-serif';
    ctx.fillText(b.icon, x + 30, h - 35);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText(b.name + ' $' + b.cost, x + 5, h - 15);
    // Check click
    if (mouse.down && mouse.btn === 0) {
      if (mouse.x >= x && mouse.x <= x + 90 && mouse.y >= h - 60 && mouse.y <= h - 10) {
        placing = b;
        playSound(250, 0.1);
        mouse.down = false;
      }
    }
  });
}

// Start speedrun timer on first interaction
window.addEventListener('click', () => { if (!speedrunStart) speedrunStart = performance.now(); }, {once: true});

// Keyboard shortcuts for speed
window.addEventListener('keydown', e => {
  if (e.key === '1') gameSpeed = 1;
  if (e.key === '2') gameSpeed = 2;
  if (e.key === '3') gameSpeed = 3;
  if (e.key === 'p' || e.key === 'P') gameSpeed = 0;
});

gameLoop();
