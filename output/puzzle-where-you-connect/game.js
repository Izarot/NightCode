/* Connect-Dots Quest - Single-file engine
   Features: responsive canvas, drawing, snap, validation, reveal mask, particles,
   localStorage high score, Web Audio API SFX, speedrun timer, level select. */

(() => {
  'use strict';

  // ============================================================
  // CONFIG & PALETTES
  // ============================================================
  const PALETTES = [
    { name: 'Sunset',    bg: '#1a1a2e', dot: '#ffd86b', line: '#ff6ec7', accent: '#00d4ff' },
    { name: 'Ocean',     bg: '#0a1933', dot: '#00d4ff', line: '#7b2ff7', accent: '#ffd86b' },
    { name: 'Forest',    bg: '#0d2818', dot: '#a8e6cf', line: '#56ab2f', accent: '#ffd86b' },
    { name: 'Candy',     bg: '#2d1b4e', dot: '#ff6ec7', line: '#ffd86b', accent: '#00d4ff' },
    { name: 'Lava',      bg: '#2c0a0a', dot: '#ff9a3c', line: '#e74c3c', accent: '#ffd86b' }
  ];

  const SNAP_RADIUS = 22;
  const BASE_W = 1024, BASE_H = 768;
  const LS_KEY = 'cdq_save_v1';

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    screen: 'main',
    level: 0,
    levels: [],
    progress: {},   // { levelIdx: { stars, timeMs } }
    highScore: 0,
    palette: PALETTES[0],
    settings: { numbers: true, snap: true, lineWidth: 4, volMaster: 0.7, volMusic: 0.5, volSfx: 0.8 },
    // gameplay
    nodes: [],
    connections: [],  // {from,to,color}
    expectedEdges: [], // ordered list of [fromIdx, toIdx]
    completedEdgeSet: new Set(),
    currentStroke: null,
    strokeCount: 0,
    revealProgress: 0,  // 0..1 for image reveal animation
    targetImage: null,  // HTMLImageElement (procedural)
    hintTimer: 0,
    paused: false,
    timerMs: 0,
    timerStart: 0,
    particles: [],
    shake: 0
  };

  // ============================================================
  // DOM
  // ============================================================
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: true });
  const menuBg = document.getElementById('menu-bg');
  const menuCtx = menuBg.getContext('2d');
  const hud = document.getElementById('hud');
  const hudBottom = document.getElementById('hud-bottom');
  const toast = document.getElementById('toast');

  // ============================================================
  // RESPONSIVE CANVAS
  // ============================================================
  function resize() {
    const wrap = document.getElementById('canvas-wrap');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = wrap.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(canvas.width / BASE_W, 0, 0, canvas.height / BASE_H, 0, 0);
    // menu bg fills screen
    menuBg.width = window.innerWidth * dpr;
    menuBg.height = window.innerHeight * dpr;
    menuBg.style.width = window.innerWidth + 'px';
    menuBg.style.height = window.innerHeight + 'px';
    menuCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);

  // ============================================================
  // AUDIO (Web Audio API)
  // ============================================================
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }
  function sfx(type) {
    if (!audioCtx) return;
    const v = state.settings.volMaster * state.settings.volSfx;
    if (v <= 0.01) return;
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    g.gain.value = v * 0.15;
    if (type === 'draw') {
      o.type = 'triangle'; o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(180, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o.start(t); o.stop(t + 0.08);
    } else if (type === 'snap') {
      o.type = 'sine'; o.frequency.setValueAtTime(660, t);
      o.frequency.exponentialRampToValueAtTime(880, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      o.start(t); o.stop(t + 0.1);
    } else if (type === 'success') {
      o.type = 'sine'; o.frequency.setValueAtTime(523, t);
      o.frequency.setValueAtTime(659, t + 0.1);
      o.frequency.setValueAtTime(784, t + 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      o.start(t); o.stop(t + 0.4);
    } else if (type === 'error') {
      o.type = 'square'; o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(100, t + 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.2);
    } else if (type === 'complete') {
      [523,659,784,1047].forEach((f,i) => {
        const o2 = audioCtx.createOscillator(); const g2 = audioCtx.createGain();
        o2.connect(g2); g2.connect(audioCtx.destination);
        o2.type='sine'; o2.frequency.value=f;
        g2.gain.setValueAtTime(0, t+i*0.12);
        g2.gain.linearRampToValueAtTime(v*0.15, t+i*0.12+0.02);
        g2.gain.exponentialRampToValueAtTime(0.001, t+i*0.12+0.25);
        o2.start(t+i*0.12); o2.stop(t+i*0.12+0.25);
      });
    }
  }

  // ============================================================
  // SAVE / LOAD (LocalStorage)
  // ============================================================
  function save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        progress: state.progress,
        highScore: state.highScore,
        settings: state.settings
      }));
    } catch(e) {}
  }
  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.progress) state.progress = d.progress;
      if (typeof d.highScore === 'number') state.highScore = d.highScore;
      if (d.settings) state.settings = { ...state.settings, ...d.settings };
    } catch(e) {}
  }

  // ============================================================
  // LEVEL GENERATION (procedural)
  // ============================================================
  function rng(seed) {
    let s = seed | 0 || 1;
    return () => { s = (s * 1664525 + 1013904223) | 0; return ((s >>> 0) / 0xffffffff); };
  }

  const PICTURES = ['🌸','🌳','⭐','🐠','🦋','🏔️','🌈','🚀','🌺','🎈','🍀','🐳','🦄','🎨','🌙','🔥'];

  function generateLevel(idx) {
    const r = rng(idx * 9173 + 1);
    const diff = idx < 3 ? 'easy' : idx < 6 ? 'medium' : 'hard';
    const count = diff === 'easy' ? 8 + Math.floor(r()*5) : diff === 'medium' ? 13 + Math.floor(r()*6) : 21 + Math.floor(r()*8);
    const margin = 80;
    // Generate a "shape" path (polyline that traces a smooth figure) - this becomes the solution
    const cx = BASE_W/2, cy = BASE_H/2;
    const angle0 = r() * Math.PI * 2;
    const radius = 200 + r() * 80;
    const raw = [];
    for (let i = 0; i < count; i++) {
      const a = angle0 + (i / count) * Math.PI * 2 * (1 + (r()-0.5)*0.4);
      const rad = radius * (0.6 + r() * 0.5);
      let x = cx + Math.cos(a) * rad + (r()-0.5) * 120;
      let y = cy + Math.sin(a) * rad * 0.75 + (r()-0.5) * 120;
      x = Math.max(margin, Math.min(BASE_W - margin, x));
      y = Math.max(margin, Math.min(BASE_H - margin, y));
      raw.push({ x, y });
    }
    // optional branching: add 1-2 extra shortcuts on hard
    const nodes = raw.map((p,i) => ({ id: i, x: p.x, y: p.y, label: i+1 }));
    const expected = [];
    for (let i = 0; i < count - 1; i++) expected.push([i, i+1]);
    const branchEdges = [];
    if (diff === 'hard') {
      const extra = 1 + Math.floor(r()*2);
      for (let k = 0; k < extra; k++) {
        const a = Math.floor(r() * count);
        const b = Math.min(count-1, a + 2 + Math.floor(r()*3));
        if (a !== b && !expected.some(e => (e[0]===a && e[1]===b) || (e[0]===b && e[1]===a))) {
          branchEdges.push([a, b]);
        }
      }
    }
    const palette = PALETTES[idx % PALETTES.length];
    const picture = PICTURES[idx % PICTURES.length];
    return {
      id: idx, name: `Level ${idx+1}`, difficulty: diff, timeLimit: diff==='hard'?60:0,
      nodes, expected, branchEdges, palette, picture, timeLimitMs: diff==='hard'?60000:0
    };
  }

  function buildAllLevels() {
    state.levels = [];
    for (let i = 0; i < 15; i++) state.levels.push(generateLevel(i));
  }

  // ============================================================
  // PROCEDURAL TARGET IMAGE
  // ============================================================
  function makeTargetImage(level) {
    // Render picture to an offscreen canvas, return as data url -> image
    const c = document.createElement('canvas');
    c.width = BASE_W; c.height = BASE_H;
    const cx = c.getContext('2d');
    // gradient bg
    const g = cx.createRadialGradient(BASE_W/2, BASE_H/2, 50, BASE_W/2, BASE_H/2, 600);
    g.addColorStop(0, level.palette.line + 'cc');
    g.addColorStop(1, level.palette.dot + '66');
    cx.fillStyle = g;
    cx.fillRect(0, 0, BASE_W, BASE_H);
    // big emoji-ish symbol drawn as path (since we can't render emoji reliably in headless, we draw shapes)
    const pic = level.picture;
    cx.save();
    cx.translate(BASE_W/2, BASE_H/2);
    cx.fillStyle = '#ffffff';
    cx.strokeStyle = level.palette.accent;
    cx.lineWidth = 6;
    cx.shadowColor = 'rgba(0,0,0,.3)';
    cx.shadowBlur = 20;
    drawSymbol(cx, pic, 200);
    cx.restore();
    // overlay pattern
    cx.globalAlpha = 0.15;
    cx.fillStyle = '#fff';
    for (let i = 0; i < 40; i++) {
      cx.beginPath();
      cx.arc((i*97)%BASE_W, (i*131)%BASE_H, 6, 0, Math.PI*2);
      cx.fill();
    }
    cx.globalAlpha = 1;
    const img = new Image();
    img.src = c.toDataURL();
    state.targetImage = img;
  }

  function drawSymbol(cx, ch, size) {
    // simple geometric stand-ins for variety
    const s = size;
    cx.beginPath();
    switch(ch) {
      case '🌸': case '🌺': case '🌼': // flower
        for (let i=0;i<6;i++) { const a=i*Math.PI/3; cx.ellipse(Math.cos(a)*s*0.5, Math.sin(a)*s*0.5, s*0.4, s*0.2, a, 0, Math.PI*2); }
        cx.fill(); cx.beginPath(); cx.arc(0,0,s*0.3,0,Math.PI*2); cx.fill(); break;
      case '🌳': case '🍀': // tree
        cx.moveTo(0,-s); cx.lineTo(-s*0.7,s*0.2); cx.lineTo(-s*0.3,s*0.2);
        cx.lineTo(-s*0.5,s*0.7); cx.lineTo(s*0.5,s*0.7); cx.lineTo(s*0.3,s*0.2);
        cx.lineTo(s*0.7,s*0.2); cx.closePath(); cx.fill(); break;
      case '⭐': case '🌙': // star
        for (let i=0;i<10;i++){ const a=i*Math.PI/5 - Math.PI/2; const rr = i%2===0?s:s*0.45; if(i===0) cx.moveTo(Math.cos(a)*rr, Math.sin(a)*rr); else cx.lineTo(Math.cos(a)*rr, Math.sin(a)*rr);} cx.closePath(); cx.fill(); break;
      case '🐠': case '🦋': case '🐳': case '🦄':
        cx.ellipse(0,0,s,s*0.5,0,0,Math.PI*2); cx.fill();
        cx.beginPath(); cx.moveTo(s*0.9,-s*0.1); cx.lineTo(s*1.3,0); cx.lineTo(s*0.9,s*0.1); cx.closePath(); cx.fill(); break;
      case '🏔️': case '🌈': case '🚀':
        cx.moveTo(-s, s*0.5); cx.lineTo(-s*0.4, -s*0.5); cx.lineTo(0, s*0.1); cx.lineTo(s*0.5, -s*0.3); cx.lineTo(s, s*0.5); cx.closePath(); cx.fill(); break;
      case '🎈': case '🔥':
        cx.arc(0,0,s*0.6,0,Math.PI*2); cx.fill(); cx.fillRect(-s*0.05,s*0.6,s*0.1,s*0.3); break;
      case '🌈':
        for (let i=0;i<5;i++){ cx.beginPath(); cx.arc(0,0,s-i*s*0.15,Math.PI,0); cx.lineWidth=8; cx.strokeStyle=['#e74c3c','#f39c12','#f1c40f','#2ecc71','#3498db'][i]; cx.stroke(); } break;
      default: // '🎨' etc - circle
        cx.arc(0,0,s*0.7,0,Math.PI*2); cx.fill();
    }
  }

  // ============================================================
  // INPUT
  // ============================================================
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x: x * (BASE_W / rect.width), y: y * (BASE_H / rect.height) };
  }
  function nearestNode(p, maxDist = SNAP_RADIUS) {
    let best = -1, bd = maxDist;
    for (let i = 0; i < state.nodes.length; i++) {
      const n = state.nodes[i];
      const dx = n.x - p.x, dy = n.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  function onDown(e) {
    e.preventDefault();
    if (state.screen !== 'play' || state.paused) return;
    ensureAudio();
    const p = getPos(e);
    const idx = state.settings.snap ? nearestNode(p) : nearestNode(p, 1e9);
    if (idx < 0) return;
    state.currentStroke = { startIdx: idx, points: [{x: state.nodes[idx].x, y: state.nodes[idx].y}], endIdx: -1 };
    sfx('snap');
  }
  function onMove(e) {
    if (!state.currentStroke) return;
    e.preventDefault();
    const p = getPos(e);
    const last = state.currentStroke.points[state.currentStroke.points.length-1];
    if (Math.hypot(p.x-last.x, p.y-last.y) > 2) {
      state.currentStroke.points.push(p);
      if (Math.random() < 0.15) sfx('draw');
    }
    // snap end if close
    const idx = state.settings.snap ? nearestNode(p) : -1;
    state.currentStroke.endIdx = idx;
  }
  function onUp(e) {
    if (!state.currentStroke) return;
    e.preventDefault();
    const stroke = state.currentStroke;
    state.currentStroke = null;
    if (stroke.endIdx < 0 || stroke.endIdx === stroke.startIdx) {
      showToast('Reach a dot!', 'error');
      sfx('error');
      return;
    }
    validateStroke(stroke.startIdx, stroke.endIdx);
  }
  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onUp, { passive: false });

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && state.screen === 'play') { togglePause(); }
    if (e.key === 'z' || e.key === 'Z') { undoStroke(); }
    if (e.key === 'r' || e.key === 'R') { redoStroke(); }
  });

  // ============================================================
  // VALIDATION
  // ============================================================
  function validateStroke(from, to) {
    const lv = state.levels[state.level];
    // Look up if this edge is the next expected in sequence
    const completedCount = state.connections.length;
    const expected = lv.expected[completedCount];
    const isExpected = expected && ((expected[0]===from && expected[1]===to) || (expected[0]===to && expected[1]===from));
    const isBranch = lv.branchEdges.some(e => (e[0]===from && e[1]===to) || (e[0]===to && e[1]===from));
    if (isExpected) {
      const edgeKey = from < to ? `${from}-${to}` : `${to}-${from}`;
      if (state.completedEdgeSet.has(edgeKey)) {
        showToast('Already drawn!', 'error'); sfx('error'); return;
      }
      state.completedEdgeSet.add(edgeKey);
      state.connections.push({ from, to, branch: false });
      state.strokeCount++;
      state.revealProgress = state.completedEdgeSet.size / lv.expected.length;
      state.shake = 4;
      spawnConfetti(state.nodes[to].x, state.nodes[to].y);
      sfx('success');
      if (state.completedEdgeSet.size >= lv.expected.length) {
        completeLevel();
      }
    } else if (isBranch) {
      const edgeKey = from < to ? `${from}-${to}` : `${to}-${from}`;
      if (state.completedEdgeSet.has(edgeKey)) {
        showToast('Already drawn!', 'error'); sfx('error'); return;
      }
      state.completedEdgeSet.add(edgeKey);
      state.connections.push({ from, to, branch: true });
      state.strokeCount++;
      spawnConfetti(state.nodes[to].x, state.nodes[to].y);
      sfx('snap');
    } else {
      showToast('Wrong line!', 'error');
      sfx('error');
    }
  }

  // ============================================================
  // UNDO / REDO (simple: clear last wrong / last main)
  // ============================================================
  const redoStack = [];
  function undoStroke() {
    if (state.connections.length === 0) return;
    const last = state.connections.pop();
    const edgeKey = last.from < last.to ? `${last.from}-${last.to}` : `${last.to}-${last.from}`;
    state.completedEdgeSet.delete(edgeKey);
    if (!last.branch) {
      state.revealProgress = state.completedEdgeSet.size / state.levels[state.level].expected.length;
    }
    redoStack.push(last);
    showToast('Undid', 'success');
  }
  function redoStroke() {
    if (redoStack.length === 0) return;
    const conn = redoStack.pop();
    const edgeKey = conn.from < conn.to ? `${conn.from}-${conn.to}` : `${conn.to}-${conn.from}`;
    state.completedEdgeSet.add(edgeKey);
    state.connections.push(conn);
    if (!conn.branch) {
      state.revealProgress = state.completedEdgeSet.size / state.levels[state.level].expected.length;
    }
    showToast('Redid', 'success');
  }

  // ============================================================
  // COMPLETION
  // ============================================================
  function completeLevel() {
    state.paused = true;
    sfx('complete');
    const elapsed = state.timerMs;
    const lv = state.levels[state.level];
    let stars = 3;
    if (state.strokeCount > lv.expected.length) stars = 2;
    if (state.strokeCount > lv.expected.length + 3) stars = 1;
    if (lv.timeLimitMs && elapsed > lv.timeLimitMs) stars = Math.max(1, stars - 1);
    const points = stars * 100 + Math.max(0, Math.floor((60000 - elapsed) / 1000)) * 10;
    state.highScore = Math.max(state.highScore, state.highScore + points);
    if (!state.progress[state.level] || state.progress[state.level].stars < stars) {
      state.progress[state.level] = { stars, timeMs: elapsed };
    }
    // unlock next
    if (state.level + 1 < state.levels.length && !state.progress[state.level+1]) {
      state.progress[state.level+1] = state.progress[state.level+1] || { locked: false };
    }
    save();
    showCompleteScreen(stars, elapsed, points);
  }

  // ============================================================
  // PARTICLES
  // ============================================================
  function spawnConfetti(x, y) {
    const colors = [state.palette.line, state.palette.dot, state.palette.accent, '#fff'];
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.5 + Math.random() * 3;
      state.particles.push({
        x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 1,
        life: 1, color: colors[Math.floor(Math.random()*colors.length)],
        size: 2 + Math.random()*3
      });
    }
  }
  function updateParticles(dt) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
      const p = state.particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= dt * 0.012;
      if (p.life <= 0) state.particles.splice(i, 1);
    }
  }

  // ============================================================
  // RENDER
  // ============================================================
  function drawBackground() {
    ctx.fillStyle = state.palette.bg;
    ctx.fillRect(0, 0, BASE_W, BASE_H);
    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < BASE_W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, BASE_H); ctx.stroke();
    }
    for (let y = 0; y < BASE_H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(BASE_W, y); ctx.stroke();
    }
  }
  function drawTargetWithReveal() {
    if (!state.targetImage || !state.targetImage.complete) return;
    const p = Math.min(1, state.revealProgress);
    if (p <= 0) return;
    ctx.save();
    ctx.globalAlpha = p;
    // apply slight scale-in
    const s = 0.8 + 0.2 * p;
    ctx.translate(BASE_W/2, BASE_H/2);
    ctx.scale(s, s);
    ctx.translate(-BASE_W/2, -BASE_H/2);
    ctx.drawImage(state.targetImage, 0, 0, BASE_W, BASE_H);
    ctx.restore();
  }
  function drawConnections() {
    const lv = state.levels[state.level];
    for (const c of state.connections) {
      const a = state.nodes[c.from], b = state.nodes[c.to];
      ctx.strokeStyle = c.branch ? state.palette.accent : state.palette.line;
      ctx.lineWidth = c.branch ? state.settings.lineWidth * 0.7 : state.settings.lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    // current stroke
    if (state.currentStroke) {
      const pts = state.currentStroke.points;
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = state.settings.lineWidth * 0.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
    // hint highlight
    if (state.hintTimer > 0 && state.completedEdgeSet.size < lv.expected.length) {
      const e = lv.expected[state.completedEdgeSet.size];
      if (e) {
        const a = state.nodes[e[0]], b = state.nodes[e[1]];
        ctx.strokeStyle = state.palette.accent;
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = state.settings.lineWidth;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }
  function drawNodes() {
    const lv = state.levels[state.level];
    const completedCount = state.completedEdgeSet.size;
    for (let i = 0; i < state.nodes.length; i++) {
      const n = state.nodes[i];
      const isNext = i === lv.expected[completedCount]?.[0] || i === lv.expected[completedCount]?.[1];
      const isConnected = state.connections.some(c => c.from === i || c.to === i);
      // glow
      if (isNext && !isConnected) {
        ctx.beginPath();
        ctx.fillStyle = state.palette.accent + '55';
        ctx.arc(n.x, n.y, 22, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.fillStyle = isConnected ? state.palette.line : state.palette.dot;
      ctx.arc(n.x, n.y, 9, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (state.settings.numbers) {
        ctx.fillStyle = '#222';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.label, n.x, n.y);
      }
    }
  }
  function drawParticles() {
    for (const p of state.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawShake() {
    if (state.shake > 0) {
      const dx = (Math.random()-0.5) * state.shake;
      const dy = (Math.random()-0.5) * state.shake;
      ctx.translate(dx, dy);
      state.shake *= 0.85;
      if (state.shake < 0.2) state.shake = 0;
    }
  }

  function render() {
    ctx.save();
    drawShake();
    drawBackground();
    drawTargetWithReveal();
    drawConnections();
    drawNodes();
    drawParticles();
    ctx.restore();
  }

  // ============================================================
  // MENU BACKGROUND (animated dots)
  // ============================================================
  const menuDots = [];
  for (let i = 0; i < 50; i++) {
    menuDots.push({ x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, v: 0.2 + Math.random()*0.5 });
  }
  function renderMenuBg() {
    const w = window.innerWidth, h = window.innerHeight;
    menuCtx.clearRect(0, 0, w, h);
    for (const d of menuDots) {
      d.y -= d.v;
      if (d.y < -10) { d.y = h + 10; d.x = Math.random()*w; }
      menuCtx.fillStyle = 'rgba(255,216,107,0.4)';
      menuCtx.beginPath();
      menuCtx.arc(d.x, d.y, 2, 0, Math.PI*2);
      menuCtx.fill();
    }
  }

  // ============================================================
  // GAME LOOP
  // ============================================================
  let lastTime = performance.now();
  function loop(now) {
    const dt = Math.min(64, now - lastTime);
    lastTime = now;
    if (state.screen === 'play' && !state.paused) {
      state.timerMs = now - state.timerStart;
      updateHUD();
      if (state.levels[state.level].timeLimitMs && state.timerMs > state.levels[state.level].timeLimitMs) {
        showToast('Time\'s up!', 'error');
        state.paused = true;
        sfx('error');
      }
    }
    updateParticles(dt);
    if (state.hintTimer > 0) state.hintTimer -= dt;
    if (state.screen === 'play') render();
    renderMenuBg();
    requestAnimationFrame(loop);
  }

  // ============================================================
  // HUD
  // ============================================================
  function updateHUD() {
    document.getElementById('hud-level').textContent = state.levels[state.level]?.name || '';
    const sec = Math.floor(state.timerMs / 1000);
    document.getElementById('hud-timer').textContent = `⏱ ${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
    document.getElementById('hud-stars').textContent = `⭐ ${state.completedEdgeSet.size}/${state.levels[state.level].expected.length}`;
    document.getElementById('hud-strokes').textContent = `Strokes: ${state.strokeCount}`;
  }

  // ============================================================
  // SCREENS
  // ============================================================
  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.remove('hidden');
    state.screen = name === 'main' ? 'main' : name === 'play' ? 'play' : 'menu';
    if (name === 'play') state.screen = 'play';
    hud.style.display = (name === 'play') ? 'flex' : 'none';
    hudBottom.style.display = (name === 'play') ? 'flex' : 'none';
    if (name === 'levels') renderLevelGrid();
    if (name === 'main') {
      document.getElementById('menu-highscore').textContent = state.highScore;
    }
  }

  function renderLevelGrid() {
    const grid = document.getElementById('level-grid');
    grid.innerHTML = '';
    state.levels.forEach((lv, i) => {
      const prog = state.progress[i];
      const unlocked = i === 0 || state.progress[i-1];
      const card = document.createElement('div');
      card.className = 'level-card' + (unlocked ? '' : ' locked');
      card.innerHTML = `<div>${i+1}${unlocked ? '' : ' 🔒'}</div><div class="stars">${prog?.stars ? '⭐'.repeat(prog.stars) : ''}</div>`;
      card.addEventListener('click', () => {
        if (!unlocked) { showToast('Locked!', 'error'); return; }
        startLevel(i);
      });
      grid.appendChild(card);
    });
  }

  function showCompleteScreen(stars, timeMs, points) {
    showScreen('complete');
    document.getElementById('complete-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3-stars);
    const sec = Math.floor(timeMs / 1000);
    document.getElementById('complete-stats').innerHTML =
      `Time: <b>${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}</b><br>` +
      `Strokes: <b>${state.strokeCount}</b><br>` +
      `Points: <b style="color:#ffd86b">+${points}</b>`;
  }

  // ============================================================
  // GAME FLOW
  // ============================================================
  function startLevel(idx) {
    state.level = idx;
    const lv = state.levels[idx];
    state.nodes = lv.nodes.map(n => ({...n}));
    state.connections = [];
    state.completedEdgeSet = new Set();
    state.strokeCount = 0;
    state.revealProgress = 0;
    state.paused = false;
    state.timerStart = performance.now();
    state.timerMs = 0;
    state.particles = [];
    redoStack.length = 0;
    state.palette = lv.palette;
    makeTargetImage(lv);
    showScreen('play');
  }

  function togglePause() {
    if (state.screen !== 'play') return;
    state.paused = !state.paused;
    if (state.paused) {
      showScreen('pause');
      state.timerStart = performance.now() - state.timerMs;
    } else {
      showScreen('play');
      state.timerStart = performance.now() - state.timerMs;
    }
  }

  // ============================================================
  // TOAST
  // ============================================================
  let toastTimer = 0;
  function showToast(msg, type) {
    toast.textContent = msg;
    toast.className = 'show ' + (type || '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = ''; }, 1400);
  }

  // ============================================================
  // ACTIONS / EVENT WIRING
  // ============================================================
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const a = btn.dataset.action;
    ensureAudio();
    if (a === 'play') { startLevel(0); }
    else if (a === 'levels') { showScreen('levels'); }
    else if (a === 'howto') { showScreen('howto'); }
    else if (a === 'settings') { showScreen('settings'); syncSettings(); }
    else if (a === 'back') { showScreen('main'); }
    else if (a === 'resume') { togglePause(); }
    else if (a === 'restart') { startLevel(state.level); }
    else if (a === 'quit') { showScreen('main'); }
    else if (a === 'next') {
      if (state.level + 1 < state.levels.length) startLevel(state.level+1);
      else showScreen('main');
    }
  });

  function syncSettings() {
    document.getElementById('vol-master').value = state.settings.volMaster * 100;
    document.getElementById('vol-music').value = state.settings.volMusic * 100;
    document.getElementById('vol-sfx').value = state.settings.volSfx * 100;
    document.getElementById('opt-numbers').checked = state.settings.numbers;
    document.getElementById('opt-snap').checked = state.settings.snap;
    document.getElementById('opt-width').value = state.settings.lineWidth;
  }
  ['vol-master','vol-music','vol-sfx','opt-numbers','opt-snap','opt-width'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
      const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      if (id === 'vol-master') state.settings.volMaster = v/100;
      else if (id === 'vol-music') state.settings.volMusic = v/100;
      else if (id === 'vol-sfx') state.settings.volSfx = v/100;
      else if (id === 'opt-numbers') state.settings.numbers = v;
      else if (id === 'opt-snap') state.settings.snap = v;
      else if (id === 'opt-width') state.settings.lineWidth = +v;
      save();
    });
  });

  document.getElementById('btn-hint').addEventListener('click', () => {
    if (state.screen !== 'play') return;
    state.hintTimer = 2000;
    showToast('Hint shown!', 'success');
  });
  document.getElementById('btn-pause').addEventListener('click', togglePause);

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    load();
    buildAllLevels();
    resize();
    syncSettings();
    showScreen('main');
    requestAnimationFrame(loop);
  }
  init();
})();
