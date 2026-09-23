// Entry point for NEXUS INFILTRATOR
import { initPhysics } from './physics.js';
import { initHacking } from './hacking.js';
import { initUI } from './ui/index.js';
import { initEntities } from './entities/index.js';
import { AudioEngine } from './audio.js';
import { Store } from './store/index.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive canvas sizing
function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const gameState = {
  player: null,
  keys: {},
  score: 0,
  highScore: Store.get('highScore') || 0,
  speedrunTime: 0,
  lastTime: 0,
  gameOver: false
};

const audio = new AudioEngine();
const physics = initPhysics();
const hacking = initHacking();
const ui = initUI(ctx, gameState);
const entities = initEntities(ctx, gameState, physics, hacking);

// Input handling
window.addEventListener('keydown', (e) => {
  gameState.keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
  gameState.keys[e.code] = false;
});

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (Math.max(absX, absY) < 30) {
    // Tap - jump
    gameState.keys['Space'] = true;
    setTimeout(() => gameState.keys['Space'] = false, 100);
  }
}, { passive: false });

function gameLoop(timestamp) {
  if (!gameState.lastTime) gameState.lastTime = timestamp;
  const delta = (timestamp - gameState.lastTime) / 1000;
  gameState.lastTime = timestamp;

  if (!gameState.gameOver) {
    gameState.speedrunTime += delta;
    update(delta);
    render();
  }

  requestAnimationFrame(gameLoop);
}

function update(delta) {
  entities.update(delta, gameState.keys);
  physics.update(delta, gameState);
  hacking.update(delta);
  ui.update(delta);

  // Update high score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    Store.set('highScore', gameState.highScore);
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  entities.render();
  ui.render();
}

// Start the game
requestAnimationFrame(gameLoop);
