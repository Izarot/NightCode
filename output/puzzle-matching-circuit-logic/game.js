// Circuit Logic Puzzle - Vanilla JS
(() => {
'use strict';

// ============ AUDIO ============
const Audio = {
  ctx: null,
  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e) { this.ctx = null; }
    }
  },
  beep(freq, dur, type='sine', vol=0.15) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.stop(this.ctx.currentTime + dur);
  },
  click() { this.beep(800, 0.05, 'square', 0.08); },
  place() { this.beep(440, 0.1, 'sine', 0.12); },
  bonk() { this.beep(120, 0.15, 'sawtooth', 0.1); },
  zap() { this.beep(1200, 0.08, 'square', 0.06); },
  bulb() { this.beep(880, 0.2, 'sine', 0.15); setTimeout(()=>this.beep(1320,0.2,'sine',0.12),80); },
  error() { this.beep(200, 0.3, 'sawtooth', 0.15); },
  win() { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.beep(f,0.2,'sine',0.15),i*100)); }
};

// ============ COLORS ============
const COLORS = {
  bg: '#152E2E',
  grid: '#1f4040',
  inactive: '#9E9E9E',
  outline: '#424242',
  active: '#FFC107',
  dim: '#607D8B',
  error: '#F44336',
  accent: '#03A9F4',
  inputA: '#E53935',
  inputB: '#1E88E5',
  bulbOff: '#757575',
  bulbOn: '#FFEB3B',
  glow: '#FFEB3B'
};

// ============ LEVELS ============
const LEVELS = [
  { id: '1-1', chapter: 'Basic Wires', name: 'Straight Wire', grid: [8,6], inputs: [{x:1,y:3,val:1,name:'A'}], output: {x:6,y:3}, goal: 'STATIC', desc: 'Connect A to the bulb', inv: { wireS: 1 } },
  { id: '1-2', chapter: 'Basic Wires', name: 'Corner Path', grid: [8,6], inputs: [{x:1,y:1,val:1,name:'A'}], output: {x:6,y:4}, goal: 'STATIC', desc: 'Route around obstacles', inv: { wireS: 1, wireC: 2 } },
  { id: '1-3', chapter: 'Basic Wires', name: 'Long Path', grid: [8,6], inputs: [{x:1,y:1,val:1,name:'A'}], output: {x:6,y:4}, goal: 'STATIC', desc: 'Build any working path', inv: { wireS: 2, wireC: 2 } },
  { id: '2-1', chapter: 'AND Logic', name: 'AND Gate', grid: [8,6], inputs: [{x:1,y:2,val:1,name:'A'},{x:1,y:4,val:1,name:'B'}], output: {x:6,y:3}, goal: 'STATIC', desc: 'Light bulb when A AND B are ON', inv: { and: 1, wireS: 1, wireC: 2 } },
  { id: '2-2', chapter: 'OR Logic', name: 'OR Gate', grid: [8,6], inputs: [{x:1,y:2,val:1,name:'A'},{x:1,y:4,val:1,name:'B'}], output: {x:6,y:3}, goal: 'STATIC', desc: 'Light bulb when A OR B is ON', inv: { or: 1, wireS: 1, wireC: 2 } },
  { id: '2-3', chapter: 'NOT Logic', name: 'Inverter', grid: [8,6], inputs: [{x:1,y:3,val:1,name:'A'}], output: {x:6,y:3}, goal: 'STATIC', desc: 'NOT gate demonstration', inv: { not: 1, wireS: 1, wireC: 1 } },
  { id: '2-4', chapter: 'Combined', name: 'Mix Gates', grid: [8,6], inputs: [{x:1,y:1,val:1,name:'A'},{x:1,y:5,val:1,name:'B'}], output: {x:6,y:3}, goal: 'ALL_INPUTS', desc: 'Work for all input states', inv: { and: 1, or: 1, wireS: 2, wireC: 3 } },
  { id: '3-1', chapter: 'XOR Logic', name: 'XOR Gate', grid: [8,6], inputs: [{x:1,y:2,val:1,name:'A'},{x:1,y:4,val:1,name:'B'}], output: {x:6,y:3}, goal: 'ALL_INPUTS', desc: 'Bulb on when inputs differ', inv: { xor: 1, wireS: 1, wireC: 2 } },
  { id: '3-2', chapter: 'NAND Logic', name: 'NAND Gate', grid: [8,6], inputs: [{x:1,y:2,val:1,name:'A'},{x:1,y:4,val:1,name:'B'}], output: {x:6,y:3}, goal: 'STATIC', desc: 'NAND gate test', inv: { nand: 1, wireS: 1, wireC: 2 } }
];

// ============ COMPONENT TYPES ============
// Each component has ports at relative positions [dx,dy] in N/E/S/W order
const COMP_DEF = {
  wireS: { name: 'Wire', icon: 'wireS', ports: [[0,-1],[0,1]], rotPorts: 2, w:50, h:50, type: 'wire' },
  wireC: { name: 'Corner', icon: 'wireC', ports: [[0,-1],[1,0]], rotPorts: 2, w:50, h:50, type: 'wire' },
  and: { name: 'AND', icon: 'and', ports: [[0,-1],[-1,0],[0,1]], rotPorts: 2, w:50, h:50, type: 'gate' },
  or: { name: 'OR', icon: 'or', ports: [[0,-1],[-1,0],[0,1]], rotPorts: 2, w:50, h:50, type: 'gate' },
  not: { name: 'NOT', icon: 'not', ports: [[0,-1],[0,1]], rotPorts: 2, w:50, h:50, type: 'gate' },
  xor: { name: 'XOR', icon: 'xor', ports: [[0,-1],[-1,0],[0,1]], rotPorts: 2, w:50, h:50, type: 'gate' },
  nand: { name: 'NAND', icon: 'nand', ports: [[0,-1],[-1,0],[0,1]], rotPorts: 2, w:50, h:50, type: 'gate' }
};

// ============ STATE ============
const state = {
  currentLevel: 0,
  board: [], // 2D array [y][x] of component instances or null
  inventory: {},
  inputs: { A: 1, B: 0 },
  drag: null,
  rotate: 0,
  signals: {}, // 'x,y' -> 0 or 1
  errors: [],
  winModal: false,
  simulationDone: false,
  bulbOn: false,
  animTime: 0,
  pulsePos: {}, // for animation
  timerStart: 0,
  timerElapsed: 0,
  timerRunning: false,
  bestTimes: {},
  bestStars: {},
  confetti: []
};

// ============ CANVAS ============
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
let CELL = 60;
let boardPxW = 0, boardPxH = 0, offX = 0, offY = 0;

function resizeCanvas() {
  const wrap = canvas.parentElement;
  const lvl = LEVELS[state.currentLevel];
  const aspect = lvl.grid[0] / lvl.grid[1];
  let w = wrap.clientWidth - 16;
  let h = wrap.clientHeight - 16;
  if (w / h > aspect) { w = h * aspect; } else { h = w / aspect; }
  w = Math.max(200, Math.floor(w));
  h = Math.max(150, Math.floor(h));
  // Find best cell size that divides evenly
  CELL = Math.floor(Math.min(w / lvl.grid[0], h / lvl.grid[1]));
  boardPxW = CELL * lvl.grid[0];
  boardPxH = CELL * lvl.grid[1];
  canvas.width = boardPxW;
  canvas.height = boardPxH;
}

// ============ HELPERS ============
function rotatePorts(ports, rot) {
  // rot: 0=0deg, 1=90deg CW, 2=180, 3=270
  const result = [];
  for (const p of ports) {
    let x = p[0], y = p[1];
    for (let i = 0; i < rot; i++) {
      const nx = -y; const ny = x;
      x = nx; y = ny;
    }
    result.push([x, y]);
  }
  return result;
}

function getPorts(comp) {
  const def = COMP_DEF[comp.type];
  return rotatePorts(def.ports, comp.rot);
}

function neighborKey(x, y, dx, dy) {
  return (x+dx) + ',' + (y+dy);
}

function keyXY(x, y) { return x + ',' + y; }

// ============ LEVEL LOAD ============
function loadLevel(idx) {
  state.currentLevel = idx;
  const lvl = LEVELS[idx];
  state.board = [];
  for (let y = 0; y < lvl.grid[1]; y++) {
    state.board.push(new Array(lvl.grid[0]).fill(null));
  }
  state.inventory = {};
  for (const k in lvl.inv) state.inventory[k] = lvl.inv[k];
  state.inputs.A = lvl.inputs[0] ? lvl.inputs[0].val : 1;
  state.inputs.B = lvl.inputs[1] ? lvl.inputs[1].val : 0;
  state.drag = null;
  state.rotate = 0;
  state.signals = {};
  state.errors = [];
  state.simulationDone = false;
  state.bulbOn = false;
  state.pulsePos = {};
  state.confetti = [];
  document.getElementById('lvlLabel').textContent = 'Level ' + lvl.id + ': ' + lvl.name;
  document.getElementById('goalLabel').textContent = 'Goal: ' + lvl.desc;
  document.getElementById('btnA').textContent = 'A: ' + (state.inputs.A ? 'ON' : 'OFF');
  document.getElementById('btnA').classList.toggle('on', state.inputs.A === 1);
  document.getElementById('btnB').textContent = 'B: ' + (state.inputs.B ? 'ON' : 'OFF');
  document.getElementById('btnB').classList.toggle('on', state.inputs.B === 1);
  document.getElementById('btnB').style.display = lvl.inputs[1] ? 'block' : 'none';
  setStatus('Place components and press Test.', 'ok');
  resizeCanvas();
  renderInventory();
  startTimer();
}

function startTimer() {
  state.timerStart = performance.now();
  state.timerElapsed = 0;
  state.timerRunning = true;
}
function stopTimer() {
  state.timerRunning = false;
  state.timerElapsed = performance.now() - state.timerStart;
}
function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss + '.' + tenths;
}

// ============ INVENTORY UI ============
function renderInventory() {
  const cont = document.getElementById('inventory');
  cont.innerHTML = '';
  for (const key in state.inventory) {
    const def = COMP_DEF[key];
    if (!def) continue;
    const cnt = state.inventory[key];
    const div = document.createElement('div');
    div.className = 'inv-item' + (cnt <= 0 ? ' zero' : '');
    div.dataset.type = key;
    const icon = document.createElement('canvas');
    icon.className = 'icon';
    icon.width = 32; icon.height = 32;
    drawCompIcon(icon, key);
    const lbl = document.createElement('div');
    lbl.className = 'lbl';
    lbl.textContent = def.name;
    const c = document.createElement('div');
    c.className = 'cnt';
    c.textContent = cnt;
    div.appendChild(icon);
    div.appendChild(lbl);
    div.appendChild(c);
    if (cnt > 0) {
      div.addEventListener('mousedown', e => startDragFromInv(key, e));
      div.addEventListener('touchstart', e => startDragFromInv(key, e), {passive:false});
    }
    cont.appendChild(div);
  }
}

function drawCompIcon(c, type) {
  const cctx = c.getContext('2d');
  cctx.clearRect(0,0,32,32);
  cctx.save();
  cctx.translate(16, 16);
  cctx.fillStyle = COLORS.inactive;
  cctx.strokeStyle = COLORS.outline;
  cctx.lineWidth = 1.5;
  if (type === 'wireS') {
    cctx.beginPath();
    cctx.moveTo(0, -14); cctx.lineTo(0, 14);
    cctx.strokeStyle = '#03A9F4'; cctx.lineWidth = 3;
    cctx.stroke();
  } else if (type === 'wireC') {
    cctx.beginPath();
    cctx.moveTo(0, -14); cctx.lineTo(0, 0); cctx.lineTo(14, 0);
    cctx.strokeStyle = '#03A9F4'; cctx.lineWidth = 3;
    cctx.stroke();
  } else if (type === 'and') {
    cctx.beginPath();
    cctx.moveTo(-10, -10); cctx.lineTo(-10, 10);
    cctx.lineTo(0, 14); cctx.arc(0, 0, 14, -Math.PI/2, Math.PI/2);
    cctx.lineTo(-10, -10);
    cctx.fill(); cctx.stroke();
    cctx.fillStyle = '#03A9F4';
    cctx.font = 'bold 10px sans-serif';
    cctx.fillText('&', -4, 4);
  } else if (type === 'or') {
    cctx.beginPath();
    cctx.moveTo(-10, -10);
    cctx.quadraticCurveTo(-2, 0, -10, 10);
    cctx.quadraticCurveTo(2, 8, 14, 0);
    cctx.quadraticCurveTo(2, -8, -10, -10);
    cctx.fill(); cctx.stroke();
    cctx.fillStyle = '#03A9F4';
    cctx.font = 'bold 10px sans-serif';
    cctx.fillText('≥1', -3, 4);
  } else if (type === 'not') {
    cctx.beginPath();
    cctx.moveTo(-10, -10); cctx.lineTo(-10, 10);
    cctx.lineTo(10, 0); cctx.closePath();
    cctx.fill(); cctx.stroke();
    cctx.beginPath(); cctx.arc(13, 0, 3, 0, Math.PI*2); cctx.fill();
    cctx.fillStyle = '#03A9F4';
    cctx.font = 'bold 8px sans-serif';
    cctx.fillText('!', -3, 3);
  } else if (type === 'xor') {
    cctx.beginPath();
    cctx.moveTo(-12, -10); cctx.quadraticCurveTo(-2, 0, -12, 10);
    cctx.lineTo(10, 10);
    cctx.quadraticCurveTo(0, 0, 10, -10);
    cctx.closePath();
    cctx.fill(); cctx.stroke();
    cctx.beginPath();
    cctx.moveTo(-14, -10); cctx.quadraticCurveTo(-4, 0, -14, 10);
    cctx.stroke();
    cctx.fillStyle = '#03A9F4';
    cctx.font = 'bold 8px sans-serif';
    cctx.fillText('⊕', -2, 3);
  } else if (type === 'nand') {
    cctx.beginPath();
    cctx.moveTo(-10, -10); cctx.lineTo(-10, 10);
    cctx.lineTo(0, 14); cctx.arc(0, 0, 14, -Math.PI/2, Math.PI/2);
    cctx.lineTo(-10, -10);
    cctx.fill(); cctx.stroke();
    cctx.beginPath(); cctx.arc(14, 0, 3, 0, Math.PI*2); cctx.fill();
    cctx.fillStyle = '#03A9F4';
    cctx.font = 'bold 7px sans-serif';
    cctx.fillText('!&', -4, 3);
  }
  cctx.restore();
}

// ============ DRAG & DROP ============
function startDragFromInv(type, e) {
  e.preventDefault();
  Audio.init();
  Audio.click();
  if (state.inventory[type] <= 0) return;
  const def = COMP_DEF[type];
  state.drag = { type: type, fromInv: true, x: 0, y: 0, rot: 0, originType: type, originX: -1, originY: -1 };
  updateDragPos(e);
}

function startDragFromBoard(x, y, e) {
  e.preventDefault();
  Audio.init();
  Audio.click();
  const comp = state.board[y][x];
  if (!comp) return;
  state.drag = { type: comp.type, fromInv: false, x: 0, y: 0, rot: comp.rot, originType: comp.type, originX: x, originY: y };
  state.board[y][x] = null;
  updateDragPos(e);
}

function updateDragPos(e) {
  if (!state.drag) return;
  let cx, cy;
  if (e.touches) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
  else { cx = e.clientX; cy = e.clientY; }
  const r = canvas.getBoundingClientRect();
  state.drag.x = cx - r.left;
  state.drag.y = cy - r.top;
}

function endDrag(e) {
  if (!state.drag) return;
  const d = state.drag;
  // Find snap cell
  const lvl = LEVELS[state.currentLevel];
  let gx = -1, gy = -1;
  const localX = d.x, localY = d.y;
  const cx = localX / CELL - 0.5;
  const cy = localY / CELL - 0.5;
  const nearX = Math.round(cx);
  const nearY = Math.round(cy);
  // Check if cursor is within board
  if (localX >= 0 && localX < boardPxW && localY >= 0 && localY < boardPxH) {
    // Check if snap cell is reserved (input/output)
    const reserved = isReservedCell(nearX, nearY);
    const occupied = state.board[nearY] && state.board[nearX] !== undefined && state.board[nearY][nearX] !== null && !(d.originX === nearX && d.originY === nearY);
    if (nearX >= 0 && nearX < lvl.grid[0] && nearY >= 0 && nearY < lvl.grid[1] && !reserved && !occupied) {
      gx = nearX; gy = nearY;
    }
  }
  // Place or return to inventory
  if (gx >= 0 && gy >= 0) {
    placeComponent(d.type, gx, gy, d.rot);
    if (d.fromInv) {
      state.inventory[d.type]--;
    }
    Audio.place();
    runSimulation();
  } else if (d.originX >= 0 && d.originY >= 0) {
    // Return to original position
    state.board[d.originY][d.originX] = { type: d.type, rot: d.rot };
  } else if (d.fromInv) {
    // Dropped outside, return to inventory
    state.inventory[d.type]++;
    renderInventory();
  }
  state.drag = null;
  renderInventory();
}

function placeComponent(type, x, y, rot) {
  state.board[y][x] = { type: type, rot: rot || 0 };
}

function isReservedCell(x, y) {
  const lvl = LEVELS[state.currentLevel];
  for (const inp of lvl.inputs) if (inp.x === x && inp.y === y) return true;
  if (lvl.output.x === x && lvl.output.y === y) return true;
  return false;
}

// ============ INPUTS ============
function toggleInput(name) {
  Audio.init();
  Audio.click();
  const lvl = LEVELS[state.currentLevel];
  if (!lvl.inputs.find(i => i.name === name)) return;
  if (lvl.goal === 'STATIC') {
    state.inputs[name] = state.inputs[name] ? 0 : 1;
    const btn = document.getElementById('btn' + name);
    btn.textContent = name + ': ' + (state.inputs[name] ? 'ON' : 'OFF');
    btn.classList.toggle('on', state.inputs[name] === 1);
  } else {
    // Cycle through all input combinations
    if (lvl.inputs.length === 2) {
      const vals = [[0,0],[1,0],[0,1],[1,1]];
      let cur = vals.findIndex(v => v[0] === state.inputs.A && v[1] === state.inputs.B);
      cur = (cur + 1) % vals.length;
      state.inputs.A = vals[cur][0];
      state.inputs.B = vals[cur][1];
      document.getElementById('btnA').textContent = 'A: ' + (state.inputs.A ? 'ON' : 'OFF');
      document.getElementById('btnA').classList.toggle('on', state.inputs.A === 1);
      document.getElementById('btnB').textContent = 'B: ' + (state.inputs.B ? 'ON' : 'OFF');
      document.getElementById('btnB').classList.toggle('on', state.inputs.B === 1);
    } else {
      state.inputs[name] = state.inputs[name] ? 0 : 1;
      const btn = document.getElementById('btn' + name);
      btn.textContent = name + ': ' + (state.inputs[name] ? 'ON' : 'OFF');
      btn.classList.toggle('on', state.inputs[name] === 1);
    }
  }
  runSimulation();
}

// ============ SIMULATION ============
function runSimulation() {
  const lvl = LEVELS[state.currentLevel];
  state.signals = {};
  state.errors = [];
  state.pulsePos = {};
  // Initialize all cells to 0
  for (let y = 0; y < lvl.grid[1]; y++) {
    for (let x = 0; x < lvl.grid[0]; x++) {
      state.signals[keyXY(x,y)] = 0;
    }
  }
  // Set input sources
  for (const inp of lvl.inputs) {
    state.signals[keyXY(inp.x, inp.y)] = inp.val === undefined ? (state.inputs[inp.name] || 0) : inp.val;
  }
  // Iterative propagation
  let changed = true;
  let iterations = 0;
  const maxIter = lvl.grid[0] * lvl.grid[1] * 4;
  while (changed && iterations < maxIter) {
    changed = false;
    iterations++;
    for (let y = 0; y < lvl.grid[1]; y++) {
      for (let x = 0; x < lvl.grid[0]; x++) {
        const comp = state.board[y][x];
        if (!comp) continue;
        const ports = getPorts(comp);
        const k = keyXY(x,y);
        // Gather inputs to this component based on port directions
        // Each port is at relative position; the connected neighbor is opposite
        let portVals = [];
        for (let pi = 0; pi < ports.length; pi++) {
          const [dx, dy] = ports[pi];
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= lvl.grid[0] || ny >= lvl.grid[1]) {
            portVals.push(0);
            continue;
          }
          portVals.push(state.signals[keyXY(nx, ny)] || 0);
        }
        // Compute output based on type
        let out = 0;
        const t = comp.type;
        if (t === 'wireS' || t === 'wireC') {
          // Pass through any connected signal (any port that's high -> high)
          out = portVals.some(v => v === 1) ? 1 : 0;
        } else if (t === 'and') {
          out = (portVals.length >= 2 && portVals[0] === 1 && portVals[1] === 1) ? 1 : 0;
        } else if (t === 'or') {
          out = (portVals[0] === 1 || portVals[1] === 1) ? 1 : 0;
        } else if (t === 'not') {
          out = portVals[0] === 1 ? 0 : 1;
        } else if (t === 'xor') {
          out = (portVals[0] !== portVals[1]) ? 1 : 0;
        } else if (t === 'nand') {
          out = (portVals[0] === 1 && portVals[1] === 1) ? 0 : 1;
        }
        if (state.signals[k] !== out) {
          state.signals[k] = out;
          changed = true;
          if (out === 1) state.pulsePos[k] = state.animTime;
        }
      }
    }
  }
  // Check for loops/errors (oscillation)
  if (iterations >= maxIter) {
    state.errors.push({x: -1, y: -1, msg: 'Circuit oscillates - check for loops'});
  }
  // Check output
  const outVal = state.signals[keyXY(lvl.output.x, lvl.output.y)] || 0;
  state.bulbOn = outVal === 1;
  state.simulationDone = true;
  if (state.bulbOn) {
    Audio.bulb();
  }
  updateStatus();
  checkWin();
}

function updateStatus() {
  const lvl = LEVELS[state.currentLevel];
  if (state.errors.length > 0) {
    setStatus(state.errors.map(e => e.msg).join('; '), 'err');
  } else if (state.bulbOn) {
    setStatus('Bulb is LIT! ✓ Circuit works for current inputs.', 'ok');
  } else {
    setStatus('Bulb is OFF. Adjust your circuit.', 'err');
  }
}

function setStatus(msg, cls) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status ' + (cls || '');
}

function checkWin() {
  const lvl = LEVELS[state.currentLevel];
  if (lvl.goal === 'STATIC') {
    if (state.bulbOn) {
      // Check that all inputs match their required values
      let ok = true;
      for (const inp of lvl.inputs) {
        const v = state.inputs[inp.name];
        if (v !== (inp.val || 0)) { ok = false; break; }
      }
      // Actually for static goal, the inputs are fixed - just bulb on is enough
      if (ok) {
        triggerWin();
      }
    }
  } else if (lvl.goal === 'ALL_INPUTS') {
    // Need to verify for all input combinations
    const combos = lvl.inputs.length === 2 ? [[0,0],[1,0],[0,1],[1,1]] : [[0],[1]];
    const results = combos.map(combo => {
      const savedA = state.inputs.A, savedB = state.inputs.B;
      state.inputs.A = combo[0];
      state.inputs.B = combo[1] !== undefined ? combo[1] : 0;
      // Temporarily set source values
      for (const inp of lvl.inputs) {
        if (inp.name === 'A') inp.val = combo[0];
        if (inp.name === 'B') inp.val = combo[1] !== undefined ? combo[1] : 0;
      }
      const prev = state.signals;
      // Simulate without recursion by setting sources
      state.signals = {};
      for (let y = 0; y < lvl.grid[1]; y++) for (let x = 0; x < lvl.grid[0]; x++) state.signals[keyXY(x,y)] = 0;
      for (const inp of lvl.inputs) state.signals[keyXY(inp.x, inp.y)] = inp.val;
      let ch = true, it = 0;
      while (ch && it < 200) {
        ch = false; it++;
        for (let y = 0; y < lvl.grid[1]; y++) {
          for (let x = 0; x < lvl.grid[0]; x++) {
            const comp = state.board[y][x];
            if (!comp) continue;
            const ports = getPorts(comp);
            let pvs = [];
            for (const [dx,dy] of ports) {
              const nx = x+dx, ny = y+dy;
              pvs.push((nx>=0&&ny>=0&&nx<lvl.grid[0]&&ny<lvl.grid[1]) ? (state.signals[keyXY(nx,ny)]||0) : 0);
            }
            let o = 0;
            const t = comp.type;
            if (t==='wireS'||t==='wireC') o = pvs.some(v=>v===1)?1:0;
            else if (t==='and') o = (pvs[0]===1&&pvs[1]===1)?1:0;
            else if (t==='or') o = (pvs[0]===1||pvs[1]===1)?1:0;
            else if (t==='not') o = pvs[0]===1?0:1;
            else if (t==='xor') o = (pvs[0]!==pvs[1])?1:0;
            else if (t==='nand') o = (pvs[0]===1&&pvs[1]===1)?0:1;
            if (state.signals[keyXY(x,y)] !== o) { state.signals[keyXY(x,y)] = o; ch = true; }
          }
        }
      }
      const result = state.signals[keyXY(lvl.output.x, lvl.output.y)] === 1;
      // Restore
      state.inputs.A = savedA; state.inputs.B = savedB;
      for (const inp of lvl.inputs) inp.val = state.inputs[inp.name];
      state.signals = prev;
      return result;
    });
    if (results.every(r => r)) {
      triggerWin();
    } else {
      // Show progress
      const done = results.filter(r => r).length;
      setStatus(`Tested ${results.length} combos: ${done}/${results.length} work`, results.length === done ? 'ok' : 'err');
    }
  }
}

function triggerWin() {
  if (state.winModal) return;
  state.winModal = true;
  stopTimer();
  const lvl = LEVELS[state.currentLevel];
  const t = state.timerElapsed;
  const prevBest = state.bestTimes[lvl.id];
  let stars = 1;
  if (!prevBest || t < prevBest) {
    state.bestTimes[lvl.id] = t;
    stars = 3;
  } else if (t < prevBest * 1.5) {
    stars = 2;
  }
  state.bestStars[lvl.id] = Math.max(state.bestStars[lvl.id] || 0, stars);
  saveProgress();
  showWinModal(stars, t);
  Audio.win();
  spawnConfetti();
}

function showWinModal(stars, time) {
  const modal = document.getElementById('winModal');
  const starEls = document.querySelectorAll('#stars .star');
  starEls.forEach((el, i) => {
    el.classList.toggle('lit', i < stars);
  });
  document.getElementById('winInfo').textContent = 'Time: ' + formatTime(time) + ' | Best: ' + formatTime(state.bestTimes[LEVELS[state.currentLevel].id] || 0);
  document.getElementById('nextBtn').style.display = (state.currentLevel < LEVELS.length - 1) ? 'inline-block' : 'none';
  modal.classList.add('show');
}

function spawnConfetti() {
  for (let i = 0; i < 60; i++) {
    state.confetti.push({
      x: Math.random() * boardPxW,
      y: -20,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 2 + 2,
      color: ['#FFC107','#03A9F4','#4CAF50','#E53935','#FFEB3B'][Math.floor(Math.random()*5)],
      size: Math.random() * 6 + 4,
      life: 1
    });
  }
}

// ============ SAVE/LOAD ============
function saveProgress() {
  try {
    localStorage.setItem('circuitBest', JSON.stringify(state.bestTimes));
    localStorage.setItem('circuitStars', JSON.stringify(state.bestStars));
  } catch(e) {}
}
function loadProgress() {
  try {
    const t = JSON.parse(localStorage.getItem('circuitBest') || '{}');
    const s = JSON.parse(localStorage.getItem('circuitStars') || '{}');
    state.bestTimes = t;
    state.bestStars = s;
  } catch(e) {}
}

// ============ RENDERING ============
function draw() {
  state.animTime = performance.now() / 1000;
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, boardPxW, boardPxH);
  // Grid
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= LEVELS[state.currentLevel].grid[0]; x++) {
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, boardPxH);
    ctx.stroke();
  }
  for (let y = 0; y <= LEVELS[state.currentLevel].grid[1]; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(boardPxW, y * CELL);
    ctx.stroke();
  }
  // Components
  const lvl = LEVELS[state.currentLevel];
  for (let y = 0; y < lvl.grid[1]; y++) {
    for (let x = 0; x < lvl.grid[0]; x++) {
      drawCell(x, y);
    }
  }
  // Inputs
  for (const inp of lvl.inputs) {
    drawInput(inp.x, inp.y, inp.name);
  }
  // Output bulb
  drawBulb(lvl.output.x, lvl.output.y);
  // Drag ghost
  if (state.drag) {
    drawCompGhost(state.drag.x, state.drag.y, state.drag.type, state.drag.rot);
  }
  // Timer
  if (state.timerRunning) {
    state.timerElapsed = performance.now() - state.timerStart;
  }
  document.getElementById('timer').textContent = formatTime(state.timerElapsed);
  // Confetti
  drawConfetti();
  requestAnimationFrame(draw);
}

function drawCell(x, y) {
  const comp = state.board[y][x];
  if (!comp) return;
  const cx = x * CELL + CELL/2;
  const cy = y * CELL + CELL/2;
  const size = CELL * 0.85;
  const sig = state.signals[keyXY(x,y)] || 0;
  const active = sig === 1;
  ctx.save();
  ctx.translate(cx, cy);
  // Pulse glow if recently activated
  if (state.pulsePos[keyXY(x,y)]) {
    const dt = state.animTime - state.pulsePos[keyXY(x,y)];
    if (dt < 0.5 && active) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = COLORS.glow;
    }
  }
  if (comp.type === 'wireS' || comp.type === 'wireC') {
    drawWire(comp.type, comp.rot, active, size);
  } else {
    drawGate(comp.type, comp.rot, active, size);
  }
  ctx.restore();
}

function drawWire(type, rot, active, size) {
  ctx.strokeStyle = active ? COLORS.active : COLORS.inactive;
  ctx.lineWidth = active ? 5 : 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (type === 'wireS') {
    // vertical by default
    ctx.moveTo(0, -size/2);
    ctx.lineTo(0, size/2);
  } else {
    // corner: from N to E by default
    ctx.moveTo(0, -size/2);
    ctx.lineTo(0, 0);
    ctx.lineTo(size/2, 0);
  }
  ctx.stroke();
  // Port dots
  ctx.fillStyle = active ? COLORS.glow : COLORS.outline;
  const ports = rotatePorts(COMP_DEF[type].ports, rot);
  for (const [dx, dy] of ports) {
    ctx.beginPath();
    ctx.arc(dx * size/2, dy * size/2, 4, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawGate(type, rot, active, size) {
  ctx.save();
  ctx.rotate(rot * Math.PI/2);
  ctx.fillStyle = active ? 'rgba(255,193,7,0.25)' : 'rgba(255,255,255,0.05)';
  ctx.strokeStyle = active ? COLORS.active : COLORS.outline;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (type === 'and' || type === 'nand') {
    const half = size/2;
    ctx.moveTo(-half, -half);
    ctx.lineTo(-half*0.3, -half);
    ctx.arc(0, 0, half, -Math.PI/2, Math.PI/2);
    ctx.lineTo(-half, half);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    if (type === 'nand') {
      ctx.beginPath();
      ctx.arc(half*0.5, 0, 5, 0, Math.PI*2);
      ctx.fillStyle = active ? COLORS.active : COLORS.outline;
      ctx.fill();
      ctx.strokeStyle = active ? COLORS.active : COLORS.outline;
      ctx.stroke();
    }
  } else if (type === 'or' || type === 'xor') {
    const half = size/2;
    ctx.moveTo(-half, -half);
    ctx.quadraticCurveTo(-half*0.3, 0, -half, half);
    ctx.quadraticCurveTo(half*0.3, half*0.7, half, 0);
    ctx.quadraticCurveTo(half*0.3, -half*0.7, -half, -half);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    if (type === 'xor') {
      ctx.beginPath();
      ctx.moveTo(-half*1.15, -half);
      ctx.quadraticCurveTo(-half*0.45, 0, -half*1.15, half);
      ctx.stroke();
    }
  } else if (type === 'not') {
    const half = size/2;
    ctx.moveTo(-half, -half);
    ctx.lineTo(-half, half);
    ctx.lineTo(half*0.6, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.arc(half*0.75, 0, 5, 0, Math.PI*2);
    ctx.fillStyle = active ? COLORS.active : COLORS.outline;
    ctx.fill();
  }
  // Label
  ctx.fillStyle = active ? '#fff' : COLORS.accent;
  ctx.font = 'bold ' + Math.floor(size*0.25) + 'px Rajdhani';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labels = { and:'AND', or:'OR', not:'NOT', xor:'XOR', nand:'NAND' };
  ctx.fillText(labels[type], 0, 0);
  ctx.restore();
}

function drawInput(x, y, name) {
  const cx = x * CELL + CELL/2;
  const cy = y * CELL + CELL/2;
  const size = CELL * 0.7;
  const val = state.inputs[name] || 0;
  const color = name === 'A' ? COLORS.inputA : COLORS.inputB;
  ctx.save();
  ctx.translate(cx, cy);
  // Glow if active
  if (val) {
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
  }
  ctx.fillStyle = val ? color : 'rgba(255,255,255,0.1)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, size/2, 0, Math.PI*2);
  ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  // Letter
  ctx.fillStyle = '#fff';
  ctx.font = 'bold ' + Math.floor(size*0.5) + 'px Rajdhani';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 0, 2);
  ctx.restore();
}

function drawBulb(x, y) {
  const cx = x * CELL + CELL/2;
  const cy = y * CELL + CELL/2;
  const size = CELL * 0.75;
  ctx.save();
  ctx.translate(cx, cy);
  if (state.bulbOn) {
    ctx.shadowBlur = 30;
    ctx.shadowColor = COLORS.glow;
  }
  ctx.fillStyle = state.bulbOn ? COLORS.bulbOn : COLORS.bulbOff;
  ctx.beginPath();
  ctx.arc(0, 0, size/2, 0, Math.PI*2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Base
  ctx.fillStyle = '#616161';
  ctx.fillRect(-size*0.2, size*0.4, size*0.4, size*0.15);
  ctx.fillRect(-size*0.15, size*0.55, size*0.3, size*0.1);
  // Highlight
  if (state.bulbOn) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(-size*0.15, -size*0.15, size*0.15, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCompGhost(x, y, type, rot) {
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.translate(x, y);
  if (type === 'wireS' || type === 'wireC') {
    drawWire(type, rot, true, CELL * 0.85);
  } else {
    drawGate(type, rot, true, CELL * 0.85);
  }
  ctx.restore();
}

function drawConfetti() {
  for (const c of state.confetti) {
    c.x += c.vx;
    c.y += c.vy;
    c.vy += 0.1;
    c.life -= 0.005;
    ctx.fillStyle = c.color;
    ctx.globalAlpha = Math.max(0, c.life);
    ctx.fillRect(c.x, c.y, c.size, c.size);
  }
  ctx.globalAlpha = 1;
  state.confetti = state.confetti.filter(c => c.life > 0 && c.y < boardPxH + 50);
}

// ============ EVENTS ============
canvas.addEventListener('mousedown', e => {
  const r = canvas.getBoundingClientRect();
  const lx = e.clientX - r.left;
  const ly = e.clientY - r.top;
  const gx = Math.floor(lx / CELL);
  const gy = Math.floor(ly / CELL);
  const lvl = LEVELS[state.currentLevel];
  if (gx >= 0 && gy >= 0 && gx < lvl.grid[0] && gy < lvl.grid[1]) {
    if (state.board[gy][gx]) {
      startDragFromBoard(gx, gy, e);
    } else if (!isReservedCell(gx, gy)) {
      // Right click to rotate placeholder? No - allow placement by drag from inv only
    }
  }
});

canvas.addEventListener('mousemove', updateDragPos);
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('mouseleave', endDrag);

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.touches[0];
  const r = canvas.getBoundingClientRect();
  const lx = t.clientX - r.left;
  const ly = t.clientY - r.top;
  const gx = Math.floor(lx / CELL);
  const gy = Math.floor(ly / CELL);
  const lvl = LEVELS[state.currentLevel];
  if (gx >= 0 && gy >= 0 && gx < lvl.grid[0] && gy < lvl.grid[1]) {
    if (state.board[gy][gx]) {
      startDragFromBoard(gx, gy, e);
    }
  }
}, {passive:false});

canvas.addEventListener('touchmove', e => { e.preventDefault(); updateDragPos(e); }, {passive:false});
canvas.addEventListener('touchend', e => { e.preventDefault(); endDrag(e); });

// Right click to rotate
canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  const lx = e.clientX - r.left;
  const ly = e.clientY - r.top;
  const gx = Math.floor(lx / CELL);
  const gy = Math.floor(ly / CELL);
  const lvl = LEVELS[state.currentLevel];
  if (gx >= 0 && gy >= 0 && gx < lvl.grid[0] && gy < lvl.grid[1]) {
    if (state.board[gy][gx]) {
      state.board[gy][gx].rot = (state.board[gy][gx].rot + 1) % 4;
      Audio.click();
      runSimulation();
    }
  }
});

// R key to rotate during drag
window.addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') {
    if (state.drag) {
      state.drag.rot = (state.drag.rot + 1) % 4;
      Audio.click();
    }
  }
});

document.getElementById('btnA').addEventListener('click', () => toggleInput('A'));
document.getElementById('btnB').addEventListener('click', () => toggleInput('B'));
document.getElementById('testBtn').addEventListener('click', () => { Audio.init(); Audio.zap(); runSimulation(); });
document.getElementById('clearBtn').addEventListener('click', () => { Audio.init(); Audio.bonk(); loadLevel(state.currentLevel); });
document.getElementById('resetLevelBtn').addEventListener('click', () => { Audio.init(); Audio.bonk(); loadLevel(state.currentLevel); });
document.getElementById('menuBtn').addEventListener('click', openMenu);
document.getElementById('nextBtn').addEventListener('click', () => {
  Audio.init(); Audio.click();
  state.winModal = false;
  document.getElementById('winModal').classList.remove('show');
  if (state.currentLevel < LEVELS.length - 1) {
    loadLevel(state.currentLevel + 1);
  }
});
document.getElementById('closeWin').addEventListener('click', () => {
  state.winModal = false;
  document.getElementById('winModal').classList.remove('show');
});
document.getElementById('closeMenu').addEventListener('click', () => {
  document.getElementById('menuModal').classList.remove('show');
});

function openMenu() {
  Audio.init(); Audio.click();
  const list = document.getElementById('levelList');
  list.innerHTML = '';
  let curChapter = '';
  LEVELS.forEach((lvl, i) => {
    if (lvl.chapter !== curChapter) {
      const h = document.createElement('h3');
      h.style.color = '#03A9F4';
      h.style.fontSize = '14px';
      h.style.marginTop = '10px';
      h.textContent = lvl.chapter;
      list.appendChild(h);
      curChapter = lvl.chapter;
    }
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.style.display = 'block';
    btn.style.width = '100%';
    btn.style.margin = '4px 0';
    const stars = state.bestStars[lvl.id] || 0;
    btn.textContent = lvl.id + ': ' + lvl.name + (stars ? ' ★'.repeat(stars) : '');
    btn.onclick = () => {
      Audio.click();
      document.getElementById('menuModal').classList.remove('show');
      loadLevel(i);
    };
    list.appendChild(btn);
  });
  document.getElementById('menuModal').classList.add('show');
}

// ============ INIT ============
window.addEventListener('resize', resizeCanvas);
loadProgress();
loadLevel(0);
draw();

})();
