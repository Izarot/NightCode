/*
 * Gravity Shift Match-Three - Complete Implementation
 * Single-file ES6 module architecture
 */

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================
const CONFIG = {
  canvas: { width: 1280, height: 720 },
  board: { cols: 8, rows: 8, tileSize: 64 },
  physics: { gravity: 1200, friction: 0.8, stepTime: 0.1 },
  colors: [
    '#ff3366', // 0 - vibrant pink
    '#00f3ff', // 1 - cyan
    '#bc13fe', // 2 - purple
    '#ffcc00', // 3 - gold
    '#00ff88', // 4 - neon green
    '#ff6600'  // 5 - orange
  ],
  tileTypes: 6,
  matchMin: 3,
  comboTimeout: 5000,
  rotationDuration: 300,
  levels: 30
};

const GRAVITY_DIRS = [
  { x: 0, y: 1, name: 'down', icon: '⬇' },
  { x: 1, y: 0, name: 'right', icon: '➡' },
  { x: 0, y: -1, name: 'up', icon: '⬆' },
  { x: -1, y: 0, name: 'left', icon: '⬅' }
];

// ============================================
// UTILITY CLASSES
// ============================================
class Vec2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  copy() { return new Vec2(this.x, this.y); }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  mul(s) { this.x *= s; this.y *= s; return this; }
  len() { return Math.hypot(this.x, this.y); }
  normalize() { const l = this.len(); if (l) { this.x /= l; this.y /= l; } return this; }
  rotate90(cw = true) { const { x, y } = this; this.x = cw ? y : -y; this.y = cw ? -x : x; return this; }
  equals(v) { return this.x === v.x && this.y === v.y; }
}

class Timer {
  constructor() { this.startTime = performance.now(); this.paused = false; this.pauseStart = 0; this.totalPaused = 0; }
  getElapsed() { if (this.paused) return this.pauseStart - this.startTime - this.totalPaused; return performance.now() - this.startTime - this.totalPaused; }
  pause() { if (!this.paused) { this.paused = true; this.pauseStart = performance.now(); } }
  resume() { if (this.paused) { this.paused = false; this.totalPaused += performance.now() - this.pauseStart; } }
  reset() { this.startTime = performance.now(); this.totalPaused = 0; this.paused = false; }
  format(ms) { const t = Math.floor(ms / 1000); const m = String(Math.floor(t / 60)).padStart(2, '0'); const s = String(t % 60).padStart(2, '0'); const cs = String(Math.floor((ms % 1000) / 10)).padStart(2, '0'); return `${m}:${s}.${cs}`; }
}

// ============================================
// AUDIO ENGINE (Web Audio API)
// ============================================
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.buffers = {};
    this.masterGain = null;
    this.init();
  }
  async init() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.5;
    this.createSyntheticSounds();
  }
  createSyntheticSounds() {
    // Match sound - pleasant chime
    this.buffers.match = this.createTone(523.25, 0.15, 'sine', 0.3);
    this.buffers.match2 = this.createTone(659.25, 0.15, 'sine', 0.3);
    this.buffers.match3 = this.createTone(783.99, 0.15, 'sine', 0.3);
    // Rotation sound - whoosh
    this.buffers.rotate = this.createNoise(0.3, 200, 2000);
    // Move sound - soft click
    this.buffers.move = this.createTone(800, 0.05, 'square', 0.15);
    // Level complete
    this.buffers.levelup = this.createArpeggio([523.25, 659.25, 783.99, 1046.5], 0.1);
    // Game over
    this.buffers.gameover = this.createTone(200, 0.5, 'sawtooth', 0.4);
  }
  createTone(freq, dur, type, vol) {
    const sr = this.ctx.sampleRate;
    const len = sr * dur;
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const env = Math.exp(-t * 8);
      let sample = 0;
      if (type === 'sine') sample = Math.sin(2 * Math.PI * freq * t);
      else if (type === 'square') sample = Math.sin(2 * Math.PI * freq * t) > 0 ? 1 : -1;
      else if (type === 'sawtooth') sample = 2 * (t * freq - Math.floor(t * freq + 0.5));
      data[i] = sample * env * vol;
    }
    return buf;
  }
  createNoise(dur, lowFreq, highFreq) {
    const sr = this.ctx.sampleRate;
    const len = sr * dur;
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const freq = lowFreq + (highFreq - lowFreq) * t;
      const env = Math.sin(Math.PI * t) * (1 - t);
      data[i] = (Math.random() * 2 - 1) * env * 0.2;
    }
    return buf;
  }
  createArpeggio(freqs, noteDur) {
    const sr = this.ctx.sampleRate;
    const totalDur = freqs.length * noteDur;
    const len = sr * totalDur;
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const noteIdx = Math.floor(t / noteDur);
      if (noteIdx >= freqs.length) break;
      const noteT = t - noteIdx * noteDur;
      const env = Math.exp(-noteT * 10);
      data[i] = Math.sin(2 * Math.PI * freqs[noteIdx] * noteT) * env * 0.25;
    }
    return buf;
  }
  play(name, volume = 1, rate = 1) {
    if (!this.ctx || !this.buffers[name]) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers[name];
    src.playbackRate.value = rate;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(this.masterGain);
    src.start();
  }
  setVolume(v) { if (this.masterGain) this.masterGain.gain.value = v; }
}

// ============================================
// TILE CLASS
// ============================================
class Tile {
  constructor(type, col, row) {
    this.type = type;
    this.col = col;
    this.row = row;
    this.targetCol = col;
    this.targetRow = row;
    this.falling = false;
    this.matched = false;
    this.scale = 1;
    this.glow = 0;
    this.particles = [];
  }
  getColor() { return CONFIG.colors[this.type % CONFIG.colors.length]; }
  update(dt) {
    // Smooth movement to target
    const speed = 15;
    this.col += (this.targetCol - this.col) * speed * dt;
    this.row += (this.targetRow - this.row) * speed * dt;
    // Glow pulse
    if (this.glow > 0) this.glow = Math.max(0, this.glow - dt * 3);
    // Particles
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = p.life / p.maxLife;
    });
  }
  addParticles(count, color) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.col + 0.5,
        y: this.row + 0.5,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        alpha: 1,
        size: 2 + Math.random() * 4,
        color
      });
    }
  }
}

// ============================================
// BOARD CLASS
// ============================================
class Board {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.grid = [];
    this.selected = null;
    this.cascading = false;
    this.comboCount = 0;
    this.lastMatchTime = 0;
    this.init();
  }
  init() {
    this.grid = [];
    for (let c = 0; c < this.cols; c++) {
      this.grid[c] = [];
      for (let r = 0; r < this.rows; r++) {
        this.grid[c][r] = new Tile(Math.floor(Math.random() * CONFIG.tileTypes), c, r);
      }
    }
    // Ensure no initial matches
    while (this.findMatches().length > 0) {
      this.randomize();
    }
  }
  randomize() {
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        this.grid[c][r].type = Math.floor(Math.random() * CONFIG.tileTypes);
      }
    }
  }
  getTile(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return null;
    return this.grid[col][row];
  }
  setTile(col, row, tile) {
    if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
      this.grid[col][row] = tile;
      if (tile) { tile.col = col; tile.row = row; }
    }
  }
  swap(c1, r1, c2, r2) {
    const t1 = this.getTile(c1, r1);
    const t2 = this.getTile(c2, r2);
    if (!t1 || !t2) return false;
    this.grid[c1][r1] = t2;
    this.grid[c2][r2] = t1;
    t1.targetCol = c2; t1.targetRow = r2;
    t2.targetCol = c1; t2.targetRow = r1;
    return true;
  }
  findMatches() {
    const matches = [];
    const checked = new Set();
    // Horizontal
    for (let r = 0; r < this.rows; r++) {
      let count = 1;
      for (let c = 1; c < this.cols; c++) {
        const t1 = this.getTile(c - 1, r);
        const t2 = this.getTile(c, r);
        if (t1 && t2 && t1.type === t2.type && !t1.matched && !t2.matched) {
          count++;
        } else {
          if (count >= CONFIG.matchMin) {
            for (let k = 0; k < count; k++) {
              const key = `${c - 1 - k},${r}`;
              if (!checked.has(key)) {
                matches.push(this.getTile(c - 1 - k, r));
                checked.add(key);
              }
            }
          }
          count = 1;
        }
      }
      if (count >= CONFIG.matchMin) {
        for (let k = 0; k < count; k++) {
          const key = `${this.cols - 1 - k},${r}`;
          if (!checked.has(key)) {
            matches.push(this.getTile(this.cols - 1 - k, r));
            checked.add(key);
          }
        }
      }
    }
    // Vertical
    for (let c = 0; c < this.cols; c++) {
      let count = 1;
      for (let r = 1; r < this.rows; r++) {
        const t1 = this.getTile(c, r - 1);
        const t2 = this.getTile(c, r);
        if (t1 && t2 && t1.type === t2.type && !t1.matched && !t2.matched) {
          count++;
        } else {
          if (count >= CONFIG.matchMin) {
            for (let k = 0; k < count; k++) {
              const key = `${c},${r - 1 - k}`;
              if (!checked.has(key)) {
                matches.push(this.getTile(c, r - 1 - k));
                checked.add(key);
              }
            }
          }
          count = 1;
        }
      }
      if (count >= CONFIG.matchMin) {
        for (let k = 0; k < count; k++) {
          const key = `${c},${this.rows - 1 - k}`;
          if (!checked.has(key)) {
            matches.push(this.getTile(c, this.rows - 1 - k));
            checked.add(key);
          }
        }
      }
    }
    return matches;
  }
  removeMatches(matches) {
    matches.forEach(t => {
      t.matched = true;
      t.glow = 1;
      t.addParticles(8, t.getColor());
      this.setTile(t.col | 0, t.row | 0, null);
    });
  }
  applyGravity(gravityDir) {
    const { x: gx, y: gy } = gravityDir;
    let moved = false;
    // Determine iteration order based on gravity
    const cols = gx === 1 ? [...Array(this.cols).keys()].reverse() : [...Array(this.cols).keys()];
    const rows = gy === 1 ? [...Array(this.rows).keys()].reverse() : [...Array(this.rows).keys()];
    for (const c of cols) {
      for (const r of rows) {
        const tile = this.getTile(c, r);
        if (!tile) continue;
        let nc = c, nr = r;
        while (true) {
          const nextC = nc + gx;
          const nextR = nr + gy;
          if (nextC < 0 || nextC >= this.cols || nextR < 0 || nextR >= this.rows) break;
          if (this.getTile(nextC, nextR)) break;
          nc = nextC; nr = nextR;
        }
        if (nc !== c || nr !== r) {
          this.setTile(nc, nr, tile);
          this.setTile(c, r, null);
          tile.targetCol = nc;
          tile.targetRow = nr;
          tile.falling = true;
          moved = true;
        } else {
          tile.falling = false;
        }
      }
    }
    // Spawn new tiles at opposite edge
    const spawnEdge = { x: -gx, y: -gy };
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        if (!this.getTile(c, r)) {
          // Find spawn position
          let sc = c, sr = r;
          while (sc >= 0 && sc < this.cols && sr >= 0 && sr < this.rows) {
            sc -= gx; sr -= gy;
          }
          sc += gx; sr += gy;
          const newTile = new Tile(Math.floor(Math.random() * CONFIG.tileTypes), sc, sr);
          newTile.targetCol = c; newTile.targetRow = r;
          newTile.falling = true;
          newTile.scale = 0;
          this.setTile(c, r, newTile);
          moved = true;
        }
      }
    }
    return moved;
  }
  update(dt) {
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const t = this.getTile(c, r);
        if (t) t.update(dt);
      }
    }
    // Scale in new tiles
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const t = this.getTile(c, r);
        if (t && t.scale < 1) t.scale = Math.min(1, t.scale + dt * 5);
      }
    }
  }
  isSettled() {
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        const t = this.getTile(c, r);
        if (t && (t.falling || Math.abs(t.col - t.targetCol) > 0.05 || Math.abs(t.row - t.targetRow) > 0.05)) return false;
      }
    }
    return true;
  }
  getTileAtScreenPos(x, y, boardOffset, tileSize) {
    const c = Math.floor((x - boardOffset.x) / tileSize);
    const r = Math.floor((y - boardOffset.y) / tileSize);
    if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) return this.getTile(c, r);
    return null;
  }
}

// ============================================
// PLAYER CLASS
// ============================================
class Player {
  constructor(board) {
    this.board = board;
    this.col = 0;
    this.row = 0;
    this.targetCol = 0;
    this.targetRow = 0;
    this.velocity = new Vec2();
    this.animFrame = 0;
    this.animTimer = 0;
    this.facing = 0; // 0:down, 1:right, 2:up, 3:left
    this.moveCooldown = 0;
  }
  setPosition(col, row) {
    this.col = col;
    this.row = row;
    this.targetCol = col;
    this.targetRow = row;
  }
  tryMove(dir, gravityDir) {
    if (this.moveCooldown > 0) return false;
    const gc = gravityDir;
    // Transform input direction by gravity rotation
    // Input is screen-relative, but movement is world-relative
    // For simplicity: arrow keys move in screen directions, but physics applies gravity
    let dc = 0, dr = 0;
    switch (dir) {
      case 'up': dr = -1; break;
      case 'down': dr = 1; break;
      case 'left': dc = -1; break;
      case 'right': dc = 1; break;
    }
    const nc = this.col + dc;
    const nr = this.row + dr;
    if (nc < 0 || nc >= this.board.cols || nr < 0 || nr >= this.board.rows) return false;
    const targetTile = this.board.getTile(nc, nr);
    if (targetTile && targetTile.falling) return false; // Can't move into falling tile
    this.targetCol = nc;
    this.targetRow = nr;
    this.velocity.x += gc.x * CONFIG.physics.gravity * CONFIG.physics.stepTime;
    this.velocity.y += gc.y * CONFIG.physics.gravity * CONFIG.physics.stepTime;
    this.moveCooldown = 0.15;
    this.facing = dir === 'up' ? 2 : dir === 'down' ? 0 : dir === 'left' ? 3 : 1;
    return true;
  }
  update(dt, gravityDir) {
    this.moveCooldown = Math.max(0, this.moveCooldown - dt);
    // Smooth movement
    const speed = 12;
    this.col += (this.targetCol - this.col) * speed * dt;
    this.row += (this.targetRow - this.row) * speed * dt;
    // Apply gravity to velocity
    this.velocity.x += gravityDir.x * CONFIG.physics.gravity * dt;
    this.velocity.y += gravityDir.y * CONFIG.physics.gravity * dt;
    // Friction
    this.velocity.mul(CONFIG.physics.friction);
    // Animation
    this.animTimer += dt;
    if (this.animTimer > 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
  }
  draw(ctx, boardOffset, tileSize) {
    const x = boardOffset.x + (this.col + 0.5) * tileSize;
    const y = boardOffset.y + (this.row + 0.5) * tileSize;
    const size = tileSize * 0.75;
    ctx.save();
    ctx.translate(x, y);
    // Rotate sprite to face movement direction
    const rot = this.facing * Math.PI / 2;
    ctx.rotate(rot);
    // Body
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.5);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(1, '#00f3ff');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.5, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = '#0d0d1a';
    const eyeOffset = size * 0.15;
    ctx.beginPath();
    ctx.arc(-eyeOffset, -eyeOffset, size * 0.08, 0, Math.PI * 2);
    ctx.arc(eyeOffset, -eyeOffset, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    // Glow
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.5, size * 0.35, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// ============================================
// PARTICLE SYSTEM
// ============================================
class ParticleSystem {
  constructor() { this.particles = []; }
  addBurst(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 200;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        size: 3 + Math.random() * 5,
        color,
        gravity: 200
      });
    }
  }
  addRotationSwirl(centerX, centerY, radius, color) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = radius * (0.5 + Math.random() * 0.5);
      this.particles.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        vx: -Math.sin(angle) * (50 + Math.random() * 100),
        vy: Math.cos(angle) * (50 + Math.random() * 100),
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6,
        size: 2 + Math.random() * 4,
        color,
        gravity: 0
      });
    }
  }
  update(dt) {
    this.particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        p.life -= dt;
      });
    this.particles = this.particles.filter(p => p.life > 0);
  }
  draw(ctx) {
    this.particles.forEach(p => {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
}

// ============================================
// MAIN GAME CLASS
// ============================================
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.board = new Board(CONFIG.board.cols, CONFIG.board.rows);
    this.player = new Player(this.board);
    this.particles = new ParticleSystem();
    this.audio = new AudioEngine();
    this.timer = new Timer();
    this.gravityIndex = 0;
    this.gravityDir = GRAVITY_DIRS[this.gravityIndex];
    this.rotating = false;
    this.rotationProgress = 0;
    this.rotationStart = 0;
    this.score = 0;
    this.level = 1;
    this.targetScore = 1000;
    this.paused = false;
    this.gameOver = false;
    this.lastTime = 0;
    this.comboTimer = 0;
    this.shakeIntensity = 0;
    this.init();
  }
  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('keydown', e => this.handleKey(e));
    document.addEventListener('keyup', e => this.handleKeyUp(e));
    this.canvas.addEventListener('click', e => this.handleClick(e));
    this.canvas.addEventListener('touchstart', e => this.handleTouch(e), { passive: false });
    
    document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause());
    document.getElementById('restartBtn').addEventListener('click', () => this.restart());
    document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());
    
    this.player.setPosition(Math.floor(this.board.cols / 2), Math.floor(this.board.rows / 2));
    this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
  }
  resize() {
    const scale = Math.min(window.innerWidth / CONFIG.canvas.width, window.innerHeight / CONFIG.canvas.height);
    this.canvas.width = CONFIG.canvas.width * scale;
    this.canvas.height = CONFIG.canvas.height * scale;
    this.scale = scale;
    this.tileSize = CONFIG.board.tileSize * scale;
    this.boardOffset = {
      x: (this.canvas.width - this.board.cols * this.tileSize) / 2,
      y: (this.canvas.height - this.board.rows * this.tileSize) / 2
    };
  }
  handleKey(e) {
    if (e.key === 'Escape' || e.key === 'p') {
      this.togglePause();
      return;
    }
    if (this.paused || this.gameOver || this.rotating) return;
    
    const dirMap = {
      'ArrowUp': 'up', 'w': 'up', 'W': 'up',
      'ArrowDown': 'down', 's': 'down', 'S': 'down',
      'ArrowLeft': 'left', 'a': 'left', 'A': 'left',
      'ArrowRight': 'right', 'd': 'right', 'D': 'right',
      ' ': 'rotate', 'r': 'rotate', 'R': 'rotate'
    };
    const dir = dirMap[e.key];
    if (dir === 'rotate') {
      this.startRotation();
    } else if (dir) {
      this.player.tryMove(dir, this.gravityDir);
      this.audio.play('move', 0.3);
    }
  }
  handleKeyUp(e) {}
  handleClick(e) {
    if (this.paused || this.gameOver) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / this.scale;
    const y = (e.clientY - rect.top) / this.scale;
    const tile = this.board.getTileAtScreenPos(x, y, this.boardOffset, this.tileSize);
    if (tile) {
      this.board.selected = tile;
    }
  }
  handleTouch(e) {
    e.preventDefault();
    if (this.paused || this.gameOver) return;
    const touch = e.touches[0];
    const rect = this.canvas.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / this.scale;
    const y = (touch.clientY - rect.top) / this.scale;
    const tile = this.board.getTileAtScreenPos(x, y, this.boardOffset, this.tileSize);
    if (tile) this.board.selected = tile;
  }
  togglePause() {
    this.paused = !this.paused;
    document.getElementById('pauseOverlay').classList.toggle('hidden', !this.paused);
    if (this.paused) this.timer.pause(); else this.timer.resume();
  }
  restart() {
    this.board.init();
    this.player.setPosition(Math.floor(this.board.cols / 2), Math.floor(this.board.rows / 2));
    this.score = 0;
    this.level = 1;
    this.targetScore = 1000;
    this.gravityIndex = 0;
    this.gravityDir = GRAVITY_DIRS[this.gravityIndex];
    this.gameOver = false;
    this.timer.reset();
    this.board.comboCount = 0;
    document.getElementById('pauseOverlay').classList.add('hidden');
    this.paused = false;
  }
  showSettings() {
    alert('Settings:\n- Arrow Keys / WASD: Move\n- Space / R: Rotate Gravity\n- ESC / P: Pause\n- Match 3+ tiles to score\n- Reach target score to level up');
  }
  startRotation() {
    if (this.rotating) return;
    this.rotating = true;
    this.rotationStart = performance.now();
    this.audio.play('rotate', 0.5);
    this.shakeIntensity = 10;
    const cx = this.boardOffset.x + this.board.cols * this.tileSize / 2;
    const cy = this.boardOffset.y + this.board.rows * this.tileSize / 2;
    this.particles.addRotationSwirl(cx, cy, Math.max(this.board.cols, this.board.rows) * this.tileSize / 2, '#00f3ff');
  }
  updateRotation(dt) {
    const elapsed = performance.now() - this.rotationStart;
    this.rotationProgress = Math.min(1, elapsed / CONFIG.rotationDuration);
    
    if (this.rotationProgress >= 1) {
      this.gravityIndex = (this.gravityIndex + 1) % GRAVITY_DIRS.length;
      this.gravityDir = GRAVITY_DIRS[this.gravityIndex];
      this.rotating = false;
      this.rotationProgress = 0;
      // Apply gravity immediately after rotation
      this.board.applyGravity(this.gravityDir);
    }
  }
  update(dt) {
    if (this.paused || this.gameOver) return;
    
    this.timer.getElapsed();
    this.player.update(dt, this.gravityDir);
    this.board.update(dt);
    this.particles.update(dt);
    
    if (this.rotating) {
      this.updateRotation(dt);
    } else if (this.board.isSettled()) {
      const matches = this.board.findMatches();
      if (matches.length > 0) {
        this.handleMatches(matches);
      } else {
        // Check combo timeout
        if (this.board.comboCount > 0 && this.timer.getElapsed() - this.board.lastMatchTime > CONFIG.comboTimeout) {
          this.board.comboCount = 0;
        }
        // Player interaction with tile
        if (this.board.selected) {
          const pCol = Math.round(this.player.col);
          const pRow = Math.round(this.player.row);
          const sCol = Math.round(this.board.selected.col);
          const sRow = Math.round(this.board.selected.row);
          const dist = Math.abs(pCol - sCol) + Math.abs(pRow - sRow);
          if (dist === 1) {
            this.board.swap(pCol, pRow, sCol, sRow);
            this.audio.play('move', 0.4);
            // Check if swap creates match
            setTimeout(() => {
              const newMatches = this.board.findMatches();
              if (newMatches.length === 0) {
                // Swap back
                this.board.swap(pCol, pRow, sCol, sRow);
                this.audio.play('move', 0.2);
              }
            }, 150);
          }
          this.board.selected = null;
        }
      }
    }
    
    this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 30);
    
    // Level progression
    if (this.score >= this.targetScore) {
      this.levelUp();
    }
  }
  handleMatches(matches) {
    const matchCount = matches.length;
    this.board.removeMatches(matches);
    
    // Combo system
    const now = this.timer.getElapsed();
    if (now - this.board.lastMatchTime < CONFIG.comboTimeout) {
      this.board.comboCount++;
    } else {
      this.board.comboCount = 1;
    }
    this.board.lastMatchTime = now;
    
    // Score calculation
    const baseScore = matchCount * 100;
    const comboBonus = this.board.comboCount * 50;
    const levelMultiplier = this.level;
    const gained = (baseScore + comboBonus) * levelMultiplier;
    this.score += gained;
    
    // Audio feedback based on combo
    if (this.board.comboCount >= 3) this.audio.play('match3', 0.6);
    else if (this.board.comboCount >= 2) this.audio.play('match2', 0.5);
    else this.audio.play('match', 0.4);
    
    // Screen shake
    this.shakeIntensity = Math.min(15, this.shakeIntensity + matchCount * 2);
    
    // Particles
    matches.forEach(t => {
      const x = this.boardOffset.x + (t.col + 0.5) * this.tileSize;
      const y = this.boardOffset.y + (t.row + 0.5) * this.tileSize;
      this.particles.addBurst(x, y, t.getColor(), 15);
    });
    
    // Apply gravity after matches removed
    setTimeout(() => {
      this.board.applyGravity(this.gravityDir);
    }, 200);
  }
  levelUp() {
    this.level++;
    this.targetScore += 1000 * this.level;
    this.audio.play('levelup', 0.7);
    this.shakeIntensity = 20;
    // Visual feedback
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    this.particles.addBurst(cx, cy, '#ffcc00', 50);
    
    if (this.level > CONFIG.levels) {
      this.victory();
    }
  }
  victory() {
    this.gameOver = true;
    setTimeout(() => {
      alert(`VICTORY!\nCompleted all ${CONFIG.levels} levels!\nFinal Score: ${this.score}\nTime: ${this.timer.format(this.timer.getElapsed())}`);
      this.restart();
    }, 500);
  }
  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Background
    const grad = ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, 0,
      this.canvas.width / 2, this.canvas.height / 2, Math.max(this.canvas.width, this.canvas.height)
    );
    grad.addColorStop(0, '#1a1a3e');
    grad.addColorStop(1, '#0d0d1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Grid lines
    ctx.strokeStyle = '#00f3ff22';
    ctx.lineWidth = 1;
    for (let c = 0; c <= this.board.cols; c++) {
      const x = this.boardOffset.x + c * this.tileSize;
      ctx.beginPath();
      ctx.moveTo(x, this.boardOffset.y);
      ctx.lineTo(x, this.boardOffset.y + this.board.rows * this.tileSize);
      ctx.stroke();
    }
    for (let r = 0; r <= this.board.rows; r++) {
      const y = this.boardOffset.y + r * this.tileSize;
      ctx.beginPath();
      ctx.moveTo(this.boardOffset.x, y);
      ctx.lineTo(this.boardOffset.x + this.board.cols * this.tileSize, y);
      ctx.stroke();
    }
    
    // Screen shake
    const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
    const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    
    // Draw tiles
    for (let c = 0; c < this.board.cols; c++) {
      for (let r = 0; r < this.board.rows; r++) {
        const tile = this.board.getTile(c, r);
        if (!tile) continue;
        
        const x = this.boardOffset.x + (tile.col + 0.5) * this.tileSize;
        const y = this.boardOffset.y + (tile.row + 0.5) * this.tileSize;
        const size = this.tileSize * 0.85 * tile.scale;
        
        ctx.save();
        ctx.translate(x, y);
        
        // Rotation effect during gravity shift
        if (this.rotating) {
          ctx.rotate(this.rotationProgress * Math.PI / 2);
        }
        
        // Tile background
        const tileGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.6);
        tileGrad.addColorStop(0, tile.getColor());
        tileGrad.addColorStop(1, this.darkenColor(tile.getColor(), 0.4));
        ctx.fillStyle = tileGrad;
        
        // Rounded square
        const r = size * 0.45;
        const radius = 8 * this.scale;
        ctx.beginPath();
        ctx.roundRect(-r, -r, r * 2, r * 2, radius);
        ctx.fill();
        
        // Glow effect
        if (tile.glow > 0) {
          ctx.shadowColor = tile.getColor();
          ctx.shadowBlur = 20 * tile.glow;
          ctx.strokeStyle = tile.getColor();
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        
        // Inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.roundRect(-r * 0.8, -r * 0.8, r * 1.6, r * 0.4, radius * 0.5);
        ctx.fill();
        
        // Tile particles
        tile.particles.forEach(p => {
          const px = (p.x - tile.col - 0.5) * this.tileSize;
          const py = (p.y - tile.row - 0.5) * this.tileSize;
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(px, py, p.size * this.scale, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        ctx.restore();
      }
    }
    
    // Draw player
    this.player.draw(ctx, this.boardOffset, this.tileSize);
    
    // Draw particles
    this.particles.draw(ctx);
    
    ctx.restore();
    
    // UI
    this.drawUI(ctx);
  }
  darkenColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 255) * (1 - amount));
    const g = Math.max(0, ((num >> 8) & 255) * (1 - amount));
    const b = Math.max(0, (num & 255) * (1 - amount));
    return `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
  }
  drawUI(ctx) {
    ctx.font = 'bold 24px Segoe UI';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    
    // Score
    ctx.fillText(`SCORE: ${this.score.toLocaleString()}`, 20, 40);
    
    // Level
    ctx.fillText(`LEVEL: ${this.level}`, 20, 75);
    
    // Timer
    ctx.fillText(`TIME: ${this.timer.format(this.timer.getElapsed())}`, 20, 110);
    
    // Combo
    if (this.board.comboCount > 1) {
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 28px Segoe UI';
      ctx.fillText(`COMBO x${this.board.comboCount}!`, 20, 150);
    }
    
    // Gravity indicator
    ctx.fillStyle = '#00f3ff';
    ctx.font = '20px Segoe UI';
    ctx.fillText(`GRAVITY: ${this.gravityDir.icon} ${this.gravityDir.name.toUpperCase()}`, 20, this.canvas.height - 30);
    
    // Next level progress
    const progress = Math.min(1, this.score / this.targetScore);
    const barWidth = 200;
    const barHeight = 8;
    const barX = this.canvas.width - barWidth - 20;
    const barY = 30;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const progGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    progGrad.addColorStop(0, '#00f3ff');
    progGrad.addColorStop(1, '#bc13fe');
    ctx.fillStyle = progGrad;
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Segoe UI';
    ctx.textAlign = 'right';
    ctx.fillText(`NEXT: ${this.targetScore.toLocaleString()}`, this.canvas.width - 20, 25);
    
    ctx.shadowBlur = 0;
  }
  loop(time) {
    const dt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;
    this.update(dt);
    this.draw();
    requestAnimationFrame(t => this.loop(t));
  }
}

// Start game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});

// Prevent context menu on canvas
document.addEventListener('contextmenu', e => {
  if (e.target.tagName === 'CANVAS') e.preventDefault();
});