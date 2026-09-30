const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width, height, dpr;
function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = canvas.width = window.innerWidth * dpr;
  height = canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr);
  worldW = window.innerWidth;
  worldH = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const PALETTE = {
  bg1: '#0f0f23', bg2: '#16213e', bg3: '#1a1a2e',
  goo: '#00ff88', gooDark: '#00aa66', gooLight: '#88ffcc',
  gooStretch: '#ffd700', gooBreak: '#ff6b6b',
  conn: '#00ff8888', connStress: '#ffd700cc', connBreak: '#ff6b6bcc',
  anchor: '#00ffff', goal: '#ff6b6b', ground: '#2a2a4a',
  text: '#ffffff', ui: '#00ff88', uiWarn: '#ffd700', uiDanger: '#ff6b6b'
};

const GRAVITY = 980;
const SUBSTEPS = 4;
const BALL_RADIUS = 20;
const MAX_STRETCH = 3.0;
const SPRING_K = 800;
const DAMPING = 20;
const BREAK_THRESHOLD = 2.8;

let balls = [];
let connections = [];
let anchors = [];
let goal = null;
let ground = [];
let selectedBall = null;
let dragStart = null;
let tool = 'place';
let history = [];
let historyIndex = -1;
let running = true;
let startTime = 0;
let elapsed = 0;
let bestTime = parseFloat(localStorage.getItem('gooBestTime')) || 0;
let levelComplete = false;
let camera = { x: 0, y: 0, zoom: 1 };
let worldW, worldH;
let mouse = { x: 0, y: 0, down: false, rightDown: false };
let touchPoints = [];

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, dur, type='sine', vol=0.1, start=0) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g); g.connect(audioCtx.destination);
  const t = audioCtx.currentTime + start;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t); o.stop(t + dur);
}
function sfxPlace() { playTone(800, 0.1, 'sine', 0.08); playTone(1200, 0.05, 'sine', 0.04, 0.05); }
function sfxConnect() { playTone(400, 0.15, 'triangle', 0.06); playTone(600, 0.1, 'triangle', 0.04, 0.05); }
function sfxBreak() { playTone(200, 0.2, 'sawtooth', 0.1); playTone(100, 0.3, 'sawtooth', 0.08, 0.1); }
function sfxSuccess() { [800,1000,1200,1600].forEach((f,i)=>playTone(f,0.15,'sine',0.06,i*0.1)); }
function sfxClick() { playTone(600, 0.05, 'square', 0.04); }

function saveState() {
  history.splice(historyIndex + 1);
  history.push(JSON.stringify({ balls: balls.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,fixed:b.fixed})), connections: connections.map(c=>({a:c.a.index,b:c.b.index,len:c.restLen})) }));
  historyIndex = history.length - 1;
  if (history.length > 50) { history.shift(); historyIndex--; }
}
function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    loadState(JSON.parse(history[historyIndex]));
    sfxClick();
  }
}
function loadState(state) {
  balls = state.balls.map((b,i) => {
    const ball = new Ball(b.x, b.y);
    ball.vx = b.vx; ball.vy = b.vy; ball.fixed = b.fixed;
    return ball;
  });
  connections = [];
  state.connections.forEach(c => {
    if (balls[c.a] && balls[c.b]) {
      connections.push(new Connection(balls[c.a], balls[c.b], c.len));
    }
  });
}

class Ball {
  constructor(x, y, fixed = false) {
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.radius = BALL_RADIUS;
    this.mass = 1;
    this.fixed = fixed;
    this.connections = [];
    this.stretch = 1;
    this.color = fixed ? PALETTE.anchor : PALETTE.goo;
  }
  applyForce(fx, fy) { if (!this.fixed) { this.vx += fx / this.mass; this.vy += fy / this.mass; } }
  update(dt) {
    if (this.fixed) return;
    this.vy += GRAVITY * dt;
    this.vx *= 0.999; this.vy *= 0.999;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < this.radius) { this.x = this.radius; this.vx *= -0.3; }
    if (this.x > worldW - this.radius) { this.x = worldW - this.radius; this.vx *= -0.3; }
    if (this.y > worldH - this.radius) { this.y = worldH - this.radius; this.vy *= -0.3; }
  }
  draw() {
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    let c = this.color;
    if (this.stretch > BREAK_THRESHOLD) c = PALETTE.gooBreak;
    else if (this.stretch > 1.5) c = PALETTE.gooStretch;
    grad.addColorStop(0, this.fixed ? PALETTE.anchor : PALETTE.gooLight);
    grad.addColorStop(0.5, c);
    grad.addColorStop(1, this.fixed ? '#0088aa' : PALETTE.gooDark);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = this.fixed ? PALETTE.anchor : (this.stretch > BREAK_THRESHOLD ? PALETTE.gooBreak : PALETTE.gooDark);
    ctx.lineWidth = 2;
    ctx.stroke();
    if (this.stretch > 1.2) {
      ctx.strokeStyle = this.stretch > BREAK_THRESHOLD ? PALETTE.gooBreak : PALETTE.gooStretch;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const ang = (this.stretch * 10 + i * 2) * 0.1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, ang, ang + 0.5);
        ctx.stroke();
      }
    }
    if (this === selectedBall && !this.fixed) {
      ctx.strokeStyle = PALETTE.ui;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

class Connection {
  constructor(a, b, restLen = null) {
    this.a = a; this.b = b;
    this.restLen = restLen || Math.hypot(a.x - b.x, a.y - b.y);
    this.broken = false;
    this.stress = 0;
    a.connections.push(this); b.connections.push(this);
  }
  update(dt) {
    if (this.broken) return;
    const dx = this.b.x - this.a.x;
    const dy = this.b.y - this.a.y;
    const dist = Math.hypot(dx, dy) || 0.001;
    this.stress = dist / this.restLen;
    if (this.stress > MAX_STRETCH) { this.break(); return; }
    const force = (dist - this.restLen) * SPRING_K;
    const damp = DAMPING * ((this.a.vx - this.b.vx) * dx + (this.a.vy - this.b.vy) * dy) / dist;
    const fx = (force + damp) * dx / dist;
    const fy = (force + damp) * dy / dist;
    this.a.applyForce(fx, fy);
    this.b.applyForce(-fx, -fy);
  }
  break() {
    this.broken = true;
    this.a.connections = this.a.connections.filter(c => c !== this);
    this.b.connections = this.b.connections.filter(c => c !== this);
    sfxBreak();
    for (let i = 0; i < 8; i++) {
      particles.push(new Particle(this.a.x, this.a.y, PALETTE.gooBreak));
      particles.push(new Particle(this.b.x, this.b.y, PALETTE.gooBreak));
    }
  }
  draw() {
    if (this.broken) return;
    const stress = Math.min(this.stress, 2);
    ctx.beginPath();
    ctx.moveTo(this.a.x, this.a.y);
    ctx.lineTo(this.b.x, this.b.y);
    ctx.lineWidth = 3 * Math.max(0.5, 2 - stress * 0.3);
    if (stress > BREAK_THRESHOLD) ctx.strokeStyle = PALETTE.connBreak;
    else if (stress > 1.5) ctx.strokeStyle = PALETTE.connStress;
    else ctx.strokeStyle = PALETTE.conn;
    ctx.stroke();
    if (stress > 1.5) {
      ctx.strokeStyle = stress > BREAK_THRESHOLD ? PALETTE.gooBreak : PALETTE.gooStretch;
      ctx.lineWidth = 1;
      const mx = (this.a.x + this.b.x) / 2;
      const my = (this.a.y + this.b.y) / 2;
      for (let i = 0; i < 3; i++) {
        const ang = Math.atan2(this.b.y - this.a.y, this.b.x - this.a.x) + Math.PI / 2;
        const off = (i - 1) * 8;
        ctx.beginPath();
        ctx.moveTo(mx + Math.cos(ang) * off, my + Math.sin(ang) * off);
        ctx.lineTo(mx + Math.cos(ang) * off + Math.cos(ang + 0.5) * 10, my + Math.sin(ang) * off + Math.sin(ang + 0.5) * 10);
        ctx.stroke();
      }
    }
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 200;
    this.vy = (Math.random() - 0.5) * 200 - 100;
    this.life = 1; this.color = color; this.size = Math.random() * 4 + 2;
  }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.vy += GRAVITY * dt * 0.5; this.life -= dt * 2; }
  draw() { if (this.life <= 0) return; ctx.globalAlpha = this.life; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
}
const particles = [];

function initLevel() {
  balls = []; connections = []; anchors = []; particles.length = 0;
  ground = [{x:0,y:worldH-60,w:worldW,h:60}];
  anchors.push(new Ball(100, worldH - 100, true));
  anchors.push(new Ball(worldW - 100, worldH - 100, true));
  balls.push(...anchors);
  goal = { x: worldW / 2, y: 150, radius: 30, reached: false };
  startTime = performance.now();
  elapsed = 0;
  levelComplete = false;
  running = true;
  saveState();
  document.getElementById('levelName').textContent = 'Level 1: First Steps';
  document.getElementById('message').innerHTML = '';
  document.getElementById('message').className = 'hud message';
}

function getBallAt(x, y) {
  for (let i = balls.length - 1; i >= 0; i--) {
    if (Math.hypot(balls[i].x - x, balls[i].y - y) < balls[i].radius + 5) return balls[i];
  }
  return null;
}
function getConnectionAt(x, y) {
  for (const c of connections) {
    if (c.broken) continue;
    const dx = c.b.x - c.a.x, dy = c.b.y - c.a.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) continue;
    const t = ((x - c.a.x) * dx + (y - c.a.y) * dy) / (len * len);
    if (t >= 0 && t <= 1) {
      const px = c.a.x + t * dx, py = c.a.y + t * dy;
      if (Math.hypot(x - px, y - py) < 8) return c;
    }
  }
  return null;
}

function setTool(t) {
  tool = t;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === t));
  sfxClick();
}

document.querySelectorAll('.tool-btn').forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));

document.addEventListener('keydown', e => {
  if (e.key === 'z' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); undo(); }
  else if (e.key === 'r') { initLevel(); sfxClick(); }
  else if (e.key >= '1' && e.key <= '4') setTool(['place','connect','delete','move'][e.key - '1']);
});

canvas.addEventListener('mousedown', e => {
  if (e.button === 2) { e.preventDefault(); mouse.rightDown = true; return; }
  mouse.down = true;
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) * dpr;
  mouse.y = (e.clientY - rect.top) * dpr;
  handleDown(mouse.x, mouse.y);
});
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) * dpr;
  mouse.y = (e.clientY - rect.top) * dpr;
  handleMove(mouse.x, mouse.y);
});
canvas.addEventListener('mouseup', e => { mouse.down = false; mouse.rightDown = false; handleUp(); });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('touchstart', e => { e.preventDefault(); touchPoints = Array.from(e.touches); if (touchPoints.length === 1) handleDown(touchPoints[0].clientX * dpr, touchPoints[0].clientY * dpr); });
canvas.addEventListener('touchmove', e => { e.preventDefault(); touchPoints = Array.from(e.touches); if (touchPoints.length === 1) handleMove(touchPoints[0].clientX * dpr, touchPoints[0].clientY * dpr); });
canvas.addEventListener('touchend', e => { touchPoints = Array.from(e.touches); handleUp(); });

function handleDown(x, y) {
  dragStart = { x, y };
  if (tool === 'place') {
    if (!getBallAt(x, y) && balls.length < 100) {
      balls.push(new Ball(x, y));
      sfxPlace();
      saveState();
    }
  } else if (tool === 'connect') {
    selectedBall = getBallAt(x, y);
  } else if (tool === 'delete') {
    const ball = getBallAt(x, y);
    if (ball && !ball.fixed) { removeBall(ball); sfxBreak(); saveState(); }
    else {
      const conn = getConnectionAt(x, y);
      if (conn) { conn.break(); saveState(); }
    }
  } else if (tool === 'move') {
    selectedBall = getBallAt(x, y);
  } else if (tool === 'reset') {
    initLevel();
  }
}
function handleMove(x, y) {
  if (tool === 'connect' && selectedBall && dragStart) {
    const other = getBallAt(x, y);
    if (other && other !== selectedBall && !connections.some(c => (c.a === selectedBall && c.b === other) || (c.a === other && c.b === selectedBall))) {
      connections.push(new Connection(selectedBall, other));
      sfxConnect();
      saveState();
      selectedBall = null;
      dragStart = null;
    }
  } else if (tool === 'move' && selectedBall && !selectedBall.fixed) {
    selectedBall.x = x;
    selectedBall.y = y;
    selectedBall.vx = 0;
    selectedBall.vy = 0;
  }
}
function handleUp() {
  dragStart = null;
  selectedBall = null;
}
function removeBall(ball) {
  ball.connections.forEach(c => c.break());
  balls = balls.filter(b => b !== ball);
}

function updatePhysics(dt) {
  const subDt = dt / SUBSTEPS;
  for (let s = 0; s < SUBSTEPS; s++) {
    balls.forEach(b => b.update(subDt));
    connections.forEach(c => c.update(subDt));
    connections = connections.filter(c => !c.broken);
  }
  particles.forEach(p => p.update(dt));
  for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
  
  let maxStress = 0;
  connections.forEach(c => { if (c.stress > maxStress) maxStress = c.stress; });
  document.getElementById('stabilityFill').style.width = Math.max(0, 100 - (maxStress - 1) * 50) + '%';
  
  if (goal && !goal.reached) {
    const dx = goal.x - (balls[0]?.x || 0);
    const dy = goal.y - (balls[0]?.y || 0);
    const dist = Math.hypot(dx, dy);
    document.getElementById('goalDist').textContent = `Goal: ${Math.round(dist)}px`;
    balls.forEach(b => {
      if (!b.fixed && Math.hypot(b.x - goal.x, b.y - goal.y) < goal.radius + b.radius) {
        goal.reached = true;
        levelComplete = true;
        running = false;
        if (bestTime === 0 || elapsed < bestTime) {
          bestTime = elapsed;
          localStorage.setItem('gooBestTime', bestTime.toString());
        }
        sfxSuccess();
        document.getElementById('message').innerHTML = '<h1 class="success">LEVEL COMPLETE!</h1><p>Time: ' + formatTime(elapsed) + '</p>';
        document.getElementById('message').className = 'hud message success';
        for (let i = 0; i < 30; i++) particles.push(new Particle(goal.x, goal.y, PALETTE.goal));
      }
    });
  }
  
  balls.forEach(b => {
    if (!b.fixed && b.y > worldH + 100) {
      if (running) {
        running = false;
        sfxBreak();
        document.getElementById('message').innerHTML = '<h1 class="fail">STRUCTURE COLLAPSED</h1><p>Press R to retry</p>';
        document.getElementById('message').className = 'hud message fail';
      }
    }
  });
}

function formatTime(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}.${cs.toString().padStart(2,'0')}`;
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, worldW, worldH);
  
  const grad = ctx.createLinearGradient(0, 0, 0, worldH);
  grad.addColorStop(0, PALETTE.bg1);
  grad.addColorStop(0.5, PALETTE.bg2);
  grad.addColorStop(1, PALETTE.bg3);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, worldW, worldH);
  
  for (let i = 0; i < 50; i++) {
    const x = (i * 123 + Date.now() * 0.01) % worldW;
    const y = (i * 456 + Date.now() * 0.005) % worldH;
    ctx.fillStyle = `rgba(0,255,136,${0.02 + Math.sin(Date.now() * 0.001 + i) * 0.01})`;
    ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
  }
  
  ground.forEach(g => {
    ctx.fillStyle = PALETTE.ground);
    ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(g.x, g.y, g.w, 4);
  });
  
  if (goal && !goal.reached) {
    const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
    ctx.save();
    ctx.translate(goal.x, goal.y);
    ctx.rotate(Date.now() * 0.001);
    ctx.strokeStyle = PALETTE.goal;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(i * 2.09) * goal.radius * pulse, Math.sin(i * 2.09) * goal.radius * pulse);
    }
    ctx.stroke();
    ctx.fillStyle = PALETTE.goal + '44';
    ctx.beginPath();
    ctx.arc(0, 0, goal.radius * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  connections.forEach(c => c.draw());
  balls.forEach(b => b.draw());
  particles.forEach(p => p.draw());
  
  if (tool === 'connect' && selectedBall && dragStart) {
    ctx.strokeStyle = PALETTE.ui + '88';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(selectedBall.x, selectedBall.y);
    ctx.lineTo(mouse.x, mouse.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  document.getElementById('ballCount').textContent = `${balls.filter(b => !b.fixed).length} / 100`;
  document.getElementById('highScore').textContent = bestTime ? `Best: ${formatTime(bestTime)}` : 'Best: --:--.--';
}

let lastTime = 0;
function gameLoop(time) {
  if (!lastTime) lastTime = time;
  const dt = Math.min((time - lastTime) / 1000, 0.1);
  lastTime = time;
  
  if (running) elapsed = time - startTime;
  document.getElementById('timer').textContent = formatTime(elapsed);
  
  if (running) updatePhysics(dt);
  render();
  requestAnimationFrame(gameLoop);
}

initLevel();
requestAnimationFrame(gameLoop);
