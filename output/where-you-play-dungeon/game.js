const TILE_SIZE = 50;
const COLS = 16;
const ROWS = 12;
const WORLD_W = COLS * TILE_SIZE;
const WORLD_H = ROWS * TILE_SIZE;

const COLORS = {
  floor: '#2a2a3d',
  wall: '#1a1a2e',
  wallHighlight: '#3a3a5e',
  dmCursor: '#f72585',
  hero: '#4361ee',
  heroGlow: '#4cc9f0',
  exit: '#7209b7',
  spike: '#e63946',
  pit: '#1d3557',
  fire: '#f77f00',
  freeze: '#4cc9f0',
  gold: '#ffd700',
};

class Grid {
  constructor() {
    this.tiles = [];
    this.walls = new Set();
    this.traps = new Map();
    this.heroStart = { x: 0, y: 0 };
    this.exit = { x: COLS - 1, y: ROWS - 1 };
    this.init();
  }
  init() {
    for (let y = 0; y < ROWS; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < COLS; x++) {
        this.tiles[y][x] = 0; // 0 floor, 1 wall, 2 trap
      }
    }
  }
  isWalkable(x, y) {
    return !this.walls.has(this._idx(x, y));
  }
  _idx(x, y) {
    return y * COLS + x;
  }
  addWall(x, y) {
    this.walls.add(this._idx(x, y));
  }
  removeWall(x, y) {
    this.walls.delete(this._idx(x, y));
  }
  placeTrap(x, y, type) {
    this.traps.set(this._idx(x, y), type);
    this.grid.traps.set(this._idx(x, y), type);
  }
  removeTrap(x, y) {
    this.traps.delete(this._idx(x, y));
    this.grid.traps.delete(this._idx(x, y));
  }
  getTrap(x, y) {
    return this.traps.get(this._idx(x, y));
  }
  getWalkableNodes() {
    const nodes = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (this.isWalkable(x, y)) nodes.push({ x, y });
      }
    }
    return nodes;
  }
}

function findPath(grid, start, goal) {
  const open = [];
  const closed = new Set();
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();

  function heuristic(a, b) {
    const dx = Math.abs(a.x - b.x);
    const dy = Math.abs(a.y - b.y);
    return dx + dy;
  }

  open.push({ x: start.x, y: start.y, g: 0, f: heuristic(start, goal), pos: start });
  cameFrom.set(`${start.x},${start.y}`, null);
  gScore.set(`${start.x},${start.y}`, 0);
  fScore.set(`${start.x},${start.y}`, heuristic(start, goal));

  while (open.length) {
    const current = open.shift();
    const key = `${current.x},${current.y}`;
    if (current.x === goal.x && current.y === goal.y) {
      let path = [{ x: current.x, y: current.y }];
      let k = `${current.x},${current.y}`;
      while (k && cameFrom.has(k)) {
        k = cameFrom.get(k);
        path.push({ x: k.split(',')[0], y: k.split(',')[1] });
      }
      return path;
    }
    closed.add(key);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        const nx = current.x + dx;
        const ny = current.y + dy;
        const nKey = `${nx},${ny}`;
        if (closed.has(nKey) || !grid.isWalkable(nx, ny)) continue;
        const tentativeG = gScore.get(key) + 1;
        if (!gScore.has(nKey) || tentativeG < gScore.get(nKey)) {
          cameFrom.set(nKey, key);
          gScore.set(nKey, tentativeG);
          fScore.set(nKey, tentativeG + heuristic({ x: nx, y: ny }, goal));
          open.push({ x: nx, y: ny, g: tentativeG, f: fScore.get(nKey), pos: { x: nx, y: ny } });
        }
      }
    }
    return null;
  }
}

class Hero {
  constructor(grid) {
    this.grid = grid;
    this.x = grid.heroStart.x * TILE_SIZE;
    this.y = grid.heroStart.y * TILE_SIZE;
    this.radius = 15;
    this.hp = 100;
    this.speed = 80;
    this.trail = [];
    this.state = 'walking';
  }
  update(dt) {
    if (this.state === 'walking') {
      const path = this.getPath();
      if (path.length > 1) {
        const next = path[1];
        const dx = next.x - this.x;
        const dy = next.y - this.y;
        const dist = Math.hypot(dx, dy);
        const move = Math.min(this.speed * dt, dist);
        this.x += (dx / dist) * move;
        this.y += (dy / move) * move;
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();
      } else {
        this.state = 'idle';
      }
    }
  }
  getPos() {
    return { x: this.x, y: this.y };
  };
  die() {
    this.hp = 0;
    if (window.sound) window.sound.playDie();
  }
}

class ParticleSystem {
  constructor(ctx) {
    this.ctx = ctx;
    this.particles = [];
  }
  emit(x, y, type) {
    const p = {
      x,
      y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 10,
      size: 5,
      type,
    };
    this.particles.push(p);
  }
  update() {
    this.ctx.save();
    this.ctx.globalAlpha = 0.5;
    this.particles.forEach((p, i) => {
      this.ctx.fillStyle = (p.type === 'fire') ? '#f77f00' : '#4cc9f0';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
      this.ctx.fill();
      p.life--;
      p.size *= 0.9;
      p.y += p.vy;
      p.x += p.vx;
      if (p.life <= 0) this.particles.splice(i, 1);
    });
    this.ctx.restore();
  }
}

class Game {
  constructor() {
    this.grid = new Grid();
    this.traps = new Map();
    this.phase = 'planning';
    this.timer = 30;
    this.budget = 8;
    this.score = 0;
    this.highScore = 0;
    this.level = 1;
    this.lastTime = 0;
    this.running = true;
    this.hero = new Hero(this.grid);
    this.particleSys = new ParticleSystem(document.getElementById('game').getContext('2d'));
    this.init();
  }
  init() {
    // Set up UI elements
    this.budgetEl = document.getElementById('budget');
    this.wallsEl = document.getElementById('walls');
    this.levelEl = document.getElementById('level');
    this.scoreEl = document.getElementById('score');
    this.timerEl = document.getElementById('timer');
    this.hpEl = document.getElementById('hp');
    this.startBtn = document.getElementById('start');
    this.resetBtn = document.getElementById('reset');
    this.startBtn.onclick = () => this.startSimulation();
    this.resetBtn.onclick = () => this.resetGame();
    // Load high score
    const hs = localStorage.getItem('highScore');
    this.highScore = hs ? parseInt(hs) : 0;
  }
  resizeCanvas() {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const scale = Math.min(window.innerWidth / WORLD_W, window.innerHeight / WORLD_H);
    canvas.width = WORLD_W * scale;
    canvas.height = WORLD_H * scale;
  }
  startSimulation() {
    this.phase = 'simulation';
    this.timer = 0;
    this.budget = this.getBudgetForLevel();
    this.score = 0;
    this.hpEl.textContent = this.hero.hp;
    this.startBtn.disabled = true;
    this.resetBtn.disabled = false;
    requestAnimationFrame(this.loop.bind(this));
  }
  resetGame() {
    this.phase = 'planning';
    this.timer = 30;
    this.budget = this.getBudgetForLevel();
    this.score = 0;
    this.hero.hp = 100;
    this.hero.x = this.grid.heroStart.x * TILE_SIZE;
    this.hero.y = this.grid.heroStart.y * TILE_SIZE;
    this.traps.clear();
    this.grid.traps.clear();
    this.wallsEl.textContent = `${this.grid.walls.size} left`;
    this.startBtn.disabled = false;
    this.resetBtn.disabled = true;
  }
  getBudgetForLevel() {
    return 8 + (this.level - 1) * 2;
  }
  checkResult() {
    if (this.hero.hp <= 0) {
      this.win();
    } else if (this.hero.x === this.grid.exit.x * TILE_SIZE && this.hero.y === this.grid.exit.y * TILE_SIZE) {
      this.lose();
    }
  }
  win() {
    this.score = this.traps.size * 10 + (100 - this.hero.hp) * 2;
    this.highScore = Math.max(this.highScore, this.score);
    localStorage.setItem('highScore', this.highScore);
    this.level++;
    this.budgetEl.textContent = this.budget;
    this.scoreEl.textContent = this.score;
    this.hpEl.textContent = this.hero.hp;
    if (this.sound.playWin) this.sound.playWin();
  }
  lose() {
    this.score = -5;
    this.scoreEl.textContent = this.score;
    this.hpEl.textContent = this.hero.hp;
    if (this.sound.playLose) this.sound.playLose();
    setTimeout(() => {
      this.level++;
      this.budget = this.getBudgetForLevel();
      this.resetGame();
    }, 2000);
  }
  loop(timestamp) {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    if (this.phase === 'planning') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.phase = 'simulation';
        this.timer = 0;
        this.startSimulation();
      }
    } else if (this.phase === 'simulation') {
      this.timer += dt;
      this.hero.update(dt);
      // Check trap triggers
      for (const [idx, type] of this.traps.entries()) {
        const tx = Math.floor(idx % COLS);
        const ty = Math.floor(idx / COLS);
        const px = this.hero.x;
        const py = this.hero.y;
        if (Math.abs(px - tx * TILE_SIZE - TILE_SIZE / 2) < TILE_SIZE / 2 && Math.abs(py - ty * TILE_SIZE - TILE_SIZE / 2) < TILE_SIZE / 2) {
          this.hero.hp -= this.getDamage(type);
          if (this.sound.playTrap) this.sound.playTrap(type);
          this.particleSys.emit(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2, type);
        }
      }
      if (this.hero.hp <= 0 || (this.hero.x === this.grid.exit.x * TILE_SIZE && this.hero.y === this.grid.exit.y * TILE_SIZE)) {
        this.phase = 'result';
        this.checkResult();
      }
      this.render();
      requestAnimationFrame(this.loop.bind(this));
    }
  }
  render() {
    const ctx = this.ctx;
    const scale = this.ctx.canvas.width / WORLD_W;
    // Draw background floor
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    // Draw walls
    ctx.fillStyle = COLORS.wall;
    this.grid.walls.forEach(idx => {
      const x = Math.floor(idx % COLS);
      const y = Math.floor(idx / COLS);
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      // Highlight edges
      ctx.strokeStyle = COLORS.wallHighlight;
      ctx.lineWidth = 2;
      ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });
    // Draw traps
    this.grid.traps.forEach((type, idx) => {
      const tx = Math.floor(idx % COLS);
      const ty = Math.floor(idx / COLS);
      const x = tx * TILE_SIZE;
      const y = ty * TILE_SIZE;
      ctx.fillStyle = COLORS[type];
      ctx.beginPath();
      ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 3, 0, 2 * Math.PI);
      ctx.fill();
    });
    // Draw hero
    const pos = this.hero.getPos();
    ctx.fillStyle = COLORS.hero;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.hero.radius, 0, 2 * Math.PI);
    ctx.fill();
    // Draw trail particles
    this.particleSys.update();
    // Draw exit portal
    ctx.fillStyle = COLORS.exit;
    ctx.beginPath();
    ctx.arc(WORLD_W - TILE_SIZE, WORLD_H - TILE_SIZE, TILE_SIZE / 2, 0, 2 * Math.PI);
    ctx.fill();
    // Draw UI overlay
    ctx.save();
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Budget: ${this.budget}`, 10, 20);
    ctx.fillText(`Level: ${this.level}`, 10, 40);
    ctx.fillText(`Score: ${this.score}`, 10, 60);
    ctx.fillText(`Timer: ${Math.floor(this.timer)}s`, 10, 80);
    ctx.fillText(`HP: ${this.hero.hp}/100`, 10, 100);
    ctx.restore();
  }
  getDamage(type) {
    switch (type) {
      case 'Spike':
        return 30;
      case 'Pit':
        return 100;
      case 'Fire':
        return 15;
      case 'Freeze':
        return 0;
      default:
        return 0;
    }
  }
  // Sound handling
  sound = {
    playTrap(type) {
      this.playOsc('trap', 0.2);
    },
    playDie() {
      this.playOsc('die', 0.5);
    },
    playWin() {
      this.playOsc('win', 0.7);
    },
    playLose() {
      this.playOsc('lose', 0.5);
    },
    playOsc(name, volume) {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = name === 'trap' ? 'sine' : 'square';
      osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.2);
    }
  }
}

// Initialize game
const game = new Game();

// Handle trap placement
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let selected = 'Spike';
const typeMap = { 1: 'Spike', 2: 'Pit', 3: 'Fire', 4: 'Freeze' };

canvas.addEventListener('mousedown', e => {
  if (e.button === 0) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const col = Math.floor(mx / (TILE_SIZE * (canvas.width / WORLD_W)));
    const row = Math.floor(my / (TILE_SIZE * (canvas.height / WORLD_H)));
    const idx = row * COLS + col;
    if (this.phase === 'planning') {
      const trapType = typeMap[selected] || null;
      if (trapType) {
        const cost = this.getCost(trapType);
        if (cost <= this.budget && !this.grid.walls.has(idx) && !this.grid.traps.has(idx)) {
          this.grid.placeTrap(idx, trapType);
          this.budget -= cost;
          this.budgetEl.textContent = this.budget;
        }
      }
    } else if (e.button === 2) {
      if (this.grid.traps.has(idx)) {
        const trap = this.grid.getTrap(idx);
        const cost = this.getCost(trap);
        this.budget += cost;
        this.budgetEl.textContent = this.budget;
        this.grid.removeTrap(idx);
        this.traps.delete(idx);
      }
    }
  });

// Keyboard selection
document.addEventListener('keydown', e => {
  if (e.key >= '1' && e.key <= '4') {
    selected = e.key;
  } else if (e.key === 'Escape') {
    selected = '';
  }
});

// Start simulation early if space pressed
document.addEventListener('keydown', e => {
  if (e.key === ' ' && game.phase === 'planning') {
    game.phase = 'simulation';
    game.timer = 0;
    game.startSimulation();
  }
});