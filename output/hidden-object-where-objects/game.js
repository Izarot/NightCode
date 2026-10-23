const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerEl = document.getElementById('timer-display');
const scoreEl = document.getElementById('score-display');
const objEl = document.getElementById('obj-display');
const toastEl = document.getElementById('toast');

let width, height;
function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

let audioCtx;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playTone(freq, type='sine', dur=0.1) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.1, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g);
  g.connect(audioCtx.destination);
  o.start(t);
  o.stop(t + dur);
}

const state = {
  score: 0,
  highScore: localStorage.getItem('bb_high') || 0,
  found: 0,
  total: 3,
  time: 0,
  running: true,
  inspecting: false,
  inspectTarget: null,
  inspectTimer: 0
};
scoreEl.textContent = 'Best: ' + state.highScore;

const player = { x: width/2, y: height/2, vx: 0, vy: 0, radius: 6, color: '#fff' };
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; if(e.code==='KeyE') tryInspect(); if(e.code==='KeyF') tryCapture(); });
window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('mousedown', initAudio);
window.addEventListener('touchstart', initAudio);

const buttons = [];
function spawnButtons() {
  buttons.length = 0;
  const types = ['key','usb','coin','note'];
  for(let i=0; i<state.total; i++) {
    buttons.push({
      x: 150 + Math.random()*(width-300),
      y: 150 + Math.random()*(height-300),
      w: 60, h: 40,
      type: types[i % types.length],
      state: 'idle',
      revealed: false,
      captured: false,
      hidden: true
    });
  }
}
spawnButtons();

function tryInspect() {
  if(!state.running) return;
  const b = buttons.find(b => !b.captured && Math.hypot(player.x-b.x, player.y-b.y) < 80);
  if(b) {
    state.inspecting = true;
    state.inspectTarget = b;
    state.inspectTimer = 0;
    b.state = 'disguised';
    playTone(200, 'sawtooth', 0.2);
    showToast('Inspecting...');
  } else {
    showToast('No button nearby');
    playTone(100, 'square', 0.1);
  }
}

function tryCapture() {
  if(!state.inspecting || !state.inspectTarget || !state.inspectTarget.revealed) {
    showToast('Nothing to capture');
    playTone(100, 'square', 0.1);
    return;
  }
  const b = state.inspectTarget;
  b.captured = true;
  b.state = 'captured';
  state.found++;
  state.inspecting = false;
  state.inspectTarget = null;
  if(state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('bb_high', state.highScore);
    scoreEl.textContent = 'Best: ' + state.highScore;
  }
  objEl.textContent = state.found + ' / ' + state.total;
  playTone(600, 'sine', 0.1);
  playTone(800, 'sine', 0.1);
  showToast('Captured!');
  if(state.found >= state.total) {
    state.running = false;
    showToast('Level Complete!');
  }
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  setTimeout(() => toastEl.classList.remove('show'), 1500);
}

window.addEventListener('mousemove', e => { player.x = e.clientX; player.y = e.clientY; });
window.addEventListener('touchmove', e => { player.x = e.touches[0].clientX; player.y = e.touches[0].clientY; }, {passive:false});

let last = performance.now();
function update(dt) {
  if(!state.running) return;
  state.time += dt;
  const m = state.time * 1000;
  timerEl.textContent = new Date(m).toISOString().slice(14, 19);

  let ax = 0, ay = 0;
  if(keys['KeyA'] || keys['ArrowLeft']) ax = -30;
  if(keys['KeyD'] || keys['ArrowRight']) ax = 30;
  if(keys['KeyW'] || keys['ArrowUp']) ay = -30;
  if(keys['KeyS'] || keys['ArrowDown']) ay = 30;
  player.vx += ax * dt;
  player.vy += ay * dt;
  player.vx *= Math.pow(0.85, dt * 60);
  player.vy *= Math.pow(0.85, dt * 60);
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.x = Math.max(20, Math.min(width-20, player.x));
  player.y = Math.max(20, Math.min(height-20, player.y));

  if(state.inspecting && state.inspectTarget) {
    state.inspectTimer += dt;
    if(state.inspectTimer > 2.0) {
      state.inspectTarget.revealed = true;
      state.inspectTarget.state = 'revealed';
      playTone(400, 'sine', 0.2);
      showToast('Revealed!');
    }
  }
}

function draw() {
  ctx.fillStyle = '#05070a';
  ctx.fillRect(0,0,width,height);

  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.stroke();

  buttons.forEach(b => {
    if(b.captured) return;
    const revealed = b.revealed || b.state === 'revealed';
    const inspecting = state.inspecting && state.inspectTarget === b;

    ctx.fillStyle = revealed ? '#1e293b' : 'rgba(30,41,59,0.4)';
    ctx.fillRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);

    ctx.strokeStyle = revealed ? (inspecting ? '#00f2ff' : '#334155') : 'transparent';
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x - b.w/2, b.y - b.h/2, b.w, b.h);

    ctx.fillStyle = revealed ? '#fff' : 'rgba(255,255,255,0.3)';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labels = {key:'🔑', usb:'💾', coin:'🪙', note:'📝'};
    ctx.fillText(labels[b.type] || '?', b.x, b.y);

    if(inspecting) {
      const p = Math.min(state.inspectTimer / 2.0, 1);
      ctx.fillStyle = 'rgba(0,242,255,0.2)';
      ctx.fillRect(b.x - b.w/2, b.y - b.h/2 - 8, b.w * p, 4);
    }
  });

  if(state.inspecting && state.inspectTarget) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, 80, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(0,242,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  const nearest = buttons.filter(b => !b.captured).reduce((closest, b) => {
    const d = Math.hypot(player.x-b.x, player.y-b.y);
    return d < closest.d ? {b, d} : closest;
  }, {b: null, d: Infinity});

  if(nearest.b && !nearest.b.captured && !nearest.b.revealed) {
    const d = Math.floor(nearest.d);
    ctx.fillStyle = 'rgba(0,242,255,0.5)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(d + 'm', player.x, player.y - 20);
  }
}

function loop(now) {
  const dt = (now - last) / 1000;
  last = now;
  update(dt);
  draw();
  if(state.running) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
