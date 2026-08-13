import { loadLevel } from './levelLoader.js';
import { applyForce } from './physics.js';
import { Key, Lock } from './entities.js';
import { magnet } from './input.js';
import { renderHUD } from './ui.js';
import { initAudio } from './assets.js';
import { getVector } from './utils.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let keys = [];
let locks = [];
let gameState = 'play';
let startTime = Date.now();
let highScore = parseInt(localStorage.getItem('mkpHighScore')) || 0;
let score = 0;
let moves = 0;
let par = 0;
let audio = null;
let levelLoaded = false;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

async function init() {
  audio = initAudio();
  const level = await loadLevel('assets/levels/lvl01.json');
  const ts = level.tileSize || 40;
  for (const k of level.keys) {
    keys.push(new Key(k.start[0]*ts, k.start[1]*ts, k.type, ts));
  }
  for (const l of level.locks) {
    locks.push(new Lock(l.goal[0]*ts, l.goal[1]*ts, l.type, ts));
  }
  magnet.radius = level.magnet.radius;
  magnet.strength = level.magnet.strength;
  magnet.polarity = level.magnet.polarity === 'attract' ? 1 : -1;
  magnet.energyCost = level.magnet.energyCost;
  magnet.maxEnergy = level.energy.max;
  magnet.energy = magnet.maxEnergy;
  magnet.wasActive = false;
  par = level.par || 0;
  levelLoaded = true;
  requestAnimationFrame(loop);
}

function loop() {
  if (!levelLoaded) { requestAnimationFrame(loop); return; }
  const dt = 1/60;
  if (magnet.active && !magnet.wasActive) { moves++; magnet.wasActive = true; }
  if (!magnet.active) { magnet.wasActive = false; }
  if (magnet.active) {
    applyForce(magnet, keys);
  }
  for (const key of keys) {
    key.vx *= 0.9;
    key.vy *= 0.9;
    key.x += key.vx * dt;
    key.y += key.vy * dt;
  }
  for (const key of keys) {
    if (!key.locked) {
      for (const lock of locks) {
        if (!lock.isUnlocked && lock.type === key.type) {
          const dx = key.x - lock.x;
          const dy = key.y - lock.y;
          const dist = Math.hypot(dx, dy);
          if (dist < lock.size/2 + key.size/2) {
            lock.isUnlocked = true;
            key.locked = true;
            audio.playLockClick();
            score += 100;
          }
        }
      }
    }
  }
  const allUnlocked = locks.every(l => l.isUnlocked);
  if (allUnlocked && gameState === 'play') {
    gameState = 'win';
    const elapsed = (Date.now() - startTime)/1000;
    const timeBonus = Math.max(0, 60 - elapsed) * 2;
    const energyBonus = magnet.energy;
    const moveBonus = Math.max(0, par - moves) * 20;
    score += timeBonus + energyBonus + moveBonus;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('mkpHighScore', highScore);
    }
  }
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const grad = ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0,'#0d0d0d');
  grad.addColorStop(1,'#1a1a1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  for (const lock of locks) {
    lock.draw(ctx);
  }
  for (const key of keys) {
    key.draw(ctx);
  }
  ctx.save();
  ctx.translate(magnet.x, magnet.y);
  ctx.beginPath();
  ctx.arc(0,0,magnet.radius,0,Math.PI*2);
  ctx.strokeStyle = magnet.polarity===1 ? '#00f' : '#f00';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(magnet.polarity===1 ? 'N' : 'S', 0, 0);
  if (magnet.active) {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0,0,magnet.radius*1.2,0,Math.PI*2);
    ctx.stroke();
  }
  ctx.restore();
  renderHUD(ctx, magnet, score, par, startTime, highScore);
  if (gameState === 'win') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#ff0';
    ctx.textAlign = 'center';
    ctx.font = '48px sans-serif';
    ctx.fillText('Level Complete!', canvas.width/2, canvas.height/2 - 40);
    ctx.font = '24px sans-serif';
    ctx.fillText('Score: ' + score, canvas.width/2, canvas.height/2);
    ctx.fillText('High Score: ' + highScore, canvas.width/2, canvas.height/2 + 30);
    ctx.fillText('Click to replay', canvas.width/2, canvas.height/2 + 70);
  }
  requestAnimationFrame(loop);
}

init();
canvas.addEventListener('click', () => {
  if (gameState === 'win') {
    location.reload();
  }
});