// Crimson Trail - Main Game Loop
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W, H;
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

// Seeded RNG
function mulberry32(a) { return function() { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; } }
const seed = Math.floor(Math.random() * 1e9);
const rng = mulberry32(seed);

// Audio
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function beep(freq, dur, type='sine', vol=0.1) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq; g.gain.value = vol;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
  o.stop(audioCtx.currentTime + dur);
}

// World constants
const WORLD = 4000, TILE = 40;
const COL = { bg:'#1a1208', dirt:'#3d2817', grass:'#2a3a1f', tree:'#0f1a08', rock:'#4a4a4a', beast:'#a01010', player:'#d4a574', fog:'rgba(180,200,180,0.08)' };

// Generate world
const trees = [], rocks = [], grass = [], caches = [], circles = [], flora = [];
const grid = new Uint8Array((WORLD/TILE)*(WORLD/TILE));
function idx(x,y) { return Math.floor(y/TILE)*(WORLD/TILE) + Math.floor(x/TILE); }
for (let i = 0; i < 800; i++) { const x = rng()*WORLD, y = rng()*WORLD; trees.push({x,y,r:18+rng()*10}); grid[idx(x,y)] = 1; }
for (let i = 0; i < 300; i++) { const x = rng()*WORLD, y = rng()*WORLD; rocks.push({x,y,r:14+rng()*8}); }
for (let i = 0; i < 200; i++) grass.push({x:rng()*WORLD, y:rng()*WORLD, r:25+rng()*15});
for (let i = 0; i < 5; i++) caches.push({x:200+rng()*(WORLD-400), y:200+rng()*(WORLD-400), opened:false});
for (let i = 0; i < 3; i++) circles.push({x:400+rng()*(WORLD-800), y:400+rng()*(WORLD-800), marked:i, observed:0});
for (let i = 0; i < 8; i++) flora.push({x:rng()*WORLD, y:rng()*WORLD, snap:false});

// Player
const player = { x:WORLD/2, y:WORLD/2, vx:0, vy:0, angle:0, crouch:false, run:false, stamina:100, noise:0, flare:3, lens:false, lensBat:100, cloak:0, cloakCD:0, observe:0, detected:0, time:0, dist:0, lastX:WORLD/2, lastY:WORLD/2, high:parseInt(localStorage.getItem('ct_high')||'0') };
document.getElementById('highscore').textContent = 'Best: ' + (player.high?Math.floor(player.high/60)+'m':'-');

// Beast
const beast = { x:600, y:600, vx:0, vy:0, angle:rng()*Math.PI*2, state:'roam', timer:0, target:null, roamTimer:0, scent:[] };
let flare = null;

// Camera
const cam = { x:player.x, y:player.y };

// Input
const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; if(e.key>='1'&&e.key<='3') tools(parseInt(e.key)); });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
window.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  const mx = (e.clientX-r.left)*(canvas.width/r.width);
  const my = (e.clientY-r.top)*(canvas.height/r.height);
  player.angle = Math.atan2(my-H/2, mx-W/2);
});
window.addEventListener('click', e => {
  initAudio();
  if (player.lens && player.lensBat > 5) {
    for (let f of flora) if (Math.hypot(f.x-player.x, f.y-player.y) < 40 && !f.snap) { f.snap = true; beep(1200, 0.1); }
  }
});

function tools(n) {
  if (n === 1) { player.lens = !player.lens; beep(800, 0.05, 'square'); }
  if (n === 2 && player.flare > 0 && !flare) {
    player.flare--;
    flare = { x:player.x, y:player.y, r:0, t:0 };
    beep(600, 0.2, 'sawtooth', 0.2);
  }
  if (n === 3 && player.cloakCD <= 0 && player.cloak <= 0) {
    player.cloak = 600; player.cloakCD = 5400;
    beep(400, 0.3, 'sine');
  }
}

// Game state
let gameState = 'menu';
let startTime = 0;

document.getElementById('start').onclick = () => { initAudio(); document.getElementById('menu').classList.add('hidden'); gameState='play'; startTime=Date.now(); };
document.getElementById('restart').onclick = () => location.reload();

function update() {
  if (gameState !== 'play') return;
  player.time = (Date.now()-startTime)/1000;

  // Movement
  let dx=0, dy=0;
  if (keys.w) dy=-1; if (keys.s) dy=1; if (keys.a) dx=-1; if (keys.d) dx=1;
  player.run = keys.shift ? false : keys[' '];
  player.crouch = keys.shift || player.cloak > 0;
  const len = Math.hypot(dx,dy);
  if (len > 0) { dx/=len; dy/=len; }
  let spd = player.crouch ? 1.5 : (player.run && player.stamina>0 ? 5.5 : 3.5);
  if (player.run && len>0) player.stamina = Math.max(0, player.stamina - 0.5);
  else player.stamina = Math.min(100, player.stamina + 0.3);
  player.vx = dx*spd; player.vy = dy*spd;
  if (len === 0) { player.vx *= 0.85; player.vy *= 0.85; }
  const nx = player.x + player.vx, ny = player.y + player.vy;
  let collide = false;
  for (let t of trees) if (Math.hypot(nx-t.x, ny-t.y) < t.r+6) collide = true;
  for (let r of rocks) if (Math.hypot(nx-r.x, ny-r.y) < r.r+6) collide = true;
  if (!collide) { player.x = nx; player.y = ny; }
  player.x = Math.max(20, Math.min(WORLD-20, player.x));
  player.y = Math.max(20, Math.min(WORLD-20, player.y));
  player.dist += Math.hypot(player.x-player.lastX, player.y-player.lastY);
  player.lastX = player.x; player.lastY = player.y;

  // Noise
  let n = 0;
  if (len > 0) n = player.crouch ? 3 : (player.run ? 35 : 15);
  if (player.cloak > 0) n = 0;
  player.noise = n;

  // Lens battery
  if (player.lens) player.lensBat = Math.max(0, player.lensBat - 0.05);
  else player.lensBat = Math.min(100, player.lensBat + 0.02);
  if (player.lensBat <= 0) player.lens = false;

  // Cloak
  if (player.cloak > 0) player.cloak--;
  if (player.cloakCD > 0) player.cloakCD--;

  // Flare
  if (flare) {
    flare.t++;
    flare.r = Math.min(flare.t*2, 600);
    if (flare.t > 180) flare = null;
  }

  // Beast AI
  updateBeast();

  // Detection meter
  let detect = 0;
  const bdx = beast.x - player.x, bdy = beast.y - player.y;
  const bdist = Math.hypot(bdx, bdy);
  if (bdist < 500) {
    const ang = Math.atan2(bdy, bdx);
    let diff = Math.abs(ang - beast.angle);
    while (diff > Math.PI) diff -= Math.PI*2;
    if (Math.abs(diff) < 0.6 && bdist < 300) detect += 1.5;
    if (n > 20) detect += n*0.05;
    if (flare) detect += 2;
  }
  if (player.cloak > 0) detect = 0;
  player.detected = Math.max(0, Math.min(100, player.detected + (detect - 0.2)));

  if (player.detected >= 100) {
    gameState = 'lose';
    const final = player.time;
    if (final > player.high) { player.high = final; localStorage.setItem('ct_high', Math.floor(final)); }
    document.getElementById('endstats').innerHTML = `Time: ${Math.floor(final)}s<br>Distance: ${Math.floor(player.dist)}<br>The Forest Remembers.`;
    setTimeout(()=>{ document.getElementById('endscreen').classList.remove('hidden'); document.getElementById('endscreen').querySelector('h2').textContent='The Forest Remembers'; }, 1000);
  }

  // Camera
  cam.x += (player.x - cam.x) * 0.1;
  cam.y += (player.y - cam.y) * 0.1;

  // Observe circles
  for (let c of circles) {
    if (!c.marked) continue;
    if (bdist < 200 && Math.hypot(c.x-player.x, c.y-player.y) < 150 && player.detected < 30) {
      c.observed += 1/60;
      if (c.observed >= 30 && c.observed < 31) {
        c.marked = false;
        const allDone = circles.every(cc => !cc.marked || cc.observed >= 30);
        if (allDone) {
          gameState = 'win';
          const final = player.time;
          if (final > player.high) { player.high = final; localStorage.setItem('ct_high', Math.floor(final)); }
          document.getElementById('endstats').innerHTML = `Time: ${Math.floor(final)}s<br>Distance: ${Math.floor(player.dist)}<br>Encounter Complete!`;
          setTimeout(()=>{ document.getElementById('endscreen').classList.remove('hidden'); document.getElementById('endscreen').querySelector('h2').textContent='Encounter Complete'; }, 500);
        }
      }
    } else c.observed = 0;
  }

  // Prompt
  let p = '';
  for (let c of caches) if (!c.opened && Math.hypot(c.x-player.x, c.y-player.y) < 30) { p = '[E] Open Cache'; break; }
  if (keys.e) {
    for (let c of caches) if (!c.opened && Math.hypot(c.x-player.x, c.y-player.y) < 30) { c.opened = true; player.flare = Math.min(5, player.flare+1); beep(1000, 0.1); }
  }
  const pe = document.getElementById('prompt');
  if (p) { pe.textContent = p; pe.classList.add('show'); } else pe.classList.remove('show');
}

function updateBeast() {
  beast.roamTimer--;
  if (beast.roamTimer <= 0) {
    beast.angle = rng()*Math.PI*2;
    beast.roamTimer = 60 + rng()*180;
  }
  let spd = beast.state === 'hunt' ? 6 : (beast.state === 'investigate' ? 4 : 2);
  beast.vx = Math.cos(beast.angle) * spd;
  beast.vy = Math.sin(beast.angle) * spd;
  beast.x += beast.vx; beast.y += beast.vy;
  beast.x = Math.max(50, Math.min(WORLD-50, beast.x));
  beast.y = Math.max(50, Math.min(WORLD-50, beast.y));
  if (rng() < 0.02) beast.angle += (rng()-0.5)*2;

  // Scent
  if (rng() < 0.3) beast.scent.push({x:beast.x, y:beast.y, t:300});
  beast.scent = beast.scent.filter(s => --s.t > 0);

  const bdx = beast.x - player.x, bdy = beast.y - player.y;
  const bdist = Math.hypot(bdx, bdy);
  if (bdist < 300 && player.detected > 60) beast.state = 'hunt';
  else if (player.detected > 30) beast.state = 'investigate';
  else if (player.detected < 5) beast.state = 'roam';

  // Chase if player visible
  if (bdist < 400 && player.detected > 50) {
    beast.angle = Math.atan2(player.y - beast.y, player.x - beast.x);
  }
}

function render() {
  ctx.fillStyle = COL.bg;
  ctx.fillRect(0,0,W,H);

  const scale = Math.min(W, H) / 600;
  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.scale(scale, scale);
  ctx.translate(-cam.x, -cam.y);

  // Ground
  for (let g of grass) {
    ctx.fillStyle = COL.grass;
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI*2); ctx.fill();
  }

  // Tracks (simplified)
  if (player.lens && player.lensBat > 0) {
    ctx.fillStyle = 'rgba(255,180,0,0.4)';
    for (let s of beast.scent) {
      ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI*2); ctx.fill();
    }
  }

  // Trees & rocks
  for (let r of rocks) {
    ctx.fillStyle = COL.rock;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI*2); ctx.fill();
  }
  for (let t of trees) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.arc(t.x+4, t.y+4, t.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = COL.tree;
    ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI*2); ctx.fill();
  }

  // Beast
  ctx.save();
  ctx.translate(beast.x, beast.y);
  ctx.rotate(beast.angle);
  ctx.fillStyle = beast.state === 'hunt' ? '#ff3030' : COL.beast;
  ctx.beginPath(); ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillRect(20, -2, 8, 4);
  ctx.restore();

  // Caches
  for (let c of caches) {
    if (!c.opened) { ctx.fillStyle = '#d4a020'; ctx.fillRect(c.x-5, c.y-5, 10, 10); }
  }

  // Circles
  for (let c of circles) {
    if (c.marked) { ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x, c.y, 60, 0, Math.PI*2); ctx.stroke(); }
  }

  // Player
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.globalAlpha = player.cloak > 0 ? 0.4 : 1;
  ctx.fillStyle = COL.player;
  ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(8, -1, 6, 2);
  ctx.restore();
  ctx.globalAlpha = 1;

  // Flare
  if (flare) {
    ctx.strokeStyle = 'rgba(255,100,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(flare.x, flare.y, flare.r, 0, Math.PI*2); ctx.stroke();
  }

  // Vision
  const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 250);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = grad;
  ctx.fillRect(cam.x-1000, cam.y-1000, 2000, 2000);

  ctx.restore();

  // Fog overlay
  if (player.detected > 30) {
    ctx.fillStyle = `rgba(${Math.min(255,player.detected*2)},0,0,${player.detected/400})`;
    ctx.fillRect(0,0,W,H);
  }

  // HUD updates
  document.getElementById('noiseBar').style.setProperty('--h', player.noise+'%');
  document.getElementById('noiseBar').querySelector(':after') || (document.getElementById('noiseBar').style.height = player.noise+'%');
  document.getElementById('noiseBar').style.setProperty('height', player.noise+'%');
  document.getElementById('noiseBar').after;
  document.getElementById('staminaBar').style.height = player.stamina+'%';
  document.getElementById('detect').style.height = player.detected*2+'px';
  const t = Math.floor(player.time);
  document.getElementById('timer').textContent = Math.floor(t/60).toString().padStart(2,'0')+':'+(t%60).toString().padStart(2,'0');

  // Heartbeat
  if (player.detected > 70 && Math.floor(player.time*2)%2===0) beep(60, 0.05, 'sine', 0.05);
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}
loop();