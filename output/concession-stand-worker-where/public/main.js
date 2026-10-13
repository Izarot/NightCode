import { initECS } from './ecs.js';
import { loadAssets } from './assets.js';
import { initInput } from './input.js';
import { initAudio } from './audio.js';
import { updateHUD, loadHighScore, saveHighScore } from './ui.js';

let canvas, ctx, lastTime = 0, accumulator = 0;
const FIXED_DT = 1 / 60;
let gameState = { score: 0, highScore: 0, strikes: 0, stamina: 100, maxStamina: 100, timer: 0, isRunning: true };

async function init() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  await loadAssets();
  initAudio();
  initInput();
  const { entities, systems } = initECS();
  gameState.highScore = loadHighScore();
  updateHUD(gameState);

  function gameLoop(timestamp) {
    if (!gameState.isRunning) return;
    const frameTime = Math.min((timestamp - lastTime) / 1000, 0.25);
    lastTime = timestamp;
    accumulator += frameTime;

    while (accumulator >= FIXED_DT) {
      update(FIXED_DT, entities, systems);
      accumulator -= FIXED_DT;
    }

    render(accumulator / FIXED_DT, entities, systems);
    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
}

function update(dt, entities, systems) {
  gameState.timer += dt;
  if (gameState.stamina < gameState.maxStamina) gameState.stamina = Math.min(gameState.maxStamina, gameState.stamina + 20 * dt);

  systems.forEach(system => system.update(dt, entities, gameState));

  if (gameState.strikes >= 3) {
    gameState.isRunning = false;
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      saveHighScore(gameState.highScore);
    }
    alert(`Game Over! Score: ${gameState.score}\nHigh Score: ${gameState.highScore}`);
    location.reload();
  }
}

function render(alpha, entities, systems) {
  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.clearRect(0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);

  systems.forEach(system => system.render(ctx, alpha, entities, gameState));

  ctx.restore();
  updateHUD(gameState);
}

function resizeCanvas() {
  const scale = Math.min(window.innerWidth / 320, window.innerHeight / 180);
  canvas.width = 320 * scale * devicePixelRatio;
  canvas.height = 180 * scale * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
}

init();