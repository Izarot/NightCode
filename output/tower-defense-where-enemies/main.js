// main.js — Game state, loop, rendering, input
import { audio } from './audio.js';
import { CFG } from './config.js';
import { ParticleSystem } from './particles.js';
import { generatePath, waypointsToWorld, buildPathTileSet, tileKey } from './path.js';
import { Enemy } from './entities/enemy.js';
import { TOWER_DEFS } from './entities/tower.js';
import { Blaster, Zapper, Cannon } from './entities/tower.js';
import { Projectile } from './entities/projectile.js';
import { getWaveConfig, getLevel, WAVES_PER_LEVEL } from './waves.js';
export const CONFIG = {
  WIDTH: 960, HEIGHT: 640,
  TILE: 32,
  COLS: 30, ROWS: 20,
  BASE_ENEMY_SPEED: 0.5,
  BASE_ENEMY_HP: 30,
  BASE_REWARD: 8,
  SPAWN_INTERVAL_MS: 600,
  STARTING_GOLD: 150,
  STARTING_LIVES: 20,
  WAVES: 30
};
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const tooltipLayer = document.getElementById('tooltip-layer');
// Responsive scaling
function resize() {
  const wrapper = document.getElementById('game-container');
  const rect = wrapper.getBoundingClientRect();
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
}
window.addEventListener('resize', resize);
resize();
// Game state
const state = {
  enemies: [],
  towers: [],
  projectiles: [],
  arcs: [],
  particles: new ParticleSystem(500),
  gold: CFG.STARTING_GOLD,
  lives: CFG.STARTING_LIVES,
  wave: 0,
  waveProgress: 'idle', // idle, spawning, between
  spawnQueue: [],
  spawnTimer: 0,
  waypoints: [],
  pathTileSet: new Set(),
  placingTower: null,
  selectedTower: null,
  hoveredTower: null,
  hoveredTile: null,
  targetingMode: 'closest_exit',
  mouseX: 0, mouseY: 0,
  gameOver: false,
  victory: false,
  level: 1,
  shake: 0,
  flash: 0
};
state.removeTower = (t) => {
  const idx = state.towers.indexOf(t);
  if (idx >= 0) state.towers.splice(idx, 1);
};
// Init path
const rawWaypoints = generatePath();
state.waypoints = waypointsToWorld(rawWaypoints);
state.pathTileSet = buildPathTileSet(rawWaypoints);
// Input
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  state.mouseX = (e.clientX - rect.left) / rect.width * canvas.width;
  state.mouseY = (e.clientY - rect.top) / rect.height * canvas.height;
  updateHover();
  updateTooltip();
});
canvas.addEventListener('mousedown', (e) => {
  audio.init();
  audio.resume();
  handleClick();
});
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (state.placingTower) {
    state.placingTower = null;
    updateTooltip();
  } else if (state.selectedTower) {
    state.selectedTower = null;
    updateTooltip();
  }
});
canvas.addEventListener('mouseleave', () => {
  tooltipLayer.innerHTML = '';
});
function getTileUnderMouse() {
  const col = Math.floor(state.mouseX / 32);
  const row = Math.floor(state.mouseY / 32);
  return { col, row, x: col * 32 + 16, y: row * 32 + 16 };
}
function isBuildable(col, row) {
  if (col < 0 || row < 0 || col >= CFG.COLS || row >= CFG.ROWS) return false;
  if (state.pathTileSet.has(tileKey(col, row))) return false;
  for (const t of state.towers) if (t.col === col && t.row === row) return false;
  return true;
}
function updateHover() {
  const tile = getTileUnderMouse();
  state.hoveredTile = tile;
  if (state.placingTower) {
    state.hoveredTower = null;
    return;
  }
  state.hoveredTower = null;
  for (const t of state.towers) {
    const dx = t.x - state.mouseX, dy = t.y - state.mouseY;
    if (Math.hypot(dx, dy) < 16) { state.hoveredTower = t; break; }
  }
}
function updateTooltip() {
  tooltipLayer.innerHTML = '';
  if (state.placingTower) {
    const def = TOWER_DEFS[state.placingTower];
    showTooltip('<strong>' + def.name + '</strong>Cost: <span class="stat">$' + def.cost + '</span><br>' + def.description, state.mouseX, state.mouseY);
    return;
  }
  if (state.hoveredTower) {
    const t = state.hoveredTower;
    const def = t.def;
    showTooltip('<strong>' + def.name + ' Lv' + t.level + '</strong>DMG: <span class="stat">' + t.damage.toFixed(1) + '</span> RNG: <span class="stat">' + (t.range/32).toFixed(1) + '</span> ROF: <span class="stat">' + t.fireRate.toFixed(2) + '/s</span><br>Click to select', state.mouseX, state.mouseY);
  }
}
function showTooltip(html, mx, my) {
  const div = document.createElement('div');
  div.className = 'tooltip';
  div.innerHTML = html;
  div.style.left = (mx + 20) + 'px';
  div.style.top = (my + 20) + 'px';
  tooltipLayer.appendChild(div);
}
function handleClick() {
  audio.click();
  if (state.placingTower) {
    const tile = getTileUnderMouse();
    if (isBuildable(tile.col, tile.row)) {
      const def = TOWER_DEFS[state.placingTower];
      if (state.gold >= def.cost) {
        state.gold -= def.cost;
        const tower = new def.class(tile.col, tile.row, def, state);
        state.towers.push(tower);
        state.placingTower = null;
        updateTooltip();
      }
    }
    return;
  }
  if (state.hoveredTower) {
    state.selectedTower = state.hoveredTower;
    updateTooltip();
    return;
  }
  // Check UI buttons
  const mx = state.mouseX, my = state.mouseY;
  if (mx >= 760 && mx <= 940) {
    if (my >= 80 && my <= 110 && state.gold >= 50) {
      state.placingTower = 'blaster';
      state.selectedTower = null;
      updateTooltip();
      return;
    }
    if (my >= 115 && my <= 145 && state.gold >= 75) {
      state.placingTower = 'zapper';
      state.selectedTower = null;
      updateTooltip();
      return;
    }
    if (my >= 150 && my <= 180 && state.gold >= 100) {
      state.placingTower = 'cannon';
      state.selectedTower = null;
      updateTooltip();
      return;
    }
    // Targeting mode
    if (my >= 200 && my <= 220) {
      const modes = ['closest_exit', 'strongest', 'closest'];
      const idx = modes.indexOf(state.targetingMode);
      state.targetingMode = modes[(idx + 1) % modes.length];
      return;
    }
    // Start wave
    if (my >= 240 && my <= 270 && state.waveProgress === 'idle') {
      startWave();
      return;
    }
  }
  // Tower panel buttons
  if (state.selectedTower) {
    const t = state.selectedTower;
    // Upgrade
    if (mx >= 760 && mx <= 860 && my >= 380 && my <= 410) {
      if (t.upgrade(state)) {
        updateTooltip();
      }
      return;
    }
    // Sell
    if (mx >= 870 && mx <= 940 && my >= 380 && my <= 410) {
      state.gold += t.sellValue();
      state.removeTower(t);
      state.selectedTower = null;
      state.particles.burstDeath(t.x, t.y);
      updateTooltip();
      return;
    }
    state.selectedTower = null;
    updateTooltip();
  }
}
function startWave() {
  state.wave++;
  state.waveProgress = 'spawning';
  state.level = getLevel(state.wave);
  const cfg = getWaveConfig(state.wave);
  state.spawnQueue = [];
  for (let i = 0; i < cfg.count; i++) {
    state.spawnQueue.push(i);
  }
  state.spawnTimer = 0;
}
// Game loop
let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}
function update(dt) {
  if (state.gameOver || state.victory) return;
  state.shake = Math.max(0, state.shake - dt * 20);
  state.flash = Math.max(0, state.flash - dt * 3);
  // Spawn enemies
  if (state.waveProgress === 'spawning') {
    state.spawnTimer += dt * 1000;
    while (state.spawnQueue.length > 0 && state.spawnTimer >= CFG.SPAWN_INTERVAL_MS) {
      const idx = state.spawnQueue.shift();
      const totalTowerValue = state.towers.reduce((s, t) => s + t.totalCost(), 0);
      const e = new Enemy(state.waypoints, state.wave, idx, totalTowerValue);
      e.attachParticles(state.particles);
      state.enemies.push(e);
      state.spawnTimer -= CFG.SPAWN_INTERVAL_MS;
    }
    if (state.spawnQueue.length === 0) {
      state.waveProgress = 'between';
    }
  }
  // Start spawning alive enemies based on time
  const now = performance.now();
  for (const e of state.enemies) {
    if (!e.spawned && now >= e.spawnedAt) e.startSpawn(now);
    e.update(dt, state.towers);
  }
  // Update towers
  for (const t of state.towers) t.update(dt, state);
  // Update projectiles
  for (const p of state.projectiles) p.update(dt, state.enemies, state.particles);
  state.projectiles = state.projectiles.filter(p => p.alive);
  // Arcs
  for (const a of state.arcs) a.life -= dt;
  state.arcs = state.arcs.filter(a => a.life > 0);
  // Cleanup enemies
  for (const e of state.enemies) {
    if (e.state === 'dying' && e.dyingTime >= 0.3) e.alive = false;
  }
  // Rewards
  for (const e of state.enemies) {
    if (!e.alive && !e.rewarded) {
      e.rewarded = true;
      if (e.hp <= 0 && e.state === 'dying') {
        state.gold += e.reward;
        state.particles.burstDeath(e.x, e.y);
      } else if (e.reachedEnd) {
        state.lives--;
        state.flash = 0.5;
        state.shake = 0.5;
        if (state.lives <= 0) {
          state.gameOver = true;
          audio.gameOver();
        }
      }
    }
  }
  state.enemies = state.enemies.filter(e => e.alive);
  // Wave complete check
  if (state.waveProgress === 'between' && state.enemies.length === 0) {
    if (state.wave >= CFG.WAVES) {
      state.victory = true;
    } else {
      state.waveProgress = 'idle';
      audio.waveComplete();
    }
  }
  // Particles
  state.particles.update(dt);
}
function render() {
  ctx.clearRect(0, 0, CFG.WIDTH, CFG.HEIGHT);
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random()-0.5) * state.shake * 10, (Math.random()-0.5) * state.shake * 10);
  }
  drawBackground();
  drawPath();
  drawPlacementPreview();
  // Towers
  for (const t of state.towers) t.render(ctx);
  // Enemies
  for (const e of state.enemies) e.render(ctx);
  // Projectiles
  for (const p of state.projectiles) p.render(ctx);
  // Arcs
  ctx.strokeStyle = '#39d353';
  for (const a of state.arcs) {
    ctx.globalAlpha = a.life / 0.15;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x1, a.y1);
    const mx = (a.x1 + a.x2) / 2 + (Math.random() - 0.5) * 6;
    const my = (a.y1 + a.y2) / 2 + (Math.random() - 0.5) * 6;
    ctx.quadraticCurveTo(mx, my, a.x2, a.y2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Particles
  state.particles.render(ctx);
  drawHUD();
  drawTowerPanel();
  if (state.flash > 0) {
    ctx.fillStyle = 'rgba(218, 54, 51, ' + state.flash * 0.3 + ')';
    ctx.fillRect(0, 0, CFG.WIDTH, CFG.HEIGHT);
  }
  if (state.gameOver) drawGameOver();
  if (state.victory) drawVictory();
  ctx.restore();
}
function drawBackground() {
  // Grid
  ctx.strokeStyle = 'rgba(48, 54, 61, 0.4)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= CFG.WIDTH; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CFG.HEIGHT); ctx.stroke();
  }
  for (let y = 0; y <= CFG.HEIGHT; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CFG.WIDTH, y); ctx.stroke();
  }
}
function drawPath() {
  ctx.fillStyle = '#1c2128';
  for (let r = 0; r < CFG.ROWS; r++) {
    for (let c = 0; c < CFG.COLS; c++) {
      if (state.pathTileSet.has(tileKey(c, r))) {
        ctx.fillRect(c * 32, r * 32, 32, 32);
        ctx.strokeStyle = '#2d333b';
        ctx.strokeRect(c * 32, r * 32, 32, 32);
      }
    }
  }
}
function drawPlacementPreview() {
  if (!state.placingTower) return;
  const tile = getTileUnderMouse();
  const def = TOWER_DEFS[state.placingTower];
  const ok = isBuildable(tile.col, tile.row) && state.gold >= def.cost;
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = ok ? def.color : '#da3633';
  ctx.fillRect(tile.col * 32, tile.row * 32, 32, 32);
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = ok ? def.color : '#da3633';
  ctx.beginPath();
  ctx.arc(tile.x, tile.y, def.range * 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
function drawHUD() {
  // Top bar
  ctx.fillStyle = 'rgba(13, 17, 23, 0.9)';
  ctx.fillRect(0, 0, CFG.WIDTH, 36);
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 14px Courier New';
  ctx.fillText('Lives: ' + state.lives, 12, 22);
  ctx.fillText('Gold: $' + state.gold, 120, 22);
  ctx.fillText('Wave: ' + state.wave + '/' + CFG.WAVES, 240, 22);
  ctx.fillText('Level: ' + state.level, 380, 22);
  // Enemy count
  const alive = state.enemies.filter(e => e.alive && e.spawned).length;
  ctx.fillStyle = '#da3633';
  ctx.fillText('Parasites: ' + alive, 500, 22);
  // Shop
  drawButton(760, 80, 180, 30, 'Blaster $50', '#388bfd', state.gold >= 50 && !state.placingTower);
  drawButton(760, 115, 180, 30, 'Zapper $75', '#39d353', state.gold >= 75 && !state.placingTower);
  drawButton(760, 150, 180, 30, 'Cannon $100', '#f0883e', state.gold >= 100 && !state.placingTower);
  drawButton(760, 200, 180, 20, 'Target: ' + state.targetingMode.replace('_',' '), '#30363d', true);
  drawButton(760, 240, 180, 30, state.waveProgress === 'idle' ? 'Start Wave ' + (state.wave + 1) : 'Wave ' + state.wave + ' active', '#3fb950', state.waveProgress === 'idle');
  // Help
  ctx.fillStyle = '#8b949e';
  ctx.font = '11px Courier New';
  ctx.fillText('Right-click to cancel', 760, 290);
  ctx.fillText('Lvl 2: 0.5x cost | Lvl 3: 0.5x cost', 760, 305);
  ctx.fillText('Sell value: 60% of total', 760, 320);
}
function drawButton(x, y, w, h, text, color, enabled) {
  ctx.fillStyle = enabled ? color : '#21262d';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = enabled ? '#e6edf3' : '#484f58';
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = enabled ? '#0d1117' : '#8b949e';
  ctx.font = 'bold 12px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + h / 2 + 4);
  ctx.textAlign = 'left';
}
function drawTowerPanel() {
  if (!state.selectedTower) return;
  const t = state.selectedTower;
  const def = t.def;
  // Panel background
  ctx.fillStyle = 'rgba(22, 27, 34, 0.95)';
  ctx.fillRect(750, 360, 200, 220);
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(750, 360, 200, 220);
  ctx.fillStyle = def.color;
  ctx.font = 'bold 14px Courier New';
  ctx.fillText(def.name + ' Lv' + t.level, 760, 380);
  ctx.fillStyle = '#e6edf3';
  ctx.font = '11px Courier New';
  ctx.fillText('DMG: ' + t.damage.toFixed(1), 760, 400);
  ctx.fillText('RNG: ' + (t.range/32).toFixed(1), 760, 415);
  ctx.fillText('ROF: ' + t.fireRate.toFixed(2) + '/s', 760, 430);
  ctx.fillText('HP: ' + Math.ceil(t.hp) + '/200', 760, 445);
  if (t.level < 3) {
    drawButton(760, 460, 100, 30, 'Upgrade $' + t.upgradeCost(), '#3fb950', state.gold >= t.upgradeCost());
  } else {
    drawButton(760, 460, 100, 30, 'MAX', '#30363d', false);
  }
  drawButton(870, 460, 70, 30, 'Sell $' + t.sellValue(), '#d29922', true);
}
function drawGameOver() {
  ctx.fillStyle = 'rgba(13, 17, 23, 0.85)';
  ctx.fillRect(0, 0, CFG.WIDTH, CFG.HEIGHT);
  ctx.fillStyle = '#da3633';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('PROTOCOL FAILED', CFG.WIDTH/2, CFG.HEIGHT/2 - 20);
  ctx.fillStyle = '#e6edf3';
  ctx.font = '18px Courier New';
  ctx.fillText('Survived ' + state.wave + ' waves', CFG.WIDTH/2, CFG.HEIGHT/2 + 20);
  ctx.fillText('Refresh to restart', CFG.WIDTH/2, CFG.HEIGHT/2 + 60);
  ctx.textAlign = 'left';
}
function drawVictory() {
  ctx.fillStyle = 'rgba(13, 17, 23, 0.85)';
  ctx.fillRect(0, 0, CFG.WIDTH, CFG.HEIGHT);
  ctx.fillStyle = '#3fb950';
  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('CONTAINMENT SUCCESS', CFG.WIDTH/2, CFG.HEIGHT/2 - 20);
  ctx.fillStyle = '#e6edf3';
  ctx.font = '18px Courier New';
  ctx.fillText('All 30 waves cleared', CFG.WIDTH/2, CFG.HEIGHT/2 + 20);
  ctx.fillText('Refresh to restart', CFG.WIDTH/2, CFG.HEIGHT/2 + 60);
  ctx.textAlign = 'left';
}
requestAnimationFrame(loop);
