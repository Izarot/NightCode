import { Player } from './player.js';
import { Bullet } from './bullet.js';
import { Drone, Seeker, Patroller } from './enemies.js';
import { AudioManager } from './audio.js';
import { UIManager } from './ui.js';
import { CONFIG, Utils } from './utils.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
  CONFIG.CANVAS_WIDTH = w;
  CONFIG.CANVAS_HEIGHT = h;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const player = new Player(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
const bullets = [];
const enemies = [];
const particles = [];
const audio = new AudioManager();
const ui = new UIManager();

let mouseX = player.x;
let mouseY = player.y;
let mouseAngle = 0;
let lastShot = 0;
let score = 0;
let wave = 1;
let waveTimer = 0;
let gameTime = 0;
let highScore = parseInt(localStorage.getItem('highScore') || '0');
let gameOver = false;
let paused = false;

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
  mouseAngle = Math.atan2(mouseY - player.y, mouseX - player.x);
});

canvas.addEventListener('click', () => {
  if (paused || gameOver) return;
  tryShoot();
});

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0 && !paused && !gameOver) {
    tryShoot();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (!paused && !gameOver) tryShoot();
  }
  if (e.code === 'KeyP') {
    paused = !paused;
  }
});

function tryShoot() {
  const now = performance.now();
  if (now - lastShot < CONFIG.FIRE_RATE) return;
  lastShot = now;
  const muzzleDist = 8;
  const bx = player.x + Math.cos(mouseAngle) * muzzleDist;
  const by = player.y + Math.sin(mouseAngle) * muzzleDist;
  const bullet = new Bullet(bx, by, mouseAngle);
  bullets.push(bullet);
  player.vx -= Math.cos(mouseAngle) * 80;
  player.vy -= Math.sin(mouseAngle) * 80;
  audio.play('shoot');
}

function spawnWave() {
  const count = Math.floor(3 * Math.pow(1.2, wave - 1));
  for (let i = 0; i < count; i++) {
    const type = wave % 3 === 0 ? 'patroller' : wave % 3 === 1 ? 'drone' : 'seeker';
    const x = Math.random() * CONFIG.CANVAS_WIDTH;
    const y = Math.random() * CONFIG.CANVAS_HEIGHT;
    let enemy;
    if (type === 'drone') enemy = new Drone(x, y);
    else if (type === 'seeker') enemy = new Seeker(x, y);
    else enemy = new Patroller(x, y);
    enemies.push(enemy);
  }
}

function update(dt) {
  if (paused || gameOver) return;

  gameTime += dt;
  waveTimer += dt;
  if (waveTimer >= CONFIG.WAVE_INTERVAL) {
    waveTimer = 0;
    wave++;
    spawnWave();
  }

  player.update(dt, mouseAngle);

  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update(dt);
    if (bullets[i].lifetime <= 0) {
      bullets.splice(i, 1);
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update(dt, player);
    if (enemies[i].health <= 0) {
      score += enemies[i].points || 10;
      createExplosion(enemies[i].x, enemies[i].y);
      audio.play('hit');
      enemies.splice(i, 1);
    }
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (Utils.circleCollision(bullets[i].x, bullets[i].y, bullets[i].radius, enemies[j].x, enemies[j].y, enemies[j].radius)) {
        enemies[j].health--;
        bullets.splice(i, 1);
        break;
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    if (Utils.circleCollision(player.x, player.y, player.radius, enemies[i].x, enemies[i].y, enemies[i].radius)) {
      player.health--;
      createExplosion(player.x, player.y);
      audio.play('death');
      enemies.splice(i, 1);
      if (player.health <= 0) {
        gameOver = true;
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('highScore', highScore.toString());
        }
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update(dt);
    if (particles[i].lifetime <= 0) {
      particles.splice(i, 1);
    }
  }
}

function createExplosion(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
      radius: 3,
      lifetime: 0.6,
      color: CONFIG.COLORS.explosion
    });
  }
}

function render() {
  ctx.fillStyle = CONFIG.COLORS.bg;
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  // Parallax background
  const t = gameTime * 0.05;
  ctx.fillStyle = CONFIG.COLORS.bg2;
  for (let i = 0; i < 20; i++) {
    const x = (Math.sin(t + i) * 30 + CONFIG.CANVAS_WIDTH / 2);
    const y = (Math.cos(t * 0.7 + i) * 30 + CONFIG.CANVAS_HEIGHT / 2);
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crosshair
  ctx.strokeStyle = CONFIG.COLORS.crosshair;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mouseX - 10, mouseY);
  ctx.lineTo(mouseX + 10, mouseY);
  ctx.moveTo(mouseX, mouseY - 10);
  ctx.lineTo(mouseX, mouseY + 10);
  ctx.stroke();

  // Bullets
  for (const b of bullets) {
    ctx.fillStyle = CONFIG.COLORS.bullet;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Enemies
  for (const e of enemies) {
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Particles
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.lifetime / 0.6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Player
  player.render(ctx);

  // HUD
  ui.render(ctx, {
    health: player.health,
    maxHealth: player.maxHealth,
    score,
    wave,
    gameTime,
    highScore,
    gameOver,
    paused
  });
}

let lastTime = 0;
function gameLoop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  if (dt < 0.1) update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

spawnWave();
requestAnimationFrame(gameLoop);
