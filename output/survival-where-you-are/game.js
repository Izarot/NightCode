// Project Drift - Ocean Survival
const C = document.getElementById('game');
const ctx = C.getContext('2d');
const DPR = Math.min(window.devicePixelRatio || 1, 2);

// --- Sound System (Web Audio API) ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audio = new AudioCtx();
function beep(freq, dur, type='sine', vol=0.15) {
  try {
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
    o.connect(g); g.connect(audio.destination);
    o.start(); o.stop(audio.currentTime + dur);
  } catch(e) {}
}
function sfxCollect() { beep(660, 0.1); setTimeout(()=>beep(880, 0.1), 60); }
function sfxCraft() { beep(440, 0.08); setTimeout(()=>beep(660, 0.08), 50); setTimeout(()=>beep(880, 0.15), 110); }
function sfxHurt() { beep(120, 0.3, 'sawtooth', 0.2); }
function sfxStorm() { beep(80, 0.5, 'triangle', 0.1); }
function sfxShark() { beep(150, 0.4, 'sawtooth', 0.18); setTimeout(()=>beep(100, 0.4, 'sawtooth', 0.18), 200); }
function sfxJump() { beep(300, 0.1, 'sine', 0.1); }
function sfxClick() { beep(700, 0.05); }

// --- Vibrant Color Palette ---
const PAL = {
  deepOcean: '#0a2540',
  midOcean: '#1e5a8e',
  shallow: '#3aa9d6',
  foam: '#a0e8ff',
  raftWood: '#a0703d',
  raftDark: '#6b4423',
  raftLight: '#d49858',
  player: '#ffd166',
  playerShirt: '#06d6a0',
  shark: '#4a4a5a',
  sharkFin: '#2d2d3a',
  debris: '#c9a574',
  barrel: '#8b4513',
  barrelBand: '#5d2f0c',
  fish: '#ff8c42',
  seaweed: '#2db34a',
  rain: '#7ec8ff',
  stormSky: '#2c3e50',
  uiGlow: '#7edcff',
  health: '#ff4d6d',
  hunger: '#ffd166',
  thirst: '#4cc9f0',
  stamina: '#80ed99'
};

// --- Responsive Canvas ---
function resizeCanvas() {
  C.width = window.innerWidth * DPR;
  C.height = window.innerHeight * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let W = window.innerWidth;
let H = window.innerHeight;
window.addEventListener('resize', () => { W = window.innerWidth; H = window.innerHeight; });

// --- Game State ---
const state = {
  running: true,
  startTime: Date.now(),
  elapsed: 0,
  highScore: parseInt(localStorage.getItem('drift_highscore') || '0'),
  gameOver: false
};
document.getElementById('hs-val').textContent = state.highScore;

// --- World ---
const world = {
  raftX: 0, raftY: 0,
  raftVX: 0, raftVY: 0,
  currentX: 0.3, currentY: 0.1,
  wave: 0, storm: 0, stormTimer: 0,
  timeOfDay: 0.3,
  debris: [],
  fish: [],
  sharks: [],
  bubbles: [],
  raindrops: [],
  islands: [],
  particles: []
};

// --- Player ---
const player = {
  x: 0, y: 0,
  vx: 0, vy: 0,
  onRaft: true, swimming: false,
  health: 100, hunger: 100, thirst: 100, stamina: 100,
  bleed: 0,
  bob: 0,
  facing: 0,
  inventory: { wood: 8, rope: 4, leaf: 3, rawFish: 0, water: 2, scrap: 1, copper: 0 },
  hotbar: ['hook','rod','spear','bucket','paddle','sail','anchor','torch'],
  selected: 0,
  tools: { hook: true, rod: true, spear: false, bucket: false, paddle: true, sail: false, anchor: false, torch: false }
};

// --- Initialize Islands ---
for (let i = 0; i < 5; i++) {
  const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.5;
  const dist = 1500 + Math.random() * 2000;
  world.islands.push({
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    r: 80 + Math.random() * 60,
    found: false
  });
}

// --- Initialize Debris Field ---
function spawnDebris(n) {
  for (let i = 0; i < n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * 800;
    world.debris.push({
      x: world.raftX + Math.cos(angle) * dist,
      y: world.raftY + Math.sin(angle) * dist,
      type: ['plank','barrel','leaf','crate'][Math.floor(Math.random()*4)],
      vx: 0, vy: 0, hp: 100
    });
  }
}
spawnDebris(40);

// --- Spawn Fish ---
function spawnFish() {
  for (let i = 0; i < 15; i++) {
    const a = Math.random() * Math.PI * 2;
    world.fish.push({
      x: world.raftX + Math.cos(a) * (200 + Math.random()*600),
      y: world.raftY + Math.sin(a) * (200 + Math.random()*600),
      kind: Math.random() < 0.85 ? 'fish' : 'puffer',
      vx: 0, vy: 0, t: Math.random()*10
    });
  }
}
spawnFish();

// --- Sharks ---
function spawnShark() {
  const a = Math.random() * Math.PI * 2;
  world.sharks.push({
    x: world.raftX + Math.cos(a) * 600,
    y: world.raftY + Math.sin(a) * 600,
    vx: 0, vy: 0, aggro: 0, angle: a
  });
}
spawnShark();

// --- Input ---
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key >= '1' && e.key <= '8') player.selected = parseInt(e.key) - 1;
  if (e.key.toLowerCase() === 'tab' || e.key.toLowerCase() === 'q') openCraft();
  if (e.key.toLowerCase() === 'e') tryGather();
  if (e.key.toLowerCase() === 'r') tryRow();
  if (e.key === ' ') { tryJumpOff(); e.preventDefault(); }
});
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

document.getElementById('msg-btn').addEventListener('click', () => {
  document.getElementById('message-overlay').classList.remove('show');
  sfxClick();
});

// --- Notifications ---
function notify(msg, type='info') {
  const div = document.createElement('div');
  div.className = 'toast ' + type;
  div.textContent = msg;
  document.getElementById('notifications').appendChild(div);
  setTimeout(() => div.remove(), 5000);
}

// --- Player Actions ---
function tryJumpOff() {
  if (player.onRaft && player.stamina > 10) {
    player.onRaft = false; player.swimming = true;
    player.stamina -= 15;
    sfxJump();
    notify('You dive into the water', 'info');
  } else if (!player.onRaft) {
    // Climb back if near raft
    const dx = player.x - world.raftX, dy = player.y - world.raftY;
    if (Math.hypot(dx, dy) < 60) {
      player.onRaft = true; player.swimming = false;
      player.x = world.raftX; player.y = world.raftY;
      notify('Climbed back onto raft', 'success');
    }
  }
}

function tryGather() {
  if (!player.onRaft) return;
  const tool = player.hotbar[player.selected];
  if (!player.tools[tool]) { notify('You don\'t have that tool', 'danger'); return; }
  let closest = null, cdist = 90;
  for (const d of world.debris) {
    const dist = Math.hypot(d.x - player.x, d.y - player.y);
    if (dist < cdist) { closest = d; cdist = dist; }
  }
  if (closest) {
    closest.hp -= 50;
    player.stamina -= 5;
    if (closest.hp <= 0) {
      const t = closest.type;
      if (t === 'plank') player.inventory.wood += 2;
      else if (t === 'barrel') { player.inventory.wood += 1; player.inventory.rope += 1; player.inventory.scrap += 1; }
      else if (t === 'leaf') player.inventory.leaf += 2;
      else if (t === 'crate') { player.inventory.wood += 2; player.inventory.scrap += 2; if (Math.random() < 0.3) player.inventory.copper += 1; }
      world.debris.splice(world.debris.indexOf(closest), 1);
      sfxCollect();
      notify('Collected ' + t + '!', 'success');
      // Sparkle
      for (let i = 0; i < 6; i++) world.particles.push({ x: closest.x, y: closest.y, vx: (Math.random()-0.5)*3, vy: (Math.random()-0.5)*3, life: 30, color: PAL.foam });
    }
    if (world.debris.length < 20) spawnDebris(15);
  } else {
    // Try fishing
    if (tool === 'rod' || tool === 'spear') {
      const fc = world.fish.find(f => Math.hypot(f.x - player.x, f.y - player.y) < 70);
      if (fc) {
        if (fc.kind === 'puffer') {
          player.health -= 20;
          notify('Ate poisonous pufferfish! -20 HP', 'danger');
          sfxHurt();
        } else {
          player.inventory.rawFish = (player.inventory.rawFish || 0) + 1;
          player.hunger = Math.min(100, player.hunger + 15);
          sfxCollect();
          notify('Caught a fish!', 'success');
        }
        world.fish.splice(world.fish.indexOf(fc), 1);
      }
    }
  }
}

function tryRow() {
  if (!player.onRaft) return;
  if (!player.tools.paddle) { notify('No paddle!', 'danger'); return; }
  if (player.stamina < 5) { notify('Too tired to row', 'danger'); return; }
  player.stamina -= 8;
  const fx = Math.cos(player.facing) * 0.6;
  const fy = Math.sin(player.facing) * 0.6;
  world.raftVX += fx;
  world.raftVY += fy;
  // Wake particles
  for (let i = 0; i < 3; i++) world.particles.push({ x: world.raftX, y: world.raftY, vx: -fx*2 + (Math.random()-0.5), vy: -fy*2 + (Math.random()-0.5), life: 25, color: PAL.foam });
  sfxClick();
}

function openCraft() {
  sfxClick();
  const recipes = [
    { name: 'Spear', cost: { wood: 3, scrap: 1 }, tool: 'spear' },
    { name: 'Water Bucket', cost: { wood: 2, rope: 1 }, tool: 'bucket' },
    { name: 'Anchor', cost: { rope: 3, scrap: 2 }, tool: 'anchor' },
    { name: 'Sail', cost: { leaf: 4, rope: 2, wood: 2 }, tool: 'sail' },
    { name: 'Torch', cost: { wood: 1, leaf: 1 }, tool: 'torch' },
  ];
  let msg = 'CRAFT (press Q to close)\n\n';
  for (const r of recipes) {
    const can = canCraft(r.cost);
    msg += (can ? '✅' : '❌') + ' ' + r.name + ': ';
    for (const k in r.cost) msg += r.cost[k] + ' ' + k + ' ';
    msg += '\n';
  }
  // Try craft first available
  for (const r of recipes) {
    if (canCraft(r.cost)) {
      for (const k in r.cost) player.inventory[k] -= r.cost[k];
      player.tools[r.tool] = true;
      sfxCraft();
      notify('Crafted ' + r.name + '!', 'success');
      return;
    }
  }
  notify('Need more materials to craft', 'danger');
}

function canCraft(cost) {
  for (const k in cost) if ((player.inventory[k] || 0) < cost[k]) return false;
  return true;
}

// --- Update ---
let frameCount = 0;
function update() {
  if (state.gameOver) return;
  frameCount++;
  state.elapsed = Math.floor((Date.now() - state.startTime) / 1000);

  // Update timer & highscore
  if (state.elapsed > state.highScore) {
    state.highScore = state.elapsed;
    localStorage.setItem('drift_highscore', state.highScore);
  }
  document.getElementById('hs-val').textContent = state.highScore;
  const m = String(Math.floor(state.elapsed / 60)).padStart(2,'0');
  const s = String(state.elapsed % 60).padStart(2,'0');
  document.getElementById('timer').textContent = '⏱ ' + m + ':' + s;

  // Wave + time
  world.wave += 0.05;
  world.timeOfDay += 0.0001;
  if (world.timeOfDay > 1) world.timeOfDay = 0;

  // Storm system
  world.stormTimer -= 1/60;
  if (world.stormTimer <= 0) {
    world.storm = Math.random() < 0.3 ? 1 : 0;
    world.stormTimer = 600 + Math.random() * 600;
    if (world.storm) { notify('🌩 STORM INCOMING!', 'danger'); sfxStorm(); }
  }
  const stormForce = world.storm ? 1.5 : 1;

  // Raft physics - drift + rowing
  world.raftVX += world.currentX * 0.01 * stormForce;
  world.raftVY += world.currentY * 0.01 * stormForce;
  if (player.tools.anchor) {
    world.raftVX *= 0.92;
    world.raftVY *= 0.92;
  } else {
    world.raftVX *= 0.98;
    world.raftVY *= 0.98;
  }
  // Wind gusts
  if (frameCount % 240 === 0) {
    world.raftVX += (Math.random()-0.5) * 0.5;
    world.raftVY += (Math.random()-0.5) * 0.5;
  }
  world.raftX += world.raftVX;
  world.raftY += world.raftVY;

  // Player movement
  let mx = 0, my = 0;
  if (keys['a'] || keys['arrowleft']) mx -= 1;
  if (keys['d'] || keys['arrowright']) mx += 1;
  if (keys['w'] || keys['arrowup']) my -= 1;
  if (keys['s'] || keys['arrowdown']) my += 1;
  if (mx || my) {
    const len = Math.hypot(mx, my);
    player.facing = Math.atan2(my, mx);
    const sprint = keys['shift'] ? 1.8 : 1;
    const spd = (player.onRaft ? 3 : 1.6) * sprint;
    player.vx = (mx / len) * spd;
    player.vy = (my / len) * spd;
    if (sprint > 1) player.stamina -= 0.3;
  } else { player.vx *= 0.7; player.vy *= 0.7; }

  if (player.onRaft) {
    player.x += player.vx;
    player.y += player.vy;
    // Confine to raft
    player.x = Math.max(world.raftX - 50, Math.min(world.raftX + 50, player.x));
    player.y = Math.max(world.raftY - 50, Math.min(world.raftY + 50, player.y));
  } else {
    // Swimming
    player.x += player.vx * 0.7;
    player.y += player.vy * 0.7;
    // Drift with currents
    player.x += world.currentX * 0.3;
    player.y += world.currentY * 0.3;
    player.stamina -= 0.25;
    if (player.stamina <= 0) {
      player.health -= 0.2;
      player.stamina = 0;
    }
  }
  player.bob += 0.1;

  // Survival decay
  player.thirst -= 0.008;
  player.hunger -= 0.005;
  if (player.thirst <= 0) { player.health -= 0.05; player.thirst = 0; }
  if (player.hunger <= 0) { player.health -= 0.04; player.hunger = 0; }
  // Regen stamina
  if (Math.abs(player.vx) < 0.5 && Math.abs(player.vy) < 0.5) player.stamina = Math.min(100, player.stamina + 0.15);
  // Bleed
  if (player.bleed > 0) { player.health -= player.bleed; player.bleed -= 0.01; }
  if (player.health <= 0) gameOver();

  // Water drinking
  if (player.thirst < 30 && player.inventory.water > 0 && keys['e']) {
    // Already handled in gather
  }
  // Auto-drink water when very thirsty? No - require manual.
  if (player.thirst < 10) notify('You are severely dehydrated!', 'danger');

  // Shark AI
  if (frameCount % 600 === 0 && world.sharks.length < 3) spawnShark();
  for (const s of world.sharks) {
    const dx = player.x - s.x, dy = player.y - s.y;
    const d = Math.hypot(dx, dy);
    s.angle += 0.02;
    const cx = player.x + Math.cos(s.angle) * 250;
    const cy = player.y + Math.sin(s.angle) * 250;
    if (!player.onRaft && d < 400) {
      // Charge!
      s.vx = (dx / d) * 3;
      s.vy = (dy / d) * 3;
      s.aggro = 1;
    } else {
      // Circle
      s.vx = (cx - s.x) * 0.02;
      s.vy = (cy - s.y) * 0.02;
    }
    s.x += s.vx;
    s.y += s.vy;
    // Bite
    if (d < 25) {
      player.health -= 35;
      player.bleed = 0.2;
      sfxHurt();
      sfxShark();
      notify('🦈 Shark bite! -35 HP', 'danger');
      // Knock back
      s.x -= dx * 2; s.y -= dy * 2;
    }
  }

  // Fish movement
  for (const f of world.fish) {
    f.t += 0.05;
    f.x += Math.cos(f.t) * 0.5;
    f.y += Math.sin(f.t * 0.7) * 0.5;
  }
  if (world.fish.length < 10) spawnFish();

  // Debris physics
  for (const d of world.debris) {
    d.x += world.currentX * 0.2;
    d.y += world.currentY * 0.2;
    d.vx *= 0.95; d.vy *= 0.95;
  }

  // Bubbles
  if (frameCount % 30 === 0) {
    world.bubbles.push({
      x: world.raftX + (Math.random()-0.5)*60,
      y: world.raftY + (Math.random()-0.5)*60,
      r: 2 + Math.random()*3, life: 60
    });
  }
  for (const b of world.bubbles) { b.y -= 0.5; b.life--; }
  world.bubbles = world.bubbles.filter(b => b.life > 0);

  // Rain
  world.raindrops = [];
  if (world.storm) {
    for (let i = 0; i < 80; i++) {
      world.raindrops.push({
        x: player.x - W/2 + Math.random()*W,
        y: player.y - H/2 + Math.random()*H
      });
    }
  }

  // Particles
  for (const p of world.particles) {
    p.x += p.vx; p.y += p.vy; p.life--;
    p.vy += 0.05;
  }
  world.particles = world.particles.filter(p => p.life > 0);

  // Islands check
  for (const isl of world.islands) {
    if (!isl.found) {
      const d = Math.hypot(isl.x - world.raftX, isl.y - world.raftY);
      if (d < 800) {
        isl.found = true;
        notify('🏝️ You spotted an island!', 'success');
      }
    }
  }

  // Compass
  let nearest = null, nd = Infinity;
  for (const isl of world.islands) {
    const d = Math.hypot(isl.x - world.raftX, isl.y - world.raftY);
    if (d < nd) { nd = d; nearest = isl; }
  }
  const compA = document.getElementById('compass-arrow');
  const compL = document.getElementById('compass-label');
  if (nearest && nd < 3000) {
    const a = Math.atan2(nearest.y - world.raftY, nearest.x - world.raftX);
    compA.style.transform = `rotate(${a * 180 / Math.PI + 90}deg)`;
    const dir = a < -Math.PI/2 ? 'S' : a < 0 ? 'E' : a < Math.PI/2 ? 'N' : 'W';
    compL.textContent = 'Island: ' + Math.round(nd) + 'm ' + dir;
    document.getElementById('compass-island').textContent = 'Nearest: ' + Math.round(nd) + 'm';
  } else {
    compA.style.transform = 'rotate(0deg)';
    compL.textContent = 'Drifting...';
    document.getElementById('compass-island').textContent = 'No islands nearby';
  }

  // HUD
  updateHUD();
}

function updateHUD() {
  const stats = document.getElementById('stats');
  const inv = player.inventory;
  const items = [
    { icon: '❤️', key: 'health', color: PAL.health, label: 'HP' },
    { icon: '🍖', key: 'hunger', color: PAL.hunger, label: 'HUNGER' },
    { icon: '💧', key: 'thirst', color: PAL.thirst, label: 'THIRST' },
    { icon: '⚡', key: 'stamina', color: PAL.stamina, label: 'STAM' }
  ];
  let html = '';
  for (const it of items) {
    const v = player[it.key];
    const c = 2 * Math.PI * 16;
    const off = c - (v / 100) * c;
    html += `<div class="stat-row"><div class="stat-ring"><svg width="42" height="42"><circle class="bg" cx="21" cy="21" r="16"/><circle class="fg" cx="21" cy="21" r="16" stroke="${it.color}" stroke-dasharray="${c}" stroke-dashoffset="${off}"/></svg><div class="icon">${it.icon}</div></div><div><div class="stat-label">${it.label}</div><div style="font-size:14px;font-weight:bold;">${Math.round(v)}</div></div></div>`;
  }
  stats.innerHTML = html;

  // Hotbar
  const hb = document.getElementById('hotbar');
  const tools = ['hook','rod','spear','bucket','paddle','sail','anchor','torch'];
  const icons = { hook: '🪝', rod: '🎣', spear: '🔱', bucket: '🪣', paddle: '🛶', sail: '⛵', anchor: '⚓', torch: '🔦' };
  let h = '';
  for (let i = 0; i < tools.length; i++) {
    const has = player.tools[tools[i]];
    h += `<div class="slot ${i===player.selected?'active':''}" style="opacity:${has?1:0.35};">${icons[tools[i]]}${has?'':'<div class="count">?</div>'}</div>`;
  }
  hb.innerHTML = h;
}

function gameOver() {
  state.gameOver = true;
  const m = String(Math.floor(state.elapsed / 60)).padStart(2,'0');
  const s = String(state.elapsed % 60).padStart(2,'0');
  document.getElementById('msg-title').textContent = '☠️ You Perished';
  document.getElementById('msg-body').innerHTML = `You survived <b>${m}:${s}</b>. The ocean reclaims all. ${player.bleed > 0 ? 'Bled out from wounds.' : player.thirst <= 0 ? 'Died of thirst.' : player.hunger <= 0 ? 'Starved to death.' : 'Shark attack.'}`;
  document.getElementById('message-overlay').classList.add('show');
  document.getElementById('msg-btn').textContent = 'Drift Again';
  document.getElementById('msg-btn').onclick = () => location.reload();
}

// --- Render ---
function render() {
  ctx.fillStyle = PAL.deepOcean;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(W/2, H/2);

  // Sky gradient overlay based on storm
  if (world.storm) {
    const grad = ctx.createRadialGradient(0,0,50,0,0,800);
    grad.addColorStop(0, 'rgba(44,62,80,0.3)');
    grad.addColorStop(1, 'rgba(44,62,80,0.7)');
    ctx.fillStyle = grad;
    ctx.fillRect(-W, -H, W*2, H*2);
  }

  // Translate world to player
  ctx.translate(-player.x, -player.y);

  // Water waves background
  const t = world.wave;
  for (let i = 0; i < 30; i++) {
    const waveY = player.y - H + i * (H/15);
    ctx.beginPath();
    ctx.strokeStyle = i % 2 === 0 ? PAL.midOcean : PAL.shallow;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    for (let x = player.x - W; x < player.x + W; x += 8) {
      const wy = waveY + Math.sin((x + t*30) * 0.02 + i) * 6;
      if (x === player.x - W) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Islands
  for (const isl of world.islands) {
    const sx = isl.x - player.x, sy = isl.y - player.y;
    if (Math.abs(sx) > 1000 || Math.abs(sy) > 800) continue;
    // Sand
    ctx.fillStyle = '#e8d090';
    ctx.beginPath();
    ctx.ellipse(isl.x, isl.y, isl.r, isl.r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Vegetation
    ctx.fillStyle = PAL.seaweed;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(isl.x + Math.cos(a)*isl.r*0.5, isl.y + Math.sin(a)*isl.r*0.4 + 5, isl.r*0.25, 0, Math.PI*2);
      ctx.fill();
    }
    // Palm trees
    ctx.strokeStyle = '#5d3a1a'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const tx = isl.x + Math.cos(a)*isl.r*0.3;
      const ty = isl.y + Math.sin(a)*isl.r*0.3;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + Math.cos(a)*15, ty - 25);
      ctx.stroke();
      ctx.fillStyle = PAL.seaweed;
      ctx.beginPath();
      ctx.arc(tx + Math.cos(a)*15, ty - 25, 10, 0, Math.PI*2);
      ctx.fill();
    }
    if (isl.found && Math.hypot(isl.x - world.raftX, isl.y - world.raftY) < 500) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏝️ ISLAND', isl.x, isl.y - isl.r - 10);
    }
  }

  // Debris
  for (const d of world.debris) {
    const dx = d.x - player.x, dy = d.y - player.y;
    if (Math.abs(dx) > 600 || Math.abs(dy) > 500) continue;
    const bob = Math.sin(t + d.x*0.05) * 2;
    ctx.save();
    ctx.translate(d.x, d.y + bob);
    ctx.rotate(t * 0.5 + d.x * 0.01);
    if (d.type === 'plank') {
      ctx.fillStyle = PAL.raftWood;
      ctx.fillRect(-15, -3, 30, 6);
      ctx.strokeStyle = PAL.raftDark; ctx.lineWidth = 1;
      ctx.strokeRect(-15, -3, 30, 6);
    } else if (d.type === 'barrel') {
      ctx.fillStyle = PAL.barrel;
      ctx.fillRect(-8, -10, 16, 20);
      ctx.fillStyle = PAL.barrelBand;
      ctx.fillRect(-8, -3, 16, 3);
      ctx.fillStyle = '#3a1a06';
      ctx.beginPath(); ctx.arc(0, -10, 4, 0, Math.PI*2); ctx.fill();
    } else if (d.type === 'leaf') {
      ctx.fillStyle = PAL.seaweed;
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 6, t + d.x, 0, Math.PI*2);
      ctx.fill();
    } else if (d.type === 'crate') {
      ctx.fillStyle = '#9a6b3c';
      ctx.fillRect(-12, -10, 24, 20);
      ctx.strokeStyle = PAL.barrelBand; ctx.lineWidth = 2;
      ctx.strokeRect(-12, -10, 24, 20);
      ctx.beginPath();
      ctx.moveTo(-12, 0); ctx.lineTo(12, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Bubbles
  for (const b of world.bubbles) {
    ctx.fillStyle = 'rgba(160,232,255,0.6)';
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
  }

  // Fish
  for (const f of world.fish) {
    const fx = f.x - player.x, fy = f.y - player.y;
    if (Math.abs(fx) > 600 || Math.abs(fy) > 500) continue;
    ctx.save();
    ctx.translate(f.x, f.y + Math.sin(f.t)*3);
    ctx.rotate(Math.atan2(f.vy, f.vx) || Math.sin(f.t)*0.5);
    ctx.fillStyle = f.kind === 'puffer' ? '#e8b04c' : PAL.fish;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI*2);
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(16, -4); ctx.lineTo(16, 4); ctx.closePath();
    ctx.fill();
    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-4, -1, 2, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-4, -1, 1, 0, Math.PI*2); ctx.fill();
    // Puffer spikes
    if (f.kind === 'puffer') {
      ctx.strokeStyle = '#8a6a2c'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a)*6, Math.sin(a)*4);
        ctx.lineTo(Math.cos(a)*10, Math.sin(a)*8);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Sharks
  for (const s of world.sharks) {
    const sx = s.x - player.x, sy = s.y - player.y;
    if (Math.abs(sx) > 700 || Math.abs(sy) > 600) continue;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(Math.atan2(s.vy, s.vx));
    // Body
    ctx.fillStyle = PAL.shark;
    ctx.beginPath();
    ctx.moveTo(-25, 0);
    ctx.quadraticCurveTo(-10, -10, 15, -6);
    ctx.quadraticCurveTo(22, 0, 15, 6);
    ctx.quadraticCurveTo(-10, 10, -25, 0);
    ctx.fill();
    // Fin
    ctx.fillStyle = PAL.sharkFin;
    ctx.beginPath();
    ctx.moveTo(-5, -6);
    ctx.lineTo(0, -16);
    ctx.lineTo(5, -6);
    ctx.closePath();
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(-25, 0); ctx.lineTo(-35, -8); ctx.lineTo(-30, 0); ctx.lineTo(-35, 8); ctx.closePath();
    ctx.fill();
    // Eye
    ctx.fillStyle = s.aggro ? '#ff3333' : '#fff';
    ctx.beginPath(); ctx.arc(8, -2, 2, 0, Math.PI*2); ctx.fill();
    // Teeth
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(15, 4); ctx.lineTo(17, 7); ctx.lineTo(19, 4);
    ctx.fill();
    ctx.restore();
  }

  // Raft
  const raftBob = Math.sin(t) * 3;
  const raftTilt = Math.sin(t * 0.7) * 0.05;
  ctx.save();
  ctx.translate(world.raftX, world.raftY + raftBob);
  ctx.rotate(raftTilt);
  // Raft base
  ctx.fillStyle = PAL.raftWood;
  ctx.beginPath();
  ctx.ellipse(0, 0, 55, 14, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = PAL.raftLight;
  ctx.beginPath();
  ctx.ellipse(0, -2, 50, 8, 0, 0, Math.PI*2);
  ctx.fill();
  // Plank lines
  ctx.strokeStyle = PAL.raftDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-45, -3); ctx.lineTo(-45, 3);
  ctx.moveTo(-25, -5); ctx.lineTo(-25, 5);
  ctx.moveTo(0, -6); ctx.lineTo(0, 6);
  ctx.moveTo(25, -5); ctx.lineTo(25, 5);
  ctx.moveTo(45, -3); ctx.lineTo(45, 3);
  ctx.stroke();
  // Mast if sail
  if (player.tools.sail) {
    ctx.fillStyle = '#5d3a1a';
    ctx.fillRect(-2, -40, 4, 40);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(2, -38);
    ctx.lineTo(28, -20);
    ctx.lineTo(2, -5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Player
  const px = player.x, py = player.y + Math.sin(player.bob) * 1.5;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(player.facing);
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 8, 10, 4, 0, 0, Math.PI*2);
  ctx.fill();
  // Body (shirt)
  ctx.fillStyle = PAL.playerShirt;
  ctx.fillRect(-6, -2, 12, 10);
  // Head
  ctx.fillStyle = PAL.player;
  ctx.beginPath();
  ctx.arc(0, -8, 7, 0, Math.PI*2);
  ctx.fill();
  // Hair
  ctx.fillStyle = '#3a2418';
  ctx.beginPath();
  ctx.arc(0, -10, 6, Math.PI, 0);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(3, -8, 1.2, 0, Math.PI*2); ctx.fill();
  // Tool in hand
  const tool = player.hotbar[player.selected];
  if (player.tools[tool]) {
    ctx.save();
    ctx.translate(8, 0);
    if (tool === 'hook') {
      ctx.strokeStyle = '#888'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, 5); ctx.lineTo(4, 8); ctx.stroke();
    } else if (tool === 'rod') {
      ctx.strokeStyle = '#5d3a1a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(8, 0); ctx.stroke();
    } else if (tool === 'spear') {
      ctx.strokeStyle = '#5d3a1a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-2, -10); ctx.lineTo(10, 0); ctx.stroke();
      ctx.fillStyle = '#aaa';
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(14, -2); ctx.lineTo(12, 2); ctx.closePath(); ctx.fill();
    } else if (tool === 'paddle') {
      ctx.fillStyle = PAL.raftWood;
      ctx.fillRect(-2, -10, 4, 14);
      ctx.fillStyle = PAL.raftLight;
      ctx.beginPath(); ctx.ellipse(0, 5, 5, 3, 0, 0, Math.PI*2); ctx.fill();
    } else if (tool === 'torch') {
      ctx.fillStyle = '#5d3a1a';
      ctx.fillRect(-1, -10, 2, 12);
      ctx.fillStyle = '#ff8800';
      ctx.beginPath(); ctx.arc(0, -11, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath(); ctx.arc(0, -11, 2, 0, Math.PI*2); ctx.fill();
    } else if (tool === 'bucket') {
      ctx.fillStyle = '#888';
      ctx.fillRect(-4, -6, 8, 10);
      ctx.fillStyle = '#5d3a1a';
      ctx.fillRect(-5, -7, 10, 3);
    } else if (tool === 'anchor') {
      ctx.fillStyle = '#444';
      ctx.fillRect(-2, -8, 4, 12);
      ctx.beginPath(); ctx.arc(0, -8, 3, 0, Math.PI*2); ctx.fill();
    } else if (tool === 'sail') {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(6, 0); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();

  // Particles
  for (const p of world.particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 30;
    ctx.fillRect(p.x, p.y, 3, 3);
  }
  ctx.globalAlpha = 1;

  // Rain
  if (world.storm) {
    ctx.strokeStyle = PAL.rain;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const r of world.raindrops) {
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - 2, r.y + 10);
    }
    ctx.stroke();
  }

  ctx.restore();
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

// Resume audio on first interaction
document.addEventListener('click', () => { if (audio.state === 'suspended') audio.resume(); }, { once: true });
document.addEventListener('keydown', () => { if (audio.state === 'suspended') audio.resume(); }, { once: true });

loop();
