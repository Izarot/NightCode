// ===== InkBridge Game Engine =====
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = canvas.width = window.innerWidth;
let H = canvas.height = window.innerHeight;
window.addEventListener('resize', () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; });

// ===== Audio =====
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, dur=0.1, type='sine') {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); g.gain.exponentialValueAtTime(0.001, audioCtx.currentTime + dur);
  o.stop(audioCtx.currentTime + dur);
}

// ===== Game State =====
const GRAVITY = 0.5;
const LEMMING_RADIUS = 8;
const SAFE_FALL = 60;
const INK_COST_PER_PX = 0.05;
const MAX_INK = 400;
let inkAmount = MAX_INK;
let inkColor = '#00f';
let brushSize = 3;
let isDrawing = false;
let drawPoints = [];
let wetInk = [];
let solidInk = [];
let lemmings = [];
let exitPortal = { x: W - 60, y: H - 100, r: 25 };
let gameState = 'drawing'; // drawing | simulating
let speedMult = 1;
let gravityScale = 1;
let startTime = 0;
let elapsed = 0;
let highScore = localStorage.getItem('inkbridge-highscore') || 0;

// ===== DOM Elements =====
document.getElementById('brush-btn').addEventListener('click', () => brushSize = brushSize === 3 ? 10 : 3);
document.getElementById('eraser-btn').addEventListener('click', () => currentTool = 'eraser');
document.getElementById('color-blue').addEventListener('click', () => { inkColor = '#00f'; currentTool = 'brush'; });
document.getElementById('color-pink').addEventListener('click', () => { inkColor = '#f0f'; currentTool = 'brush'; });
document.getElementById('color-green').addEventListener('click', () => { inkColor = '#0f0'; currentTool = 'brush'; });
document.getElementById('color-violet').addEventListener('click', () => { inkColor = '#80f'; currentTool = 'brush'; });
document.getElementById('speed-btn').addEventListener('click', () => {
  speedMult = speedMult === 1 ? 2 : speedMult === 2 ? 4 : 1;
  document.getElementById('speed-btn').textContent = speedMult + 'x';
});
document.getElementById('reset-btn').addEventListener('click', resetSimulation);
const gravitySlider = document.getElementById('gravity-slider');
gravitySlider.addEventListener('input', () => gravityScale = gravitySlider.value / 100);

let currentTool = 'brush';
let lastDrawTime = 0;
const REFILL_DELAY = 3000;

// ===== Input =====
canvas.addEventListener('mousedown', (e) => {
  if (gameState !== 'drawing') return;
  isDrawing = true;
  drawPoints = [getMousePos(e)];
});
canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing || gameState !== 'drawing') return;
  const pos = getMousePos(e);
  const last = drawPoints[drawPoints.length - 1];
  const dist = Math.hypot(pos.x - last.x, pos.y - last.y);
  if (dist > 2) drawPoints.push(pos);
});
canvas.addEventListener('mouseup', () => { isDrawing = false; lastDrawTime = performance.now(); });
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (gameState !== 'drawing') return;
  isDrawing = true;
  drawPoints = [getTouchPos(e)];
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!isDrawing || gameState !== 'drawing') return;
  const pos = getTouchPos(e);
  const last = drawPoints[drawPoints.length - 1];
  const dist = Math.hypot(pos.x - last.x, pos.y - last.y);
  if (dist > 2) drawPoints.push(pos);
}, { passive: false });
canvas.addEventListener('touchend', () => { isDrawing = false; lastDrawTime = performance.now(); });

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}
function getTouchPos(e) {
  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0];
  return { x: t.clientX - rect.left, y: t.clientY - rect.top };
}

// ===== Lemming =====
function createLemmings(count) {
  lemmings = [];
  for (let i = 0; i < count; i++) {
    lemmings.push({
      x: 30 + i * 15,
      y: H - 180,
      vx: 0.3 + (i % 2 ? -0.3 : 0.3),
      vy: 0,
      r: LEMMING_RADIUS,
      state: 'walking',
      color: ['#ff6b6b','#4ecdc4','#ffe66d','#a8e6cf'][i % 4],
      saved: false
    });
  }
}

function updateLemmings(dt) {
  for (const l of lemmings) {
    if (l.saved) continue;
    // Simple physics
    l.vy += GRAVITY * gravityScale * dt;
    l.x += l.vx * dt;
    l.y += l.vy * dt;

    // Ground check
    const groundY = H - 120;
    if (l.y + l.r > groundY) {
      l.y = groundY - l.r;
      l.vy = 0;
      l.state = 'walking';
    } else {
      l.state = 'falling';
    }

    // Walk logic
    if (l.state === 'walking') {
      l.vx += (Math.random() - 0.5) * 0.02;
      l.vx = Math.max(-1.5, Math.min(1.5, l.vx));
    }

    // Check solid ink collision
    for (const seg of solidInk) {
      const d = distToSegment(l.x, l.y, seg.x1, seg.y1, seg.x2, seg.y2);
      if (d < l.r) {
        // Simple bounce
        l.vy *= -0.3;
        l.vx *= -0.5;
        l.y = seg.y1 - l.r;
      }
    }

    // Check exit portal
    const dx = l.x - exitPortal.x;
    const dy = l.y - exitPortal.y;
    if (Math.hypot(dx, dy) < exitPortal.r + l.r) {
      l.saved = true;
      playSound(880, 0.2);
    }
  }
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (len * len)));
  const projX = x1 + t * dx, projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

// ===== Drawing / Ink =====
function updateDrawing() {
  if (drawPoints.length > 1 && inkAmount > 0) {
    for (let i = 1; i < drawPoints.length; i++) {
      const a = drawPoints[i - 1], b = drawPoints[i];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const cost = dist * (brushSize / 3) * INK_COST_PER_PX;
      if (inkAmount >= cost) {
        inkAmount -= cost;
        wetInk.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, color: inkColor, size: brushSize, age: 0 });
      } else break;
    }
    drawPoints = [drawPoints[drawPoints.length - 1]];
  }

  // Age wet ink
  for (const w of wetInk) {
    w.age += 1;
    if (w.age > 60) {
      solidInk.push({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2, color: w.color });
      wetInk.splice(wetInk.indexOf(w), 1);
      playSound(220, 0.15, 'triangle');
    }
  }

  // Refill ink
  if (!isDrawing && performance.now() - lastDrawTime > REFILL_DELAY) {
    inkAmount = Math.min(MAX_INK, inkAmount + 2);
  }
}

function resetSimulation() {
  wetInk = [];
  solidInk = [];
  createLemmings(10);
  gameState = 'simulating';
  startTime = performance.now();
  elapsed = 0;
  playSound(110, 0.3, 'sawtooth');
}

// ===== Rendering =====
function render() {
  // Background
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, W, H);

  // Paper texture
  ctx.fillStyle = 'rgba(13,13,26,0.3)';
  for (let i = 0; i < 200; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }

  // Ground
  ctx.fillStyle = '#2a2a3a';
  ctx.fillRect(0, H - 120, W, 120);

  // Wet ink (glossy)
  for (const w of wetInk) {
    ctx.strokeStyle = w.color;
    ctx.lineWidth = w.size;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 10;
    ctx.shadowColor = w.color;
    ctx.beginPath();
    ctx.moveTo(w.x1, w.y1);
    ctx.lineTo(w.x2, w.y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Solid ink (matte)
  for (const s of solidInk) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.size || 3;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.stroke();
  }

  // Exit portal
  ctx.fillStyle = '#ff00ff';
  ctx.beginPath();
  ctx.arc(exitPortal.x, exitPortal.y, exitPortal.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Lemmings
  for (const l of lemmings) {
    ctx.fillStyle = l.color;
    ctx.beginPath();
    ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(l.x - 3, l.y - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(l.x + 3, l.y - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // HUD updates
  document.getElementById('ink-fill').style.height = (inkAmount / MAX_INK * 100) + '%';
  const savedCount = lemmings.filter(l => l.saved).length;
  document.getElementById('survivors').textContent = savedCount;
  document.getElementById('total').textContent = lemmings.length;
  document.getElementById('progress-fill').style.width = (savedCount / lemmings.length * 100) + '%';
  document.getElementById('timer').textContent = '⏱ ' + elapsed.toFixed(2) + 's';
}

// ===== Game Loop =====
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 16.67;
  lastTime = timestamp;

  if (gameState === 'simulating') {
    elapsed = (performance.now() - startTime) / 1000;
    updateLemmings(dt * speedMult);
  } else {
    updateDrawing();
  }

  render();
  requestAnimationFrame(gameLoop);
}

// ===== Init =====
createLemmings(10);
requestAnimationFrame(gameLoop);

// ===== Toast =====
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// ===== High Score =====
function checkHighScore() {
  const time = parseFloat(elapsed.toFixed(2));
  if (time < highScore || highScore === 0) {
    highScore = time;
    localStorage.setItem('inkbridge-highscore', highScore);
    showToast('New High Score: ' + highScore + 's!');
  }
}

// Check high score when all saved
function checkWin() {
  const saved = lemmings.filter(l => l.saved).length;
  if (saved >= 8 && gameState === 'simulating') {
    checkHighScore();
    showToast('All Lemmings Saved!');
    gameState = 'drawing';
  }
}

setInterval(checkWin, 500);
