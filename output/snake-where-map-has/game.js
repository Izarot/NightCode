"use strict";
(function(){
const C = document.getElementById('game');
const X = C.getContext('2d');
const W = 800, H = 600;
const GRID = 20;
let DPR = 1, scale = 1, offX = 0, offY = 0;

function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  const wr = window.innerWidth, hr = window.innerHeight;
  const r = Math.min(wr / W, hr / H);
  scale = r;
  C.style.width = (W * r) + 'px';
  C.style.height = (H * r) + 'px';
  C.width = W * DPR;
  C.height = H * DPR;
  X.setTransform(DPR, 0, 0, DPR, 0, 0);
  X.scale(r, r);
}
window.addEventListener('resize', resize);
resize();

// Audio
let AC = null;
function audio(){
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} }
  return AC;
}
function beep(f, d, t, v){
  const a = audio(); if (!a) return;
  try {
    const o = a.createOscillator(), g = a.createGain();
    o.frequency.value = f; o.type = t || 'square';
    g.gain.value = v || 0.1;
    o.connect(g); g.connect(a.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + (d || 0.1));
    o.stop(a.currentTime + (d || 0.1));
  } catch(e){}
}
const SFX = {
  eat: () => beep(600, 0.08, 'square', 0.08),
  portal: () => { beep(300, 0.1, 'sine', 0.08); setTimeout(()=>beep(900, 0.1, 'sine', 0.06), 50); },
  die: () => { beep(200, 0.3, 'sawtooth', 0.1); setTimeout(()=>beep(100, 0.4, 'sawtooth', 0.1), 150); },
  click: () => beep(800, 0.05, 'square', 0.05)
};

// Storage
const STORE = {
  get(k){ try { return localStorage.getItem(k); } catch(e){ return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
};
const HSK = 'portalSnake_hi';
let highScore = parseInt(STORE.get(HSK)) || 0;

// State
const STATE = { MENU: 0, PLAYING: 1, PAUSED: 2, OVER: 3 };
let state = STATE.MENU;
let snake, dir, qDir, food, portals, score, speed, foodsEaten, t0, elapsed, pauseTime, invuln;
let particles, scorePop, menuBtn, retryBtn, resumeBtn, menuReturnBtn, overlayBtn;
let lastT = 0, acc = 0;
const baseSpeed = 200, maxSpeed = 400;

function init(){
  snake = [{x: 10, y: 15}, {x: 9, y: 15}, {x: 8, y: 15}];
  dir = {x: 1, y: 0};
  qDir = null;
  food = null;
  portals = [];
  score = 0;
  foodsEaten = 0;
  speed = baseSpeed;
  t0 = performance.now();
  elapsed = 0;
  pauseTime = 0;
  invuln = 0;
  particles = [];
  scorePop = 0;
  spawnFood();
  spawnPortals(2);
}

function spawnFood(){
  let x, y, ok = false, tries = 0;
  while (!ok && tries < 200) {
    x = Math.floor(Math.random() * (W / GRID));
    y = Math.floor(Math.random() * (H / GRID));
    ok = !snake.some(s => s.x === x && s.y === y);
    if (ok) for (const p of portals) {
      const dx = x - p.x, dy = y - p.y;
      if (dx*dx + dy*dy < 9) { ok = false; break; }
    }
    tries++;
  }
  food = { x, y, spawn: performance.now() };
}

function spawnPortals(n){
  portals = [];
  const colors = ['#7b2cbf', '#f5576c', '#4ecdc4', '#ffe66d'];
  for (let i = 0; i < n; i++) {
    let x, y, ok = false, tries = 0;
    while (!ok && tries < 200) {
      x = 2 + Math.floor(Math.random() * ((W / GRID) - 4));
      y = 2 + Math.floor(Math.random() * ((H / GRID) - 4));
      ok = !snake.some(s => s.x === x && s.y === y);
      if (ok && food) if (x === food.x && y === food.y) ok = false;
      if (ok) for (const p of portals) if (p.x === x && p.y === y) ok = false;
      tries++;
    }
    let dx, dy, ok2 = false, tries2 = 0;
    while (!ok2 && tries2 < 200) {
      dx = 2 + Math.floor(Math.random() * ((W / GRID) - 4));
      dy = 2 + Math.floor(Math.random() * ((H / GRID) - 4));
      ok2 = Math.abs(dx - x) > 8 || Math.abs(dy - y) > 8;
      tries2++;
    }
    portals.push({ x, y, dx, dy, color: colors[i], cooldown: 0, t: Math.random() * 100 });
  }
}

function addParticles(x, y, color, n, life){
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1 + Math.random() * 3;
    particles.push({
      x: x * GRID + GRID/2, y: y * GRID + GRID/2,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: life || 40, max: life || 40, color: color || '#fff'
    });
  }
}

function update(dt){
  if (state !== STATE.PLAYING) return;
  elapsed = (performance.now() - t0 - pauseTime) / 1000;
  if (invuln > 0) invuln -= dt;
  for (const p of portals) { p.t += dt; if (p.cooldown > 0) p.cooldown -= dt; }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95;
    p.life -= 1;
    if (p.life <= 0) particles.splice(i, 1);
  }
  if (scorePop > 0) scorePop -= dt;

  acc += dt;
  const step = 1 / speed * GRID;
  while (acc >= step) {
    acc -= step;
    if (qDir && (qDir.x !== -dir.x || qDir.y !== -dir.y)) dir = qDir;
    qDir = null;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.x >= W/GRID || head.y < 0 || head.y >= H/GRID) {
      if (invuln <= 0) return gameOver();
    }
    let teleported = false;
    for (const p of portals) {
      if (p.cooldown <= 0 && head.x === p.x && head.y === p.y) {
        const exit = { x: p.dx, y: p.dy };
        const valid = !snake.some((s, i) => i > 0 && s.x === exit.x && s.y === exit.y)
          && exit.x >= 0 && exit.x < W/GRID && exit.y >= 0 && exit.y < H/GRID;
        if (valid) {
          head.x = exit.x; head.y = exit.y;
          invuln = 0.2;
          addParticles(p.dx, p.dy, p.color, 12, 50);
          SFX.portal();
          teleported = true;
        } else {
          invuln = 0.2;
        }
        p.cooldown = 0.5;
        break;
      }
    }
    if (head.x < 0 || head.x >= W/GRID || head.y < 0 || head.y >= H/GRID) {
      if (invuln <= 0) return gameOver();
    }
    for (let i = 1; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        if (invuln <= 0) return gameOver();
      }
    }
    snake.unshift(head);
    if (food && head.x === food.x && head.y === food.y) {
      score += 10;
      foodsEaten++;
      speed = Math.min(maxSpeed, baseSpeed * Math.pow(1.1, Math.floor(foodsEaten / 3)));
      scorePop = 0.3;
      addParticles(food.x, food.y, '#ffd93d', 8, 30);
      SFX.eat();
      spawnFood();
      const wantP = Math.min(4, 2 + Math.floor(foodsEaten / 5));
      if (portals.length < wantP) spawnPortals(wantP);
    } else {
      snake.pop();
    }
  }
}

function gameOver(){
  state = STATE.OVER;
  SFX.die();
  if (score > highScore) { highScore = score; STORE.set(HSK, highScore); }
}

function drawBg(){
  const g = X.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0a0a0f');
  g.addColorStop(1, '#1a1a2e');
  X.fillStyle = g;
  X.fillRect(0, 0, W, H);
}

function drawGrid(){
  X.strokeStyle = '#1e1e2f';
  X.lineWidth = 1;
  X.setLineDash([4, 4]);
  for (let x = 0; x <= W; x += GRID * 4) {
    X.beginPath(); X.moveTo(x, 0); X.lineTo(x, H); X.stroke();
  }
  for (let y = 0; y <= H; y += GRID * 4) {
    X.beginPath(); X.moveTo(0, y); X.lineTo(W, y); X.stroke();
  }
  X.setLineDash([]);
}

function drawSnake(){
  for (let i = snake.length - 1; i >= 0; i--) {
    const s = snake[i];
    const x = s.x * GRID, y = s.y * GRID;
    const alpha = 1 - (i / snake.length) * 0.9;
    X.globalAlpha = alpha;
    const g = X.createLinearGradient(x, y, x + GRID, y + GRID);
    g.addColorStop(0, '#e94560');
    g.addColorStop(1, '#ff6b6b');
    X.fillStyle = g;
    X.beginPath();
    if (i === 0) {
      X.shadowColor = '#ff6b6b';
      X.shadowBlur = 12;
      X.roundRect(x + 1, y + 1, GRID - 2, GRID - 2, 6);
      X.fill();
      X.shadowBlur = 0;
      X.fillStyle = '#fff';
      X.globalAlpha = 0.8;
      const ex = x + GRID/2 + dir.x * 4;
      const ey = y + GRID/2 + dir.y * 4;
      X.beginPath();
      X.arc(ex + dir.y * 4, ey - dir.x * 4, 1.5, 0, Math.PI * 2);
      X.arc(ex - dir.y * 4, ey + dir.x * 4, 1.5, 0, Math.PI * 2);
      X.fill();
    } else {
      X.roundRect(x + 2, y + 2, GRID - 4, GRID - 4, 4);
      X.fill();
    }
  }
  X.globalAlpha = 1;
  if (invuln > 0) {
    X.strokeStyle = '#fff';
    X.lineWidth = 2;
    X.globalAlpha = Math.sin(performance.now() / 50) * 0.5 + 0.5;
    X.strokeRect(snake[0].x * GRID + 1, snake[0].y * GRID + 1, GRID - 2, GRID - 2);
    X.globalAlpha = 1;
  }
}

function drawFood(){
  if (!food) return;
  const age = (performance.now() - food.spawn) / 1000;
  if (age < 0.1) X.globalAlpha = age / 0.1;
  const x = food.x * GRID + GRID/2;
  const y = food.y * GRID + GRID/2;
  const pulse = 0.8 + Math.sin(performance.now() / 200) * 0.2;
  const r = 6 * pulse;
  const g = X.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, '#fff5a3');
  g.addColorStop(0.5, '#ffd93d');
  g.addColorStop(1, 'rgba(255,217,61,0)');
  X.fillStyle = g;
  X.beginPath();
  X.arc(x, y, r, 0, Math.PI * 2);
  X.fill();
  X.globalAlpha = 1;
}

function drawPortals(){
  for (const p of portals) {
    const x = p.x * GRID + GRID/2;
    const y = p.y * GRID + GRID/2;
    const pulse = 1 + Math.sin(p.t * 2) * 0.05;
    const r = (GRID / 2) * pulse;
    for (let i = 0; i < 6; i++) {
      const a = p.t * 2 + (i / 6) * Math.PI * 2;
      const px = x + Math.cos(a) * (r * 0.7);
      const py = y + Math.sin(a) * (r * 0.7);
      X.fillStyle = p.color;
      X.globalAlpha = 0.6;
      X.beginPath();
      X.arc(px, py, 1.5, 0, Math.PI * 2);
      X.fill();
    }
    X.globalAlpha = 1;
    const g = X.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, p.color);
    g.addColorStop(0.5, p.color + '88');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    X.fillStyle = g;
    X.beginPath();
    X.arc(x, y, r, 0, Math.PI * 2);
    X.fill();
    X.strokeStyle = p.color;
    X.lineWidth = 2;
    X.shadowColor = p.color;
    X.shadowBlur = 8;
    X.beginPath();
    X.arc(x, y, r - 1, 0, Math.PI * 2);
    X.stroke();
    X.shadowBlur = 0;
    const ex = p.dx * GRID + GRID/2;
    const ey = p.dy * GRID + GRID/2;
    X.strokeStyle = p.color + '88';
    X.lineWidth = 1.5;
    X.setLineDash([3, 3]);
    X.beginPath();
    X.moveTo(x, y);
    X.lineTo(ex, ey);
    X.stroke();
    X.setLineDash([]);
  }
}

function drawParticles(){
  for (const p of particles) {
    X.globalAlpha = p.life / p.max;
    X.fillStyle = p.color;
    X.beginPath();
    X.arc(p.x, p.y, 2, 0, Math.PI * 2);
    X.fill();
  }
  X.globalAlpha = 1;
}

function drawPanel(x, y, w, h){
  X.fillStyle = 'rgba(0,0,0,0.4)';
  X.beginPath();
  X.roundRect(x, y, w, h, 8);
  X.fill();
}

function drawText(text, x, y, size, color, align, weight){
  X.font = (weight || 'bold') + ' ' + size + 'px Inter, sans-serif';
  X.fillStyle = color || '#fff';
  X.textAlign = align || 'left';
  X.textBaseline = 'top';
  X.fillText(text, x, y);
}

function drawHUD(){
  drawPanel(10, 10, 180, 40);
  drawText('SCORE: ' + score, 22, 20, 18, '#fff');
  drawPanel(W - 150, 10, 140, 40);
  drawText(Math.round(speed) + 'px/s', W - 80, 20, 16, '#fff', 'center');
  X.fillStyle = 'rgba(0,0,0,0.3)';
  X.fillRect(W - 138, 32, 120, 4);
  X.fillStyle = '#4ecdc4';
  X.fillRect(W - 138, 32, 120 * (speed - baseSpeed) / (maxSpeed - baseSpeed), 4);
  const pw = 32, gap = 8;
  const totalW = portals.length * pw + (portals.length - 1) * gap;
  const sx = (W - totalW) / 2;
  for (let i = 0; i < portals.length; i++) {
    X.shadowColor = portals[i].color;
    X.shadowBlur = 8;
    X.fillStyle = portals[i].color;
    X.beginPath();
    X.arc(sx + i * (pw + gap) + pw/2, 30, 12, 0, Math.PI * 2);
    X.fill();
    X.shadowBlur = 0;
  }
  drawText('PORTALS: ' + portals.length + '/4', W/2, 50, 12, '#fff', 'center');
  drawPanel(W - 150, 60, 140, 26);
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  drawText('TIME ' + mins + ':' + (secs < 10 ? '0' : '') + secs, W - 80, 65, 14, '#ffe66d', 'center');
  drawPanel(10, 60, 180, 26);
  drawText('HI: ' + highScore, 22, 65, 14, '#ffe66d');
  if (scorePop > 0) {
    X.globalAlpha = scorePop / 0.3;
    const s = 18 + (1 - scorePop/0.3) * 8;
    drawText('+10', 130, 18, s, '#ffe66d');
    X.globalAlpha = 1;
  }
}

function drawButton(b, label, hov){
  X.fillStyle = '#ffe66d';
  X.shadowColor = '#ffe66d';
  X.shadowBlur = hov ? 16 : 8;
  const scale = hov ? 1.05 : 1;
  const w = b.w * scale, h = b.h * scale;
  const x = b.x + (b.w - w) / 2, y = b.y + (b.h - h) / 2;
  X.beginPath();
  X.roundRect(x, y, w, h, 12);
  X.fill();
  X.shadowBlur = 0;
  X.fillStyle = '#212121';
  X.font = 'bold 20px Inter, sans-serif';
  X.textAlign = 'center';
  X.textBaseline = 'middle';
  X.fillText(label, b.x + b.w/2, b.y + b.h/2);
  if (b.ripple) {
    X.globalAlpha = b.ripple.a;
    X.fillStyle = '#fff';
    X.beginPath();
    X.arc(b.ripple.x, b.ripple.y, b.ripple.r, 0, Math.PI * 2);
    X.fill();
    X.globalAlpha = 1;
  }
}

function inBtn(b, mx, my){
  return mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h;
}

function drawMenu(){
  drawBg();
  drawGrid();
  X.globalAlpha = 0.4;
  drawPortals();
  X.globalAlpha = 1;
  drawText('PORTAL SNAKE', W/2, 150, 56, '#ff6b6b', 'center');
  drawText('🐍 Teleport. Survive. Score. 🐍', W/2, 220, 18, '#4ecdc4', 'center');
  drawText('High Score: ' + highScore, W/2, 260, 20, '#ffe66d', 'center');
  menuBtn = { x: W/2 - 100, y: 320, w: 200, h: 56 };
  const hov = mouseX !== null && inBtn(menuBtn, mouseX, mouseY);
  drawButton(menuBtn, 'PLAY', hov);
  drawText('WASD / Arrow Keys / Touch Swipe', W/2, 420, 14, '#aaa', 'center');
  drawText('ESC to Pause', W/2, 445, 12, '#888', 'center');
}

function drawGameOver(){
  X.fillStyle = 'rgba(0,0,0,0.7)';
  X.fillRect(0, 0, W, H);
  X.globalAlpha = Math.min(1, (performance.now() - overTime) / 300);
  drawText('GAME OVER', W/2, 180, 56, '#ff5f57', 'center');
  drawText('Final Score: ' + score, W/2, 260, 24, '#fff', 'center');
  drawText('High Score: ' + highScore, W/2, 295, 18, '#ffe66d', 'center');
  X.globalAlpha = 1;
  retryBtn = { x: W/2 - 90, y: 350, w: 180, h: 44 };
  menuReturnBtn = { x: W/2 - 90, y: 410, w: 180, h: 44 };
  drawButton(retryBtn, 'RETRY', mouseX !== null && inBtn(retryBtn, mouseX, mouseY));
  drawButton(menuReturnBtn, 'MENU', mouseX !== null && inBtn(menuReturnBtn, mouseX, mouseY));
}

function drawPaused(){
  X.fillStyle = 'rgba(0,0,0,0.6)';
  X.fillRect(0, 0, W, H);
  drawText('PAUSED', W/2, 220, 40, '#fff', 'center');
  resumeBtn = { x: W/2 - 90, y: 300, w: 180, h: 44 };
  drawButton(resumeBtn, 'RESUME', mouseX !== null && inBtn(resumeBtn, mouseX, mouseY));
}

let overTime = 0, mouseX = null, mouseY = null;

function render(){
  X.setTransform(DPR, 0, 0, DPR, 0, 0);
  X.scale(scale, scale);
  if (state === STATE.MENU) drawMenu();
  else {
    drawBg();
    if (showGrid) drawGrid();
    drawPortals();
    drawFood();
    drawSnake();
    drawParticles();
    drawHUD();
    if (state === STATE.PAUSED) drawPaused();
    if (state === STATE.OVER) drawGameOver();
  }
}

let showGrid = false;
function loop(t){
  const dt = Math.min(0.05, (t - lastT) / 1000);
  lastT = t;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

// Input
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === 'Escape') {
    if (state === STATE.PLAYING) { state = STATE.PAUSED; pauseStart = performance.now(); }
    else if (state === STATE.PAUSED) { state = STATE.PLAYING; pauseTime += performance.now() - pauseStart; }
  }
  if (e.key === 'g' || e.key === 'G') showGrid = !showGrid;
  if (state === STATE.PLAYING) {
    let nd = null;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') nd = {x: 0, y: -1};
    else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') nd = {x: 0, y: 1};
    else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') nd = {x: -1, y: 0};
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') nd = {x: 1, y: 0};
    if (nd) { qDir = nd; e.preventDefault(); }
  }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });
let pauseStart = 0;

function getPos(e){
  const r = C.getBoundingClientRect();
  const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
  const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
  return { x: cx * (W / r.width), y: cy * (H / r.height) };
}

C.addEventListener('mousemove', e => {
  const p = getPos(e); mouseX = p.x; mouseY = p.y;
});
C.addEventListener('mouseleave', () => { mouseX = null; mouseY = null; });
C.addEventListener('click', e => {
  audio();
  const p = getPos(e);
  if (state === STATE.MENU && inBtn(menuBtn, p.x, p.y)) {
    SFX.click(); state = STATE.PLAYING; init();
  } else if (state === STATE.OVER) {
    if (inBtn(retryBtn, p.x, p.y)) { SFX.click(); state = STATE.PLAYING; init(); }
    else if (inBtn(menuReturnBtn, p.x, p.y)) { SFX.click(); state = STATE.MENU; }
  } else if (state === STATE.PAUSED) {
    if (inBtn(resumeBtn, p.x, p.y)) { SFX.click(); state = STATE.PLAYING; pauseTime += performance.now() - pauseStart; }
  }
});

let touchStart = null;
C.addEventListener('touchstart', e => {
  audio();
  const p = getPos(e);
  touchStart = { x: p.x, y: p.y, t: performance.now() };
  if (state === STATE.PLAYING) {
    pauseTouchStart = performance.now();
  }
}, { passive: false });
C.addEventListener('touchmove', e => {
  if (state === STATE.PLAYING && touchStart) {
    const p = getPos(e);
    const dx = p.x - touchStart.x, dy = p.y - touchStart.y;
    const adx = Math.abs(dx), ady = Math.abs(dy);
    if (Math.max(adx, ady) > 30) {
      let nd = null;
      if (adx > ady) nd = { x: dx > 0 ? 1 : -1, y: 0 };
      else nd = { x: 0, y: dy > 0 ? 1 : -1 };
      qDir = nd;
      touchStart = { x: p.x, y: p.y, t: performance.now() };
    }
  }
  e.preventDefault();
}, { passive: false });
C.addEventListener('touchend', e => {
  if (state === STATE.PLAYING && pauseTouchStart) {
    const held = performance.now() - pauseTouchStart;
    if (held > 800) { state = STATE.PAUSED; pauseStart = performance.now(); }
  }
  if (touchStart) {
    const p = getPos(e.changedTouches[0]);
    if (state === STATE.MENU && inBtn(menuBtn, p.x, p.y)) { SFX.click(); state = STATE.PLAYING; init(); }
    else if (state === STATE.OVER) {
      if (inBtn(retryBtn, p.x, p.y)) { SFX.click(); state = STATE.PLAYING; init(); }
      else if (inBtn(menuReturnBtn, p.x, p.y)) { SFX.click(); state = STATE.MENU; }
    } else if (state === STATE.PAUSED) {
      if (inBtn(resumeBtn, p.x, p.y)) { SFX.click(); state = STATE.PLAYING; pauseTime += performance.now() - pauseStart; }
    }
  }
  touchStart = null;
  pauseTouchStart = 0;
});
let pauseTouchStart = 0;

// Init
state = STATE.MENU;
lastT = performance.now();
requestAnimationFrame(loop);
})();
