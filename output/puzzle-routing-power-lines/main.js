import { Game } from './game.js';
import { Input } from './input.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { Levels } from './levels.js';
import { Assets } from './assets.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const game = new Game(Levels.levels[0]);
const input = new Input(canvas);
const renderer = new Renderer(ctx, game);
const ui = new UI();
const assets = new Assets();

let lastTime = 0;
function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  input.update();
  game.update(deltaTime, input);
  renderer.clear();
  renderer.render();
  ui.update(game);

  if (game.state === 'VICTORY') {
    ui.showVictory(game.time);
  } else if (game.state === 'MENU') {
    ui.showStart();
  } else {
    ui.hideMenus();
  }

  requestAnimationFrame(gameLoop);
}

async function init() {
  await assets.load();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  renderer.setScale(canvas.width, canvas.height);
}

init();
