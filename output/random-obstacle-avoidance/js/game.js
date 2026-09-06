import { W, H, clamp, lerp, seedFromString, distXY } from './utils.js';
import { loadScores, addScore, getBest } from './storage.js';
import { Player } from './player.js';
import { ObstaclePool } from './obstacle.js';
import { Spawner } from './spawner.js';
import { StarField } from './background.js';
import { ParticlePool, TextPool } from './particles.js';
import { ScreenShake, FlashEffect } from './effects.js';
import { resumeAudio, playNearMiss, playDeath, playMilestone } from './audio.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const deathOverlay = document.getElementById('deathOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const seedInput = document.getElementById('seedInput');
const fluxTimer = document.getElementById('timerValue');
const bestValue = document.getElementById('bestValue');
const runValue = document.getElementById('runValue');
const missValue = document.getElementById('missValue');
const deathDuration = document.getElementById('deathDuration');
const deathBest = document.getElementById('deathBest');
const deathMisses = document.getElementById('deathMisses');
const deathMilestones = document.getElementById('deathMilestones');
const leaderList = document.getElementById('leaderList');
const reticle = document.getElementById('reticle');

let viewW = W, viewH = H;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  viewW = window.innerWidth; viewH = window.innerHeight;
  const scale = Math.min(viewW / W, viewH / H);
  canvas.width = viewW * dpr; canvas.height = viewH * dpr;
  canvas.style.width = viewW + 'px'; canvas.style.height = viewH + 'px';
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, (viewW - W * scale) / 2 * dpr, (viewH - H * scale) / 2 * dpr);
  window._scale = scale;
  window._ox = (viewW - W * scale) / 2;
  window._oy = (viewH - H * scale) / 2;
}
window.addEventListener('resize', resize);
resize();

const player = new Player();
const obstacles = new ObstaclePool(120);
const particles = new ParticlePool(300);
const texts = new TextPool(30);
const stars = new StarField(140, 12345);
const shake = new ScreenShake();
const flash = new FlashEffect();

let spawner = new Spawner(seedFromString(Date.now().toString()));
let state = 'MENU';
let elapsed = 0;
let runStart = 0;
let nearMisses = 0;
let milestones = 0;
let lastMilestone = 0;
let runTime = 0;
let bestTime = getBest();
let paused = false;
let input = { left: false, right: false, up: false, down: false, mouseX: 0, mouseY: 0 };
let lastSpawnCheck = [];
let lastBestShown = bestTime;

function startGame(seed) {
  const s = seed || seedFromString(Date.now().toString() + Math.random());
  spawner.reset(s);
  player.reset();
  obstacles.pool.forEach(o => o.active = false);
  particles.pool.forEach(p => p.active = false);
  texts.pool.forEach(t => t.active = false);
  elapsed = 0;
  runStart = performance.now();
  runTime = 0;
  nearMisses = 0;
  milestones = 0;
  lastMilestone = 0;
  state = 'PLAYING';
  paused = false;
  overlay.classList.remove('visible');
  deathOverlay.classList.remove('visible');
  pauseOverlay.classList.remove('visible');
  resumeAudio();
}

function endGame() {
  state = 'DEAD';
  player.state = 'DEAD';
  flash.trigger(0.7);
  shake.trigger(20, 0.8);
  playDeath();
  const dur = runTime;
  addScore(dur);
  bestTime = getBest();
  deathDuration.textContent = dur.toFixed(2);
  deathBest.textContent = bestTime.toFixed(2);
  deathMisses.textContent = nearMisses;
  deathMilestones.textContent = milestones;
  const scores = loadScores();
  leaderList.innerHTML = '';
  scores.slice(0, 5).forEach(s => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${s.score.toFixed(2)}s</span><span>${new Date(s.time).toLocaleDateString()}</span>`;
    leaderList.appendChild(li);
  });
  deathOverlay.classList.add('visible');
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 100 + Math.random() * 200;
    particles.emit(player.pos.x, player.pos.y, Math.cos(a) * sp, Math.sin(a) * sp, 0.6 + Math.random() * 0.4, 2 + Math.random() * 2, ['#ff2244', '#ff00aa', '#ffffff'][Math.floor(Math.random() * 3)]);
  }
}

function togglePause() {
  if (state !== 'PLAYING' && state !== 'PAUSED') return;
  paused = !paused;
  if (paused) { state = 'PAUSED'; pauseOverlay.classList.add('visible'); }
  else { state = 'PLAYING'; pauseOverlay.classList.remove('visible'); }
}

function emitTrail() {
  if (Math.random() < 0.5) {
    particles.emit(player.pos.x, player.pos.y, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, 0.3, 1.5, '#00f0ff');
  }
}

function update(dt) {
  stars.update(dt, player.vel.len());
  if (state === 'MENU') {
    shake.update(dt);
    flash.update(dt);
    return;
  }
  if (state === 'PAUSED') { shake.update(dt); return; }
  if (state === 'DEAD') {
    particles.update(dt);
    texts.update(dt);
    shake.update(dt);
    flash.update(dt);
    return;
  }
  runTime += dt;
  spawner.update(dt);
  player.update(dt, input);
  if (spawner.shouldSpawn()) {
    const burst = spawner.buildBurst();
    for (let b of burst) {
      obstacles.spawn(b.x, b.y, b.vx, b.vy, b.type, spawner.speed());
    }
  }
  obstacles.update(dt, player);
  particles.update(dt);
  texts.update(dt);
  shake.update(dt);
  flash.update(dt);
  emitTrail();

  const px = player.pos.x, py = player.pos.y;
  const hitR = player.hitRadius;
  for (let o of obstacles.pool) {
    if (!o.active) continue;
    const d = distXY(px, py, o.x, o.y);
    if (o._lastNearMissCheck !== runTime) o._nmFlag = false;
    if (d < hitR + o.hitRadius && player.invulnTimer <= 0) {
      o.active = false;
      endGame();
      return;
    }
    if (d < hitR + o.hitRadius + 18 && d > hitR + o.hitRadius) {
      if (!o._nmFlag) {
        o._nmFlag = true;
        nearMisses++;
        playNearMiss();
        texts.spawn(o.x, o.y, '+NEAR', '#ffcc00', 0.6);
      }
    }
  }

  const next = Math.floor(runTime / 10) * 10;
  if (next > lastMilestone && next > 0) {
    lastMilestone = next;
    milestones++;
    playMilestone();
    texts.spawn(player.pos.x, player.pos.y - 40, `${next}S`, '#00f0ff', 1.0);
    shake.trigger(4, 0.3);
  }

  fluxTimer.textContent = runTime.toFixed(2);
  bestValue.textContent = bestTime.toFixed(2);
  runValue.textContent = runTime.toFixed(2);
  missValue.textContent = nearMisses;
}

function draw() {
  ctx.save();
  shake.apply(ctx);
  stars.draw(ctx);
  obstacles.draw(ctx);
  player.draw(ctx);
  particles.draw(ctx);
  texts.draw(ctx);
  flash.draw(ctx);
  ctx.restore();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (state === 'MENU') { startGame(seedInput.value ? seedFromString(seedInput.value) : 0); }
    else if (state === 'DEAD') { startGame(seedInput.value ? seedFromString(seedInput.value) : 0); }
    e.preventDefault();
  } else if (e.code === 'Escape') {
    togglePause();
    e.preventDefault();
  } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') input.left = true;
  else if (e.code === 'KeyD' || e.code === 'ArrowRight') input.right = true;
  else if (e.code === 'KeyW' || e.code === 'ArrowUp') input.up = true;
  else if (e.code === 'KeyS' || e.code === 'ArrowDown') input.down = true;
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'KeyA' || e.code === 'ArrowLeft') input.left = false;
  else if (e.code === 'KeyD' || e.code === 'ArrowRight') input.right = false;
  else if (e.code === 'KeyW' || e.code === 'ArrowUp') input.up = false;
  else if (e.code === 'KeyS' || e.code === 'ArrowDown') input.down = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const sx = (e.clientX - rect.left) / rect.width * W;
  const sy = (e.clientY - rect.top) / rect.height * H;
  input.mouseX = sx; input.mouseY = sy;
  reticle.style.display = 'block';
  reticle.style.left = e.clientX + 'px';
  reticle.style.top = e.clientY + 'px';
});
canvas.addEventListener('mousedown', () => {
  if (state === 'MENU' || state === 'DEAD') startGame(seedInput.value ? seedFromString(seedInput.value) : 0);
});

startBtn.addEventListener('click', () => startGame(seedInput.value ? seedFromString(seedInput.value) : 0));
retryBtn.addEventListener('click', () => startGame(seedInput.value ? seedFromString(seedInput.value) : 0));

bestValue.textContent = bestTime.toFixed(2);
