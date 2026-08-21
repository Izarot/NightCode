import { initGame, update, render } from './game.js';
import { handleResize } from './renderer.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
  canvas.width = size;
  canvas.height = size;
  handleResize(size, size);
}
window.addEventListener('resize', resize);
resize();

let lastTime = performance.now();
function gameLoop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  update(dt);
  render(ctx);
  requestAnimationFrame(gameLoop);
}

initGame();
requestAnimationFrame(gameLoop);