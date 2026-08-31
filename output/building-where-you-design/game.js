/* CityBuilder 2D - Vanilla JS Canvas Game */
const CONFIG = {
  TILE: 32,
  GRID_W: 40,
  GRID_H: 30,
  SIM_INTERVAL: 5000,
  BUILD_TIME: 500,
  SAVE_KEY: 'citybuilder_save_v1',
  HIGHSCORE_KEY: 'citybuilder_highscore_v1',
  COLORS: {
    road: '#888888',
    R: '#5B9BD5',
    C: '#FFD700',
    I: '#9e9e9e',
    P: '#7CFC00',
    power: '#ffeb3b',
    water: '#00bcd4',
    school: '#FF6B6B',
    bg: '#1a1a2e',
    grid: '#252540'
  }
};

/* ===== Audio (Web Audio API) ===== */
class AudioFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
  }
  play(type) {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    const t = this.ctx.currentTime;
    switch(type) {
      case 'build':
        osc.type = 'square'; osc.frequency.setValueAtTime(220, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.15);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t); osc.stop(t + 0.2); break;
      case 'click':
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, t);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.start(t); osc.stop(t + 0.08); break;
      case 'notify':
        osc.type = 'sine'; osc.frequency.setValueAtTime(660, t);
        osc.frequency.setValueAtTime(880, t + 0.1);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t); osc.stop(t + 0.25); break;
      case 'error':
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t); osc.stop(t + 0.2); break;
      case 'upgrade':
        osc.type = 'triangle'; osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.2);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t); osc.stop(t + 0.3); break;
    }
  }
}

/* ===== GameStore (Flux-like) ===== */
class GameStore {
  constructor() {
    this.state = {
      day: 1,
      money: 500,
      energy: 100,
      water: 100,
      waste: 0,
      population: 0,
      happiness: 50,
      pollution: 0,
      crime: 0,
      selectedZone: 'road',
      tiles: [],
      buildings: [],
      buildQueue: [],
      policies: { taxRate: 1, greenSubsidy: false },
      score: 0
    };
    this.listeners = [];
  }
  init() {
    this.state.tiles = [];
    for (let y = 0; y < CONFIG.GRID_H; y++) {
      const row = [];
      for (let x = 0; x < CONFIG.GRID_W; x++) {
        row.push({ zone: null, building: null });
      }
      this.state.tiles.push(row);
    }
  }
  subscribe(fn) { this.listeners.push(fn); }
  notify() { this.listeners.forEach(fn => fn(this.state)); }
  setZone(x, y, zone) {
    if (x < 0 || y < 0 || x >= CONFIG.GRID_W || y >= CONFIG.GRID_H) return false;
    const t = this.state.tiles[y][x];
    if (t.building) return false;
    t.zone = zone;
    this.notify();
    return true;
  }
  placeBuilding(x, y, type) {
    const cost = this.getCost(type);
    if (this.state.money < cost) return false;
    if (x < 0 || y < 0 || x >= CONFIG.GRID_W || y >= CONFIG.GRID_H) return false;
    const t = this.state.tiles[y][x];
    if (!t.zone && type !== 'road') return false;
    if (t.building) return false;
    if (!this.hasRoadAdjacent(x, y) && type !== 'road') {
      if (type !== 'P') return false;
    }
    this.state.money -= cost;
    const b = {
      id: Date.now() + Math.random(),
      x, y, type, level: 1,
      buildStart: Date.now(),
      building: true
    };
    t.building = b;
    this.state.buildings.push(b);
    this.state.buildQueue.push({ id: b.id, x, y, type, progress: 0 });
    this.notify();
    return true;
  }
  hasRoadAdjacent(x, y) {
    const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < CONFIG.GRID_W && ny < CONFIG.GRID_H) {
        const t = this.state.tiles[ny][nx];
        if (t.zone === 'road') return true;
      }
    }
    return false;
  }
  getCost(type) {
    const costs = { road: 5, R: 10, C: 20, I: 30, P: 15, power: 80, water: 80, school: 100 };
    return costs[type] || 10;
  }
  simulate(dt) {
    const s = this.state;
    // Production
    let energyProd = 0, waterProd = 0, wasteProd = 0, popProd = 0, income = 0;
    let industrialCount = 0;
    for (const b of s.buildings) {
      if (!b.built) continue;
      const adj = this.countAdjacentSame(b.x, b.y, b.type);
      const bonus = 1 + adj * 0.1;
      switch (b.type) {
        case 'R': popProd += 5 * bonus; income += 3 * bonus; energyProd -= 1; waterProd -= 1; wasteProd += 0.5; break;
        case 'C': income += 8 * bonus; energyProd -= 1; break;
        case 'I': income += 12 * bonus; energyProd -= 3; waterProd -= 2; wasteProd += 2; industrialCount++; break;
        case 'power': energyProd += 30 * bonus; if (s.policies.greenSubsidy) income += 5; break;
        case 'water': waterProd += 30 * bonus; break;
        case 'school': s.happiness += 0.1; break;
        case 'P': s.happiness += 0.5; s.pollution -= 0.2; break;
      }
    }
    s.energy += energyProd * dt / 1000;
    s.water += waterProd * dt / 1000;
    s.waste += wasteProd * dt / 1000;
    s.pollution += industrialCount * 0.05 * dt / 1000;
    s.population += Math.floor(popProd * dt / 10000);
    if (s.population < 0) s.population = 0;
    income *= s.policies.taxRate * dt / 1000;
    s.money += income;
    s.money -= s.population * 0.05 * dt / 1000;
    // Clamps
    if (s.energy < 0) s.energy = 0;
    if (s.water < 0) s.water = 0;
    if (s.waste < 0) s.waste = 0;
    if (s.happiness > 100) s.happiness = 100;
    if (s.pollution < 0) s.pollution = 0;
    s.score = s.population + Math.floor(s.money / 10) + Math.floor(s.happiness);
    s.day += dt / 10000;
    if (s.day > Math.floor(s.day)) s.day = Math.floor(s.day);
    this.notify();
  }
  countAdjacentSame(x, y, type) {
    let count = 0;
    const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < CONFIG.GRID_W && ny < CONFIG.GRID_H) {
        const t = this.state.tiles[ny][nx];
        if (t.zone === type || (t.building && t.building.type === type)) count++;
      }
    }
    return count;
  }
  updateBuildQueue() {
    const now = Date.now();
    this.state.buildQueue.forEach(q => {
      q.progress = Math.min(1, (now - this.state.tiles[q.y][q.x].building.buildStart) / CONFIG.BUILD_TIME);
    });
    this.state.buildings.forEach(b => {
      if (!b.built && (now - b.buildStart) >= CONFIG.BUILD_TIME) {
        b.built = true;
      }
    });
    this.state.buildQueue = this.state.buildQueue.filter(q => !this.state.tiles[q.y][q.x].building.built);
  }
  save() {
    const data = JSON.stringify(this.state);
    localStorage.setItem(CONFIG.SAVE_KEY, data);
    if (this.state.score > this.getHighScore()) {
      localStorage.setItem(CONFIG.HIGHSCORE_KEY, this.state.score.toString());
    }
  }
  load() {
    const data = localStorage.getItem(CONFIG.SAVE_KEY);
    if (data) {
      try {
        this.state = JSON.parse(data);
        this.notify();
        return true;
      } catch(e) { return false; }
    }
    return false;
  }
  getHighScore() {
    return parseInt(localStorage.getItem(CONFIG.HIGHSCORE_KEY) || '0', 10);
  }
  reset() {
    this.state = {
      day: 1, money: 500, energy: 100, water: 100, waste: 0,
      population: 0, happiness: 50, pollution: 0, crime: 0,
      selectedZone: 'road', tiles: [], buildings: [], buildQueue: [],
      policies: { taxRate: 1, greenSubsidy: false }, score: 0
    };
    this.init();
    this.notify();
  }
}

/* ===== Renderer ===== */
class Renderer {
  constructor(canvas, store) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.store = store;
    this.cam = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
    this.mouse = { x: 0, y: 0, down: false, rightDown: false, dragStart: null };
    this.preview = null;
    this.tooltips = [];
    this.particles = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.viewW = window.innerWidth;
    this.viewH = window.innerHeight;
    // Auto-fit zoom on small screens
    if (this.viewW < 768) {
      const fitZoom = Math.min(this.viewW / (CONFIG.TILE * CONFIG.GRID_W * 0.6), 1);
      this.cam.targetZoom = Math.max(0.5, fitZoom);
      this.cam.zoom = this.cam.targetZoom;
    }
  }
  worldToScreen(wx, wy) {
    return {
      x: (wx - this.cam.x) * this.cam.zoom + this.viewW / 2,
      y: (wy - this.cam.y) * this.cam.zoom + this.viewH / 2
    };
  }
  screenToWorld(sx, sy) {
    return {
      x: (sx - this.viewW / 2) / this.cam.zoom + this.cam.x,
      y: (sy - this.viewH / 2) / this.cam.zoom + this.cam.y
    };
  }
  render() {
    const ctx = this.ctx;
    const s = this.store.state;
    // Smooth zoom
    this.cam.zoom += (this.cam.targetZoom - this.cam.zoom) * 0.2;
    ctx.fillStyle = CONFIG.COLORS.bg;
    ctx.fillRect(0, 0, this.viewW, this.viewH);
    const startWX = this.cam.x - (this.viewW / 2) / this.cam.zoom;
    const startWY = this.cam.y - (this.viewH / 2) / this.cam.zoom;
    const endWX = this.cam.x + (this.viewW / 2) / this.cam.zoom;
    const endWY = this.cam.y + (this.viewH / 2) / this.cam.zoom;
    const startTX = Math.floor(startWX / CONFIG.TILE);
    const startTY = Math.floor(startWY / CONFIG.TILE);
    const endTX = Math.ceil(endWX / CONFIG.TILE);
    const endTY = Math.ceil(endWY / CONFIG.TILE);
    // Draw tiles
    for (let ty = startTY; ty <= endTY; ty++) {
      for (let tx = startTX; tx <= endTX; tx++) {
        if (tx < 0 || ty < 0 || tx >= CONFIG.GRID_W || ty >= CONFIG.GRID_H) continue;
        const tile = s.tiles[ty][tx];
        const sx = (tx * CONFIG.TILE - this.cam.x) * this.cam.zoom + this.viewW / 2;
        const sy = (ty * CONFIG.TILE - this.cam.y) * this.cam.zoom + this.viewH / 2;
        const size = CONFIG.TILE * this.cam.zoom;
        if (tile.zone) {
          ctx.fillStyle = CONFIG.COLORS[tile.zone] || '#444';
          ctx.globalAlpha = tile.zone === 'road' ? 0.7 : 0.5;
          ctx.fillRect(sx, sy, size, size);
          ctx.globalAlpha = 1;
        }
        // Grid lines (only when zoomed in enough)
        if (this.cam.zoom > 0.7) {
          ctx.strokeStyle = CONFIG.COLORS.grid;
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, sy, size, size);
        }
        // Building
        if (tile.building) {
          this.drawBuilding(ctx, sx, sy, size, tile.building);
        }
      }
    }
    // Placement preview
    if (this.preview) {
      const { x, y, valid } = this.preview;
      const sx = (x * CONFIG.TILE - this.cam.x) * this.cam.zoom + this.viewW / 2;
      const sy = (y * CONFIG.TILE - this.cam.y) * this.cam.zoom + this.viewH / 2;
      const size = CONFIG.TILE * this.cam.zoom;
      ctx.fillStyle = valid ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(sx, sy, size, size);
      ctx.strokeStyle = valid ? '#00ff00' : '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, size, size);
    }
    // Particles
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.02;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }
  drawBuilding(ctx, sx, sy, size, b) {
    const color = CONFIG.COLORS[b.type] || '#fff';
    const pad = size * 0.1;
    if (this.cam.zoom < 0.8) {
      // LOD: silhouette
      ctx.fillStyle = color;
      ctx.fillRect(sx + pad, sy + pad, size - pad * 2, size - pad * 2);
    } else {
      // Pixel-art style with 2px AA
      ctx.fillStyle = color;
      ctx.fillRect(sx + pad, sy + pad, size - pad * 2, size - pad * 2);
      // Inner detail
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(sx + pad, sy + size * 0.6, size - pad * 2, size * 0.3);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(sx + pad, sy + pad, size - pad * 2, size * 0.1);
      // Build progress overlay
      if (!b.built) {
        const elapsed = Date.now() - b.buildStart;
        const progress = Math.min(1, elapsed / CONFIG.BUILD_TIME);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(sx + pad, sy + pad, size - pad * 2, size - pad * 2);
        ctx.fillStyle = '#00d9ff';
        ctx.fillRect(sx + pad, sy + size - pad - 4, (size - pad * 2) * progress, 4);
      } else {
        // Level indicator
        if (b.level > 1) {
          ctx.fillStyle = '#ffeb3b';
          ctx.font = `${Math.floor(size / 4)}px Roboto`;
          ctx.textAlign = 'center';
          ctx.fillText('★'.repeat(b.level - 1), sx + size / 2, sy + size * 0.35);
        }
        // Pulse for school/happiness
        if (b.type === 'school' || b.type === 'P') {
          const pulse = (Math.sin(Date.now() / 500) + 1) * 0.1;
          ctx.fillStyle = `rgba(124, 252, 0, ${pulse})`;
          ctx.fillRect(sx + pad, sy + pad, size - pad * 2, size - pad * 2);
        }
      }
    }
  }
  spawnParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 1,
        size: 3 + Math.random() * 3,
        color
      });
    }
  }
}

/* ===== Minimap ===== */
class Minimap {
  constructor(canvas, store) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.store = store;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * 2;
    this.canvas.height = rect.height * 2;
  }
  render() {
    const ctx = this.ctx;
    const s = this.store.state;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(0, 0, w * 2, h * 2);
    const tw = (w * 2) / CONFIG.GRID_W;
    const th = (h * 2) / CONFIG.GRID_H;
    for (let y = 0; y < CONFIG.GRID_H; y++) {
      for (let x = 0; x < CONFIG.GRID_W; x++) {
        const tile = s.tiles[y][x];
        if (tile.zone) {
          ctx.fillStyle = CONFIG.COLORS[tile.zone] || '#444';
          ctx.globalAlpha = 0.8;
          ctx.fillRect(x * tw, y * th, tw, th);
        }
        if (tile.building) {
          ctx.fillStyle = CONFIG.COLORS[tile.building.type] || '#fff';
          ctx.fillRect(x * tw, y * th, tw, th);
        }
      }
    }
    ctx.globalAlpha = 1;
    // Viewport indicator
    if (window.renderer) {
      const r = window.renderer;
      const vx = (r.cam.x / CONFIG.TILE / CONFIG.GRID_W) * w * 2;
      const vy = (r.cam.y / CONFIG.TILE / CONFIG.GRID_H) * h * 2;
      ctx.strokeStyle = '#00d9ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(vx, vy, w * 2 / r.cam.zoom * 0.1, h * 2 / r.cam.zoom * 0.1);
    }
  }
}

/* ===== UI Manager ===== */
class UIManager {
  constructor(store) {
    this.store = store;
    this.audio = new AudioFX();
    this.buildQueueEl = document.getElementById('build-queue');
    this.toastContainer = document.getElementById('toast-container');
    this.sidePanel = document.getElementById('side-panel');
    this.panelTitle = document.getElementById('panel-title');
    this.panelContent = document.getElementById('panel-content');
    this.dayNum = document.getElementById('day-num');
    this.timerEl = document.getElementById('speedrun-timer');
    this.highScoreEl = document.getElementById('high-score');
    this.resourceEls = {
      energy: document.querySelector('#res-energy span'),
      water: document.querySelector('#res-water span'),
      waste: document.querySelector('#res-waste span'),
      money: document.querySelector('#res-money span'),
      pop: document.querySelector('#res-pop span')
    };
    this.startTime = Date.now();
    this.setupListeners();
    this.updateHighScore();
  }
  setupListeners() {
    document.querySelectorAll('.zone-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.audio.init();
        this.audio.play('click');
        document.querySelectorAll('.zone-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.store.state.selectedZone = btn.dataset.zone;
      });
    });
    document.getElementById('btn-save').addEventListener('click', () => {
      this.audio.init();
      this.store.save();
      this.toast('Game Saved!');
      this.audio.play('notify');
    });
    document.getElementById('btn-load').addEventListener('click', () => {
      this.audio.init();
      if (this.store.load()) {
        this.toast('Game Loaded!');
        this.audio.play('notify');
      } else {
        this.toast('No save found');
        this.audio.play('error');
      }
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      this.audio.init();
      if (confirm('Reset city?')) {
        this.store.reset();
        this.startTime = Date.now();
        this.toast('City reset');
        this.audio.play('error');
      }
    });
    document.getElementById('btn-policies').addEventListener('click', () => {
      this.audio.init();
      this.openPolicies();
      this.audio.play('click');
    });
    // Touch init for audio
    document.addEventListener('touchstart', () => this.audio.init(), { once: true });
    document.addEventListener('mousedown', () => this.audio.init(), { once: true });
  }
  update(state) {
    this.dayNum.textContent = Math.floor(state.day);
    this.resourceEls.energy.textContent = Math.floor(state.energy);
    this.resourceEls.water.textContent = Math.floor(state.water);
    this.resourceEls.waste.textContent = Math.floor(state.waste);
    this.resourceEls.money.textContent = Math.floor(state.money);
    this.resourceEls.pop.textContent = state.population;
    // Deficit highlight
    document.getElementById('res-energy').classList.toggle('deficit', state.energy < 10);
    document.getElementById('res-water').classList.toggle('deficit', state.water < 10);
    // Build queue
    this.buildQueueEl.innerHTML = state.buildQueue.slice(0, 4).map(q => {
      const b = state.tiles[q.y][q.x].building;
      const progress = b ? Math.min(100, Math.floor((Date.now() - b.buildStart) / CONFIG.BUILD_TIME * 100)) : 0;
      return `<div class="queue-item">${this.getIcon(q.type)}<div class="queue-progress" style="width:${progress}%"></div></div>`;
    }).join('');
    // Timer
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toString().padStart(2, '0');
    this.timerEl.textContent = `${mins}:${secs}`;
    // High score
    if (state.score > this.store.getHighScore()) {
      localStorage.setItem(CONFIG.HIGHSCORE_KEY, state.score.toString());
      this.updateHighScore();
    }
  }
  updateHighScore() {
    this.highScoreEl.textContent = this.store.getHighScore();
  }
  getIcon(type) {
    const icons = { road: '🛣️', R: '🏠', C: '🏪', I: '🏭', P: '🌳', power: '⚡', water: '💧', school: '🏫' };
    return icons[type] || '?';
  }
  toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    this.toastContainer.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }
  openPolicies() {
    const s = this.store.state;
    this.panelTitle.textContent = '📜 Policies';
    this.sidePanel.classList.add('open');
    this.panelContent.innerHTML = `
      <div class="stat-row"><span>Tax Rate</span><span>
        <button class="action-btn" id="tax-down" style="padding:2px 8px;min-width:30px;">-</button>
        ${s.policies.taxRate.toFixed(1)}x
        <button class="action-btn" id="tax-up" style="padding:2px 8px;min-width:30px;">+</button>
      </span></div>
      <div class="stat-row"><span>Green Subsidy</span><span>
        <button class="action-btn" id="green-toggle" style="padding:4px 8px;">${s.policies.greenSubsidy ? 'ON' : 'OFF'}</button>
      </span></div>
      <div class="stat-row"><span>💰 Money</span><span>${Math.floor(s.money)}</span></div>
      <div class="stat-row"><span>👥 Pop</span><span>${s.population}</span></div>
      <div class="stat-row"><span>😊 Happiness</span><span>${Math.floor(s.happiness)}</span></div>
      <div class="stat-row"><span>🏭 Pollution</span><span>${Math.floor(s.pollution)}</span></div>
      <div class="stat-row"><span>⭐ Score</span><span>${s.score}</span></div>
    `;
    document.getElementById('tax-down').onclick = () => {
      s.policies.taxRate = Math.max(0.5, s.policies.taxRate - 0.1);
      this.audio.play('click');
      this.openPolicies();
    };
    document.getElementById('tax-up').onclick = () => {
      s.policies.taxRate = Math.min(2, s.policies.taxRate + 0.1);
      this.audio.play('click');
      this.openPolicies();
    };
    document.getElementById('green-toggle').onclick = () => {
      s.policies.greenSubsidy = !s.policies.greenSubsidy;
      this.audio.play('upgrade');
      this.toast(s.policies.greenSubsidy ? 'Green subsidy enabled' : 'Green subsidy disabled');
      this.openPolicies();
    };
  }
  closePanel() {
    this.sidePanel.classList.remove('open');
  }
}

/* ===== Input Handler ===== */
class InputHandler {
  constructor(renderer, store, ui) {
    this.renderer = renderer;
    this.store = store;
    this.ui = ui;
    this.canvas = renderer.canvas;
    this.setupListeners();
  }
  setupListeners() {
    this.canvas.addEventListener('mousemove', e => this.onMouseMove(e));
    this.canvas.addEventListener('mousedown', e => this.onMouseDown(e));
    this.canvas.addEventListener('mouseup', e => this.onMouseUp(e));
    this.canvas.addEventListener('wheel', e => this.onWheel(e));
    this.canvas.addEventListener('touchstart', e => this.onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', e => this.onTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', e => this.onTouchEnd(e));
    // Keyboard
    window.addEventListener('keydown', e => this.onKeyDown(e));
    // Close side panel when clicking outside
    document.getElementById('side-panel').addEventListener('click', e => e.stopPropagation());
    this.canvas.addEventListener('click', () => this.ui.closePanel());
  }
  getTileFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const w = this.renderer.screenToWorld(sx, sy);
    const tx = Math.floor(w.x / CONFIG.TILE);
    const ty = Math.floor(w.y / CONFIG.TILE);
    return { tx, ty, sx, sy };
  }
  onMouseMove(e) {
    this.renderer.mouse.x = e.clientX;
    this.renderer.mouse.y = e.clientY;
    if (this.renderer.mouse.down) {
      this.renderer.cam.x -= e.movementX / this.renderer.cam.zoom;
      this.renderer.cam.y -= e.movementY / this.renderer.cam.zoom;
    }
    this.updatePreview(e);
  }
  onMouseDown(e) {
    this.ui.audio.init();
    if (e.button === 0) {
      this.renderer.mouse.down = true;
    } else if (e.button === 2) {
      this.renderer.mouse.rightDown = true;
    }
    this.renderer.mouse.dragStart = { x: e.clientX, y: e.clientY };
  }
  onMouseUp(e) {
    if (e.button === 0) {
      const dragDist = this.renderer.mouse.dragStart ?
        Math.hypot(e.clientX - this.renderer.mouse.dragStart.x, e.clientY - this.renderer.mouse.dragStart.y) : 0;
      if (dragDist < 5) {
        this.handleClick(e);
      }
      this.renderer.mouse.down = false;
    } else if (e.button === 2) {
      this.renderer.mouse.rightDown = false;
    }
  }
  onWheel(e) {
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * 0.1;
    this.renderer.cam.targetZoom = Math.max(0.4, Math.min(2.5, this.renderer.cam.targetZoom + delta));
  }
  onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.renderer.mouse.down = true;
      this.touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this.touchMoved = false;
      this.updatePreview(e);
    }
  }
  onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && this.touchStart) {
      const dx = e.touches[0].clientX - this.touchStart.x;
      const dy = e.touches[0].clientY - this.touchStart.y;
      if (Math.hypot(dx, dy) > 5) this.touchMoved = true;
      this.renderer.cam.x -= dx / this.renderer.cam.zoom;
      this.renderer.cam.y -= dy / this.renderer.cam.zoom;
      this.touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (this.lastPinchDist) {
        const delta = (d - this.lastPinchDist) * 0.01;
        this.renderer.cam.targetZoom = Math.max(0.4, Math.min(2.5, this.renderer.cam.targetZoom + delta));
      }
      this.lastPinchDist = d;
    }
  }
  onTouchEnd(e) {
    if (!this.touchMoved) {
      this.handleClick(e.changedTouches ? e.changedTouches[0] : e);
    }
    this.renderer.mouse.down = false;
    this.touchStart = null;
    this.lastPinchDist = null;
  }
  onKeyDown(e) {
    switch(e.key.toLowerCase()) {
      case 'r': document.querySelector('[data-zone="R"]').click(); break;
      case 'c': document.querySelector('[data-zone="C"]').click(); break;
      case 'i': document.querySelector('[data-zone="I"]').click(); break;
      case 'p': document.querySelector('[data-zone="P"]').click(); break;
      case 'b': document.querySelector('[data-zone="road"]').click(); break;
      case '1': document.querySelector('[data-zone="power"]').click(); break;
      case '2': document.querySelector('[data-zone="water"]').click(); break;
      case '3': document.querySelector('[data-zone="school"]').click(); break;
      case 's': if (e.ctrlKey || e.metaKey) { e.preventDefault(); document.getElementById('btn-save').click(); } break;
    }
  }
  updatePreview(e) {
    const { tx, ty } = this.getTileFromEvent(e);
    const s = this.store.state;
    if (tx >= 0 && ty >= 0 && tx < CONFIG.GRID_W && ty < CONFIG.GRID_H) {
      const tile = s.tiles[ty][tx];
      const zone = s.selectedZone;
      const valid = this.isValidPlacement(tx, ty, zone);
      this.renderer.preview = { x: tx, y: ty, valid };
    } else {
      this.renderer.preview = null;
    }
  }
  isValidPlacement(x, y, zone) {
    if (x < 0 || y < 0 || x >= CONFIG.GRID_W || y >= CONFIG.GRID_H) return false;
    const tile = this.store.state.tiles[y][x];
    if (tile.building) return false;
    if (zone === 'road') return true;
    if (!tile.zone && zone !== 'P') return false;
    const cost = this.store.getCost(zone);
    if (this.store.state.money < cost) return false;
    if (zone !== 'P' && !this.store.hasRoadAdjacent(x, y)) return false;
    return true;
  }
  handleClick(e) {
    const { tx, ty } = this.getTileFromEvent(e);
    if (tx < 0 || ty < 0 || tx >= CONFIG.GRID_W || ty >= CONFIG.GRID_H) return;
    const s = this.store.state;
    const tile = s.tiles[ty][tx];
    const zone = s.selectedZone;
    // Right click: inspect
    if (e.button === 2 || (e.touches && e.button === undefined && this.renderer.mouse.rightDown)) {
      this.inspect(tx, ty);
      return;
    }
    // Place zone first if no zone
    if (zone !== 'road' && !tile.zone && !tile.building) {
      if (!this.store.setZone(tx, ty, 'R')) {
        this.ui.toast('Cannot zone here');
        this.ui.audio.play('error');
        return;
      }
    }
    // Place building
    if (this.isValidPlacement(tx, ty, zone)) {
      if (this.store.placeBuilding(tx, ty, zone)) {
        this.ui.audio.play('build');
        const w = this.renderer.worldToScreen(tx * CONFIG.TILE + CONFIG.TILE / 2, ty * CONFIG.TILE + CONFIG.TILE / 2);
        this.renderer.spawnParticles(w.x, w.y, CONFIG.COLORS[zone]);
        this.ui.toast(`Built ${zone}!`);
      }
    } else {
      this.ui.audio.play('error');
    }
  }
  inspect(x, y) {
    const tile = this.store.state.tiles[y][x];
    this.ui.panelTitle.textContent = `Tile (${x}, ${y})`;
    this.ui.sidePanel.classList.add('open');
    if (tile.building) {
      const b = tile.building;
      this.ui.panelContent.innerHTML = `
        <div class="stat-row"><span>Type</span><span>${b.type}</span></div>
        <div class="stat-row"><span>Level</span><span>${b.level}</span></div>
        <div class="stat-row"><span>Status</span><span>${b.built ? 'Built' : 'Building...'}</span></div>
        ${b.built ? `<button class="action-btn" id="upgrade-btn" style="width:100%;margin-top:8px;">⬆️ Upgrade ($${this.store.getCost(b.type) * b.level})</button>` : ''}
      `;
      if (b.built) {
        document.getElementById('upgrade-btn').onclick = () => {
          const cost = this.store.getCost(b.type) * b.level;
          if (this.store.state.money >= cost) {
            this.store.state.money -= cost;
            b.level++;
            this.ui.audio.play('upgrade');
            this.ui.toast('Upgraded!');
            this.inspect(x, y);
          } else {
            this.ui.audio.play('error');
            this.ui.toast('Not enough money');
          }
        };
      }
    } else if (tile.zone) {
      this.ui.panelContent.innerHTML = `
        <div class="stat-row"><span>Zone</span><span>${tile.zone}</span></div>
        <div class="stat-row"><span>Status</span><span>Empty</span></div>
      `;
    } else {
      this.ui.panelContent.innerHTML = `<div class="stat-row"><span>Empty tile</span></div>`;
    }
  }
}

/* ===== Bootstrap ===== */
const store = new GameStore();
store.init();
const canvas = document.getElementById('game-canvas');
const renderer = new Renderer(canvas, store);
window.renderer = renderer;
const minimap = new Minimap(document.getElementById('minimap'), store);
const ui = new UIManager(store);
const input = new InputHandler(renderer, store, ui);
canvas.addEventListener('contextmenu', e => e.preventDefault());

store.subscribe(s => ui.update(s));

let lastTime = Date.now();
function loop() {
  const now = Date.now();
  const dt = now - lastTime;
  lastTime = now;
  store.updateBuildQueue();
  renderer.render();
  minimap.render();
  requestAnimationFrame(loop);
}

setInterval(() => store.simulate(CONFIG.SIM_INTERVAL), CONFIG.SIM_INTERVAL);
loop();

// Auto-save every 30s
setInterval(() => {
  store.save();
  ui.toast('Auto-saved');
}, 30000);

// Initial toast
setTimeout(() => ui.toast('Welcome to CityBuilder 2D!'), 500);
setTimeout(() => ui.toast('Click to build, right-click to inspect'), 2500);