// MAGNETIC BREAKOUT - Complete Game
(() => {
'use strict';

// ===================== CONSTANTS =====================
const W = 960, H = 720;
const PADDLE_W = 110, PADDLE_H = 14;
const BALL_R = 9;
const K_MAG = 0.0008;
const F_MAX = 0.45;
const MAG_RANGE = 240;
const BASE_SPEED = 420;
const MAX_SPEED = 720;
const SWITCH_CD = 200;
const COMBO_THRESHOLD = 0.15;
const COMBO_TIME = 500;
const DROP_CHANCE = 0.15;
const SPEEDRUN_KEY = 'mb_speedrun';
const SCORE_KEY = 'mb_scores';

const COL_N = '#00f0ff';
const COL_S = '#ff00aa';
const COL_BG = '#0a0e27';

// ===================== UTILITIES =====================
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ===================== AUDIO =====================
class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.hum = null;
    this.humGain = null;
  }
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.3;
      this.master.connect(this.ctx.destination);
      this.humGain = this.ctx.createGain();
      this.humGain.gain.value = 0;
      this.humGain.connect(this.master);
      this.hum = this.ctx.createOscillator();
      this.hum.type = 'sine';
      this.hum.frequency.value = 80;
      this.hum.connect(this.humGain);
      this.hum.start();
    } catch(e) {}
  }
  tone(freq, dur, type='square', vol=0.3) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.master);
    o.start(); o.stop(this.ctx.currentTime + dur);
  }
  brick() { this.tone(440 + Math.random()*220, 0.08, 'square', 0.15); }
  reinforced() { this.tone(220, 0.15, 'sawtooth', 0.2); this.tone(180, 0.2, 'square', 0.15); }
  swap() { this.tone(880, 0.15, 'sine', 0.25); this.tone(1320, 0.1, 'sine', 0.15); }
  powerup() { this.tone(660, 0.1, 'triangle', 0.2); this.tone(990, 0.15, 'triangle', 0.2); }
  launch() { this.tone(523, 0.12, 'sine', 0.2); }
  lose() { this.tone(200, 0.3, 'sawtooth', 0.3); this.tone(120, 0.4, 'sawtooth', 0.3); }
  win() { this.tone(660, 0.15, 'sine', 0.2); setTimeout(()=>this.tone(880, 0.15, 'sine', 0.2), 100); setTimeout(()=>this.tone(1320, 0.3, 'sine', 0.25), 200); }
  combo(n) { this.tone(440 + n*80, 0.06, 'sine', 0.1); }
  updateHum(d) {
    if (!this.humGain) return;
    const target = clamp(1 - d / 240, 0, 1) * 0.08;
    this.humGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
    this.hum.frequency.setTargetAtTime(80 + (1 - target/0.08)*40, this.ctx.currentTime, 0.1);
  }
}

const audio = new Audio();

// ===================== INPUT =====================
class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouseX = W/2;
    this.mouseY = H/2;
    this.keys = {};
    this.left = false; this.right = false;
    this.spaceQueued = false;
    this.rightClickQueued = false;
    this.clickQueued = false;
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - r.left) / r.width * W;
      this.mouseY = (e.clientY - r.top) / r.height * H;
    });
    canvas.addEventListener('mousedown', e => {
      audio.init();
      if (e.button === 2) this.rightClickQueued = true;
      else this.clickQueued = true;
    });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const t = e.touches[0];
      this.mouseX = (t.clientX - r.left) / r.width * W;
      this.mouseY = (t.clientY - r.top) / r.height * H;
    }, {passive:false});
    canvas.addEventListener('touchstart', e => {
      audio.init();
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const t = e.touches[0];
      this.mouseX = (t.clientX - r.left) / r.width * W;
      this.mouseY = (t.clientY - r.top) / r.height * H;
      this.clickQueued = true;
    }, {passive:false});
    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      this.keys[e.code] = true;
      if (e.code === 'ArrowLeft') this.left = true;
      if (e.code === 'ArrowRight') this.right = true;
      if (e.code === 'Space') { e.preventDefault(); this.spaceQueued = true; }
      if (e.code === 'KeyQ') this.keys.ForcePlus = true;
      if (e.code === 'KeyE') this.keys.ForceMinus = true;
    });
    window.addEventListener('keyup', e => {
      this.keys[e.code] = false;
      if (e.code === 'ArrowLeft') this.left = false;
      if (e.code === 'ArrowRight') this.right = false;
    });
  }
  consumeSpace() { const v = this.spaceQueued; this.spaceQueued = false; return v; }
  consumeClick() { const v = this.clickQueued; this.clickQueued = false; return v; }
  consumeRight() { const v = this.rightClickQueued; this.rightClickQueued = false; return v; }
}

// ===================== PARTICLE =====================
class Particle {
  constructor() { this.active = false; }
  init(x, y, vx, vy, color, life, gravity=200, size=4) {
    this.active = true;
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.color = color; this.life = life; this.maxLife = life;
    this.gravity = gravity; this.size = size;
    this.rot = Math.random()*Math.PI*2; this.vr = rand(-4, 4);
  }
  update(dt) {
    if (!this.active) return;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    this.rot += this.vr * dt;
    this.life -= dt;
    if (this.life <= 0) this.active = false;
  }
  draw(ctx) {
    if (!this.active) return;
    const a = this.life / this.maxLife;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;
    ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
    ctx.restore();
  }
}

class ParticlePool {
  constructor(max=200) {
    this.pool = Array.from({length: max}, () => new Particle());
  }
  spawn(x, y, vx, vy, color, life, gravity=200, size=4) {
    for (const p of this.pool) {
      if (!p.active) { p.init(x, y, vx, vy, color, life, gravity, size); return p; }
    }
  }
  burst(x, y, color, count=6, speed=180) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + rand(-0.3, 0.3);
      const s = rand(speed*0.5, speed);
      this.spawn(x, y, Math.cos(a)*s, Math.sin(a)*s, color, rand(0.5, 0.9), 200, rand(3, 6));
    }
  }
  update(dt) { for (const p of this.pool) p.update(dt); }
  draw(ctx) { for (const p of this.pool) p.draw(ctx); }
}

// ===================== BALL =====================
class Ball {
  constructor() {
    this.x = W/2; this.y = H - 80;
    this.vx = 0; this.vy = 0;
    this.speed = BASE_SPEED;
    this.polarity = 1; // +1 N, -1 S
    this.stuck = true;
    this.trail = [];
    this.invuln = 0;
  }
  attach(p) {
    this.x = p.x; this.y = p.y - PADDLE_H/2 - BALL_R - 2;
    this.vx = 0; this.vy = 0;
    this.stuck = true;
    this.trail.length = 0;
  }
  launch() {
    if (!this.stuck) return;
    this.stuck = false;
    const a = rand(-Math.PI/3, -Math.PI*2/3);
    this.vx = Math.cos(a) * this.speed;
    this.vy = Math.sin(a) * this.speed;
    audio.launch();
  }
  update(dt, paddle, obstacles) {
    if (this.stuck) {
      this.x = paddle.x;
      this.y = paddle.y - PADDLE_H/2 - BALL_R - 2;
      return;
    }
    if (this.invuln > 0) this.invuln -= dt;

    // Apply magnetic forces
    let fx = 0, fy = 0;
    // Paddle
    if (this.polarity !== 0) {
      const dx = paddle.x - this.x;
      const dy = paddle.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < MAG_RANGE && d > 5) {
        let f = K_MAG * (this.polarity * paddle.polarity) / (d * d);
        f = clamp(f, -F_MAX, F_MAX);
        fx += (dx/d) * f;
        fy += (dy/d) * f;
      }
    }
    // Static obstacles
    for (const o of obstacles) {
      const dx = o.x - this.x;
      const dy = o.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d < o.range && d > 5) {
        let f = 0.6 * (this.polarity * o.polarity) / (d * d * 0.01);
        f = clamp(f, -0.6, 0.6);
        fx += (dx/d) * f;
        fy += (dy/d) * f;
      }
    }

    // Force scaled to velocity-like
    fx *= 1000;
    fy *= 1000;

    this.vx += fx * dt;
    this.vy += fy * dt;

    // Cap velocity
    const sp = Math.hypot(this.vx, this.vy);
    if (sp > this.speed) {
      this.vx = (this.vx/sp) * this.speed;
      this.vy = (this.vy/sp) * this.speed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Trail
    this.trail.push({x:this.x, y:this.y, p:this.polarity});
    if (this.trail.length > 12) this.trail.shift();

    // Wall collisions
    if (this.x - BALL_R < 0) {
      this.x = BALL_R;
      this.vx = Math.abs(this.vx) * (1 + rand(-0.04, 0.04));
      this.vy += rand(-30, 30);
    }
    if (this.x + BALL_R > W) {
      this.x = W - BALL_R;
      this.vx = -Math.abs(this.vx) * (1 + rand(-0.04, 0.04));
      this.vy += rand(-30, 30);
    }
    if (this.y - BALL_R < 48) { // top HUD area
      this.y = 48 + BALL_R;
      this.vy = Math.abs(this.vy);
    }

    // Bottom
    if (this.y - BALL_R > H) {
      this.dead = true;
    }
  }
  draw(ctx) {
    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const a = (i / this.trail.length) * 0.5;
      const c = t.p > 0 ? COL_N : COL_S;
      ctx.fillStyle = c;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(t.x, t.y, BALL_R * (0.4 + i/this.trail.length * 0.6), 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Ball
    const c = this.polarity > 0 ? COL_N : COL_S;
    ctx.save();
    ctx.shadowColor = c;
    ctx.shadowBlur = 24;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(this.x, this.y, BALL_R, 0, Math.PI*2);
    ctx.fill();
    // Inner core
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(this.x - 2, this.y - 2, BALL_R * 0.4, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

// ===================== PADDLE =====================
class Paddle {
  constructor() { this.reset(); }
  reset() {
    this.x = W/2;
    this.y = H - 60;
    this.w = PADDLE_W;
    this.h = PADDLE_H;
    this.vx = 0;
    this.polarity = 1;
    this.switchCD = 0;
    this.wideTime = 0;
    this.shieldTime = 0;
    this.pulse = 0;
  }
  update(dt, input) {
    // Keyboard
    if (input.left) this.vx -= 1800 * dt;
    if (input.right) this.vx += 1800 * dt;
    if (!input.left && !input.right) this.vx *= 0.85;
    this.vx = clamp(this.vx, -720, 720);
    this.x += this.vx * dt;

    // Mouse: target
    const target = clamp(input.mouseX, this.w/2 + 4, W - this.w/2 - 4);
    // blend toward target gently
    this.x = lerp(this.x, target, 0.35);

    this.x = clamp(this.x, this.w/2 + 4, W - this.w/2 - 4);

    if (this.switchCD > 0) this.switchCD -= dt;
    if (this.wideTime > 0) this.wideTime -= dt;
    if (this.shieldTime > 0) this.shieldTime -= dt;
    if (this.pulse > 0) this.pulse -= dt;
  }
  switchPolarity() {
    if (this.switchCD > 0) return false;
    this.polarity *= -1;
    this.switchCD = SWITCH_CD / 1000;
    this.pulse = 0.12;
    audio.swap();
    return true;
  }
  setPolarity(p) {
    if (this.switchCD > 0 || this.polarity === p) return;
    this.polarity = p;
    this.switchCD = SWITCH_CD / 1000;
    this.pulse = 0.12;
    audio.swap();
  }
  currentWidth() { return this.wideTime > 0 ? this.w * 2 : this.w; }
  draw(ctx) {
    const w = this.currentWidth();
    const c = this.polarity > 0 ? COL_N : COL_S;
    ctx.save();
    ctx.shadowColor = c;
    ctx.shadowBlur = 20 + (this.pulse > 0 ? 30 : 0);
    // Body
    ctx.fillStyle = '#1a1f4a';
    ctx.strokeStyle = c;
    ctx.lineWidth = 2;
    roundRect(ctx, this.x - w/2, this.y - this.h/2, w, this.h, 7);
    ctx.fill(); ctx.stroke();
    // Magnetic cores
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(this.x - w/2 + 8, this.y, 4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.x + w/2 - 8, this.y, 4, 0, Math.PI*2); ctx.fill();
    // Polarity icon
    ctx.shadowBlur = 8;
    ctx.font = 'bold 16px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillStyle = c;
    ctx.fillText(this.polarity > 0 ? '+' : '−', this.x, this.y - 18);

    // Pulse ring
    if (this.pulse > 0) {
      const r = (1 - this.pulse/0.12) * 60 + 10;
      ctx.globalAlpha = this.pulse / 0.12 * 0.5;
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI*2); ctx.stroke();
    }
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

// ===================== BRICK =====================
class Brick {
  constructor(x, y, w, h, type='std') {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.type = type;
    this.dead = false;
    this.hp = type === 'reinf' ? 3 : 1;
    this.maxHp = this.hp;
    this.polarity = type === 'mag' ? (Math.random() < 0.5 ? 1 : -1) : 0;
    this.flash = 0;
  }
  hit() {
    this.hp--;
    this.flash = 0.15;
    if (this.hp <= 0) { this.dead = true; return true; }
    return false;
  }
  update(dt) { if (this.flash > 0) this.flash -= dt; }
  draw(ctx) {
    let c;
    if (this.type === 'mag') c = this.polarity > 0 ? COL_N : COL_S;
    else if (this.type === 'reinf') {
      const t = this.hp / this.maxHp;
      c = lerpColor('#ff5555', '#ffaa00', t);
    } else c = lerpColor(COL_N, COL_S, Math.random());

    ctx.globalAlpha = 0.9;
    // Gradient
    const g = ctx.createLinearGradient(this.x, this.y, this.x, this.y+this.h);
    g.addColorStop(0, c);
    g.addColorStop(1, shadeColor(c, -30));
    ctx.fillStyle = g;
    ctx.shadowColor = c; ctx.shadowBlur = this.flash > 0 ?18 : 8 : 12;
    roundRect(ctx, this.x+1, this.y+1, this.w-2, this.h-2, 4);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, this.x+1, this.y+1, this.w-2, this.h-2, 4);
    ctx.stroke();
    // Magnetic indicator
    if (this.type === 'mag') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(this.polarity > 0 ? 'N' : 'S', this.x + this.w/2, this.y + this.h/2 + 4);
    }
    if (this.type === 'reinf') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText('■'.repeat(this.hp), this.x + this.w/2, this.y + this.h/2 + 5);
    }
    ctx.globalAlpha = 1;
  }
}

function shadeColor(c, p) {
  const n = parseInt(c.slice(1), 16);
  let r = (n >> 16) + p;
  let g = ((n >> 8) & 0xff) + p;
  let b = (n & 0xff) + p;
  r = clamp(r, 0, 255); g = clamp(g, 0, 255); b = clamp(b, 0, 255);
  return '#' + (r<<16 | g<<8 | b).toString(16).padStart(6, '0');
}

function lerpColor(c1, c2, t) {
  const a = parseInt(c1.slice(1), 16);
  const b = parseInt(c2.slice(1), 16);
  const r = Math.round(((a>>16)&0xff) + (((b>>16)&0xff) - ((a>>16)&0xff)) * t);
  const g = Math.round(((a>>8)&0xff) + (((b>>8)&0xff) - ((a>>8)&0xff)) * t);
  const bl = Math.round((a&0xff) + ((b&0xff) - (a&0xff)) * t);
  return '#' + (r<<16 | g<<8 | bl).toString(16).padStart(6, '0');
}

// ===================== POWERUP =====================
const P_TYPES = ['wide', 'shield', 'multi', 'shrink', 'pierce', 'magnet'];
class Powerup {
  constructor(x, y, type) {
    this.x = x; this.y = y; this.vy = 140;
    this.r = 14;
    this.type = type;
    this.dead = false;
    this.rot = 0;
  }
  update(dt) {
    this.y += this.vy * dt;
    this.rot += dt * 2;
    if (this.y > H + 40) this.dead = true;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -this.r);
    for (let i = 1; i < 6; i++) {
      const a = i * Math.PI * 2 / 5 - Math.PI/2;
      ctx.lineTo(Math.cos(a) * this.r, Math.sin(a) * this.r);
    }
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Orbitron';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 0;
    ctx.fillText(this.type[0].toUpperCase(), 0, 4);
    ctx.restore();
  }
}

// ===================== LEVELS =====================
const LEVELS = [
  { name: 'POLAR PRIMER', brickW: 70, brickH: 22, cols: 12, rows: 5,
    pattern: (r,c) => 'std', pattern2: null, obstacleCount: 0 },
  { name: 'OPPOSITE ATTRACTION', brickW: 64, brickH: 22, cols: 13, rows: 6,
    pattern: (r,c) => (r+c)%2===0 ? 'mag' : 'std', obstacleCount: 0 },
  { name: 'IRON CURTAIN', brickW: 60, brickH: 22, cols: 14, rows: 7,
    pattern: (r,c) => r === 3 ? 'reinf' : 'std', obstacleCount: 1 },
  { name: 'DOUBLE HELIX', brickW: 56, brickH: 22, cols: 14, rows: 8,
    pattern: (r,c) => Math.abs(r-c%4)===0 ? 'reinf' : 'std', obstacleCount: 2 },
  { name: 'STORM SURGE', brickW: 52, brickH: 22, cols: 14, rows: 9,
    pattern: (r,c) => (r*3+c*2)%5===0 ? 'mag' : ((r+c)%3===0?'reinf':'std'), obstacleCount: 3 },
  { name: 'FORCE FIELD', brickW: 50, brickH: 22, cols: 14, rows: 10,
    pattern: (r,c) => 'std', obstacleCount: 5 },
  { name: 'MAGNETIC CORE', brickW: 48, brickH: 22, cols: 14, rows: 10,
    pattern: (r,c) => ((r*r + c*c) % 7 < 2) ? 'mag' : 'std', obstacleCount: 4 },
  { name: 'FINAL POLARITY', brickW: 46, brickH: 22, cols: 14, rows: 11,
    pattern: (r,c) => (r<2||r>9||c<2||c>11) ? 'std' : ((r+c)%3===0?'reinf':((r*c)%5===0?'mag':'std')),
    obstacleCount: 6 }
];

function buildLevel(idx) {
  const lvl = LEVELS[idx % LEVELS.length];
  const bricks = [];
  const obstacles = [];
  const startX = (W - lvl.cols * lvl.brickW) / 2;
  const startY = 80;
  for (let r = 0; r < lvl.rows; r++) {
    for (let c = 0; c < lvl.cols; c++) {
      const x = startX + c * lvl.brickW;
      const y = startY + r * (lvl.brickH + 4);
      const t = lvl.pattern(r, c);
      if (t) bricks.push(new Brick(x, y, lvl.brickW, lvl.brickH, t));
    }
  }
  for (let i = 0; i < lvl.obstacleCount; i++) {
    const ox = rand(120, W - 120);
    const oy = rand(180, H - 200);
    obstacles.push({
      x: ox, y: oy,
      polarity: i % 2 === 0 ? 1 : -1,
      range: 90
    });
  }
  return { bricks, obstacles, name: lvl.name };
}

// ===================== GAME =====================
class Game {
  constructor() {
    this.canvas = document.getElementById('c');
    this.ctx = this.canvas.getContext('2d');
    this.input = new Input(this.canvas);
    this.particles = new ParticlePool(300);
    this.state = 'menu';
    this.level = 0;
    this.score = 0;
    this.lives = 3;
    this.combo = 1;
    this.comboTimer = 0;
    this.curvatureAcc = 0;
    this.noFlip = true;
    this.levelStart = 0;
    this.elapsed = 0;
    this.levelTime = 0;
    this.bricks = [];
    this.obstacles = [];
    this.powerups = [];
    this.ball = new Ball();
    this.paddle = new Paddle();
    this.pierceTime = 0;
    this.magnetTime = 0;
    this.multiBalls = [];
    this.loadScores();
    this.setupUI();
    this.lastT = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }
  setupUI() {
    document.getElementById('playBtn').onclick = () => { audio.init(); this.startGame(); };
    document.getElementById('helpBtn').onclick = () => this.showOverlay('help');
    document.getElementById('hsBtn').onclick = () => { this.renderScores(); this.showOverlay('hs'); };
    document.getElementById('backBtn').onclick = () => this.showOverlay('menu');
    document.getElementById('hsBackBtn').onclick = () => this.showOverlay('menu');
    document.getElementById('resumeBtn').onclick = () => this.resume();
    document.getElementById('restartBtn').onclick = () => { this.startGame(); };
    document.getElementById('quitBtn').onclick = () => { this.quitToMenu(); };
    document.getElementById('nextBtn').onclick = () => { this.nextLevel(); };
    document.getElementById('retryBtn').onclick = () => { this.startGame(); };
    document.getElementById('menuBtn').onclick = () => { this.quitToMenu(); };
  }
  showOverlay(id) {
    document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    if (id === 'menu') this.state = 'menu';
  }
  startGame() {
    this.level = 0;
    this.score = 0;
    this.lives = 3;
    this.loadLevel();
    document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
    this.state = 'play';
  }
  loadLevel() {
    const built = buildLevel(this.level);
    this.bricks = built.bricks;
    this.obstacles = built.obstacles;
    this.levelName = built.name;
    this.powerups.length = 0;
    this.multiBalls.length = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.curvatureAcc = 0;
    this.noFlip = true;
    this.pierceTime = 0;
    this.magnetTime = 0;
    this.paddle.reset();
    this.paddle.wideTime = 0;
    this.paddle.shieldTime = 0;
    this.ball.attach(this.paddle);
    this.levelStart = performance.now();
    this.levelTime = 0;
  }
  resume() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
    this.state = 'play';
  }
  quitToMenu() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
    document.getElementById('menu').classList.remove('hidden');
    this.state = 'menu';
  }
  nextLevel() {
    this.level++;
    if (this.level >= LEVELS.length) {
      this.gameOver(true);
      return;
    }
    this.loadLevel();
    document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
    this.state = 'play';
  }
  loseBall() {
    audio.lose();
    this.particles.burst(this.ball.x, this.ball.y, this.ball.polarity>0?COL_N:COL_S, 16, 280);
    this.lives--;
    if (this.lives <= 0) { this.gameOver(false); return; }
    this.paddle.reset();
    this.ball.attach(this.paddle);
  }
  gameOver(won) {
    this.state = 'over';
    audio.win();
    this.saveScore(won);
    document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
    document.getElementById('gameOver').classList.remove('hidden');
    document.getElementById('goStats').innerHTML =
      `<div>Final Score: <b>${this.score}</b></div>
       <div>Level Reached: <b>${Math.min(this.level+1, LEVELS.length)}</b></div>
       <div>Status: <b style="color:${won?'var(--north)':'var(--south)'}">${won?'CHAMPION':'TRY AGAIN'}</b></div>`;
  }
  levelComplete() {
    this.state = 'lc';
    audio.win();
    const bonus = Math.round(1000 + 500 * (1 - Math.min(this.levelTime, 60) / 60));
    const style = this.noFlip ? 500 : 0;
    const totalBonus = bonus + style;
    this.score += totalBonus;
    document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
    document.getElementById('levelComplete').classList.remove('hidden');
    document.getElementById('lcTitle').textContent = this.level >= LEVELS.length - 1 ? '🏆 VICTORY!' : 'LEVEL COMPLETE';
    document.getElementById('lcStats').innerHTML =
      `<div>Time: <b>${this.levelTime.toFixed(1)}s</b> (Bonus: ${bonus})</div>
       <div>Style Bonus: <b>${style}</b> ${this.noFlip?'(No flip!)':''}</div>
       <div>Total Bonus: <b>+${totalBonus}</b></div>
       <div>Score: <b>${this.score}</b></div>`;
  }
  saveScore(won) {
    const entry = { score: this.score, level: this.level+1, won: won, date: Date.now() };
    let scores = [];
    try { scores = JSON.parse(localStorage.getItem(SCORE_KEY) || '[]'); } catch(e) {}
    scores.push(entry);
    scores.sort((a,b) => b.score - a.score);
    scores = scores.slice(0, 10);
    try { localStorage.setItem(SCORE_KEY, JSON.stringify(scores)); } catch(e) {}
  }
  loadScores() {
    let scores = [];
    try { scores = JSON.parse(localStorage.getItem(SCORE_KEY) || '[]'); } catch(e) {}
    this.scores = scores;
  }
  renderScores() {
    const el = document.getElementById('hsList');
    if (!this.scores.length) { el.innerHTML = '<div style="color:#aaa">No scores yet!</div>'; return; }
    el.innerHTML = this.scores.map((s,i) =>
      `<div>${i+1}. <b>${s.score}</b> — L${s.level} ${s.won?'🏆':''}</div>`
    ).join('');
  }
  togglePause() {
    if (this.state !== 'play' && this.state !== 'pause') return;
    if (this.state === 'play') {
      this.state = 'pause';
      document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden'));
      document.getElementById('pause').classList.remove('hidden');
    } else {
      this.resume();
    }
  }
  // ===================== MAIN LOOP =====================
  loop(t) {
    const dt = Math.min((t - this.lastT) / 1000, 0.05);
    this.lastT = t;
    if (this.state === 'play') this.update(dt);
    this.render(dt);
    requestAnimationFrame(tt => this.loop(tt));
  }
  update(dt) {
    this.elapsed += dt;
    if (this.state === 'play') this.levelTime += dt;

    // Input - global keys
    if (this.input.consumeSpace()) {
      if (this.ball.stuck) { this.ball.launch(); }
      else { this.paddle.switchPolarity(); this.noFlip = false; }
    }
    if (this.input.consumeClick()) {
      if (this.ball.stuck) this.ball.launch();
    }
    if (this.input.consumeRight()) {
      this.paddle.switchPolarity(); this.noFlip = false;
    }
    if (this.input.keys['KeyQ']) {
      this.ball.polarity = 1;
      this.paddle.setPolarity(1);
    }
    if (this.input.keys['KeyE']) {
      this.ball.polarity = -1;
      this.paddle.setPolarity(-1);
    }
    if (this.input.keys['KeyP'] || this.input.keys['Escape']) { this.togglePause(); }

    this.paddle.update(dt, this.input);

    // Ball stuck? follow paddle
    if (this.ball.stuck) {
      this.ball.update(dt, this.paddle, this.obstacles);
    } else {
      this.ball.update(dt, this.paddle, this.obstacles);
      // Track curvature
      const speed = Math.hypot(this.ball.vx, this.ball.vy);
      if (speed > 0) {
        const nx = this.ball.vx / speed, ny = this.ball.vy / speed;
        if (this._lastDir) {
          const dot = nx*this._lastDir.x + ny*this._lastDir.y;
          const ang = Math.acos(clamp(dot, -1, 1));
          this.curvatureAcc += ang;
        }
        this._lastDir = { x: nx, y: ny };
      }
      // Combo detection
      if (this.curvatureAcc > COMBO_THRESHOLD) {
        this.comboTimer += dt;
        if (this.comboTimer >= COMBO_TIME / 1000) {
          if (this.combo < 5) {
            this.combo++;
            audio.combo(this.combo);
            this.particles.burst(this.ball.x, this.ball.y, COL_N, 8, 200);
          }
          this.comboTimer = 0;
          this.curvatureAcc = 0;
        }
      } else {
        this.comboTimer = Math.max(0, this.comboTimer - dt*2);
      }
    }

    if (this.ball.dead) { this.loseBall(); return; }

    // Multi balls
    for (let i = this.multiBalls.length - 1; i >= 0; i--) {
      const mb = this.multiBalls[i];
      mb.update(dt, this.paddle, this.obstacles);
      mb.dead = mb.dead || mb.y - BALL_R > H;
      if (mb.dead) this.multiBalls.splice(i, 1);
    }

    // Bricks
    const allBalls = [this.ball, ...this.multiBalls];
    for (const ball of allBalls) {
      if (ball.stuck) continue;
      for (const brick of this.bricks) {
        if (brick.dead) continue;
        if (ball.x + BALL_R > brick.x && ball.x - BALL_R < brick.x + brick.w &&
            ball.y + BALL_R > brick.y && ball.y - BALL_R < brick.y + brick.h) {
          const wasReinf = brick.type === 'reinf';
          const dead = brick.hit();
          if (dead) {
            let pts = 50;
            if (brick.type === 'reinf') pts = 200;
            if (brick.type === 'mag') pts = 100;
            this.score += pts * this.combo;
            audio.brick();
            this.particles.burst(brick.x+brick.w/2, brick.y+brick.h/2, '#fff', 8, 240);
            // Drop powerup
            if (Math.random() < DROP_CHANCE) {
              this.powerups.push(new Powerup(brick.x+brick.w/2, brick.y+brick.h/2, P_TYPES[randInt(0, P_TYPES.length-1)]));
              audio.powerup();
            }
          } else {
            audio.reinforced();
            this.particles.burst(brick.x+brick.w/2, brick.y+brick.h/2, '#ffaa00', 4, 160);
          }
          // Bounce
          if (this.pierceTime <= 0) {
            const dx = ball.x - (brick.x + brick.w/2);
            const dy = ball.y - (brick.y + brick.h/2);
            if (Math.abs(dx/(brick.w/2)) > Math.abs(dy/(brick.h/2))) {
              ball.vx = Math.sign(ball.vx || 1) * Math.abs(ball.vx);
            } else {
              ball.vy = Math.abs(ball.vy);
            }
          }
        }
      }
    }
    // Cleanup bricks
    for (const brick of this.bricks) brick.update(dt);

    // Powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.update(dt);
      const pw = this.paddle.currentWidth();
      if (Math.abs(p.x - this.paddle.x) < pw/2 + p.r && Math.abs(p.y - this.paddle.y) < this.paddle.h/2 + p.r) {
        this.applyPowerup(p.type);
        p.dead = true;
      }
      if (p.dead) this.powerups.splice(i, 1);
    }

    // Obstacle visual rings
    for (const o of this.obstacles) {
      o.t = (o.t || 0) + dt;
    }

    // Particles
    this.particles.update(dt);

    // Audio hum
    const dx = this.ball.x - this.paddle.x;
    const dy = this.ball.y - this.paddle.y;
    audio.updateHum(Math.hypot(dx, dy));

    // Check level complete
    if (this.bricks.every(b => b.dead)) {
      this.levelComplete();
    }
  }
  applyPowerup(type) {
    audio.powerup();
    if (type === 'wide') this.paddle.wideTime = 12;
    if (type === 'shield') this.paddle.shieldTime = 12;
    if (type === 'multi') {
      for (let i = 0; i < 2; i++) {
        const b = new Ball();
        b.x = this.ball.x; b.y = this.ball.y;
        const a = rand(-Math.PI/3, -Math.PI*2/3) + (i-0.5)*0.4;
        b.vx = Math.cos(a) * b.speed; b.vy = Math.sin(a) * b.speed;
        b.polarity = this.ball.polarity;
        b.stuck = false;
        this.multiBalls.push(b);
      }
    }
    if (type === 'shrink') {
      this.obstacles.forEach(o => o.range = Math.max(40, o.range - 30));
    }
    if (type === 'pierce') this.pierceTime = 8;
    if (type === 'magnet') this.magnetTime = 10;
  }
  // ===================== RENDER =====================
  render(dt) {
    const ctx = this.ctx;
    ctx.fillStyle = COL_BG;
    ctx.fillRect(0, 0, W, H);

    if (this.state === 'menu') { this.renderMenuBg(ctx); return; }

    // Grid
    ctx.strokeStyle = 'rgba(0,240,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Obstacles
    for (const o of this.obstacles) {
      const c = o.polarity > 0 ? COL_N : COL_S;
      ctx.save();
      const pulse = 1 + Math.sin((o.t||0) * 2) * 0.1;
      ctx.translate(o.x, o.y);
      ctx.scale(pulse, pulse);
      ctx.shadowColor = c; ctx.shadowBlur = 18;
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(0, -16); ctx.lineTo(13, -6); ctx.lineTo(13, 6); ctx.lineTo(0, 16);
      ctx.lineTo(-13, 6); ctx.lineTo(-13, -6); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Orbitron';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.fillText(o.polarity > 0 ? 'N' : 'S', 0, 4);
      // Range ring
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = c;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, o.range, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Bricks
    for (const brick of this.bricks) if (!brick.dead) brick.draw(ctx);

    // Powerups
    for (const p of this.powerups) p.draw(ctx);

    // Paddle
    this.paddle.draw(ctx);

    // Multi balls
    for (const mb of this.multiBalls) mb.draw(ctx);

    // Ball
    this.ball.draw(ctx);

    // Particles
    this.particles.draw(ctx);

    // Shield
    if (this.paddle.shieldTime > 0) {
      ctx.save();
      const a = this.paddle.shieldTime / 12 * 0.3;
      ctx.globalAlpha = a;
      ctx.strokeStyle = COL_N;
      ctx.lineWidth = 3;
      ctx.shadowColor = COL_N; ctx.shadowBlur = 20;
      const w = this.paddle.currentWidth();
      ctx.beginPath();
      ctx.ellipse(this.paddle.x, this.paddle.y, w/2 + 12, this.paddle.h + 16, 0, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }

    // Pierce indicator
    if (this.pierceTime > 0) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Orbitron';
      ctx.textAlign = 'left';
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 12;
      ctx.fillText(`⚡ PIERCE ${this.pierceTime.toFixed(1)}s`, 12, H - 12);
      ctx.restore();
    }

    // HUD
    this.renderHUD(ctx);
  }
  renderMenuBg(ctx) {
    ctx.fillStyle = COL_BG;
    ctx.fillRect(0, 0, W, H);
    const t = this.elapsed;
    // Floating orbs
    for (let i = 0; i < 12; i++) {
      const x = (W/2) + Math.cos(t*0.3 + i)*300;
      const y = (H/2) + Math.sin(t*0.4 + i*0.7)*200;
      const c = i % 2 === 0 ? COL_N : COL_S;
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.3;
      ctx.shadowColor = c; ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(x, y, 6 + (i%3)*2, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  renderHUD(ctx) {
    ctx.save();
    ctx.fillStyle = '#000a';
    ctx.fillRect(0, 0, W, 48);
    ctx.strokeStyle = 'rgba(0,240,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 48); ctx.lineTo(W, 48); ctx.stroke();

    ctx.font = 'bold 16px Orbitron';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 4;

    // Level
    ctx.textAlign = 'left';
    ctx.fillStyle = COL_N;
    ctx.fillText(`LVL ${this.level+1}`, 16, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '11px Orbitron';
    ctx.fillText(this.levelName, 16, 44);

    // Score
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Orbitron';
    ctx.fillText(`${this.score}`, W/2, 30);

    // Combo
    if (this.combo > 1) {
      ctx.font = 'bold 12px Orbitron';
      ctx.fillStyle = COL_N;
      ctx.fillText(`x${this.combo} COMBO`, W/2, 44);
    }

    // Lives
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px Orbitron';
    ctx.fillStyle = COL_S;
    ctx.fillText(`♥ ${'♥'.repeat(this.lives)}`, W - 16, 30);

    // Polarity indicator
    ctx.font = '11px Orbitron';
    ctx.fillStyle = this.paddle.polarity > 0 ? COL_N : COL_S;
    ctx.fillText(`POLARITY: ${this.paddle.polarity > 0 ? 'NORTH (+)' : 'SOUTH (−)'}`, W - 16, 44);

    // Time
    if (this.state === 'play' || this.state === 'pause') {
      ctx.textAlign = 'right';
      ctx.font = '10px Orbitron';
      ctx.fillStyle = '#888';
      ctx.fillText(`${this.levelTime.toFixed(1)}s`, W/2 - 90, 30);
    }

    ctx.restore();
  }
}

window.addEventListener('load', () => {
  new Game();
});

})();
