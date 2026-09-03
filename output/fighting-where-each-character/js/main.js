import { Game } from './engine/Game.js';
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = 1280;
  canvas.height = 720;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
}
window.addEventListener('resize', resize);
resize();
const game = new Game(ctx, canvas);
game.start();