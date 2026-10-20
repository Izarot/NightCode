import { Game } from './game/Game.js';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let lastTime = 0;
const FPS = 60;
const INTERVAL = 1000 / FPS;
let accumulator = 0;
const game = new Game(canvas, ctx);
game.init();
function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  accumulator += delta;
  while (accumulator >= INTERVAL) {
    game.update(INTERVAL);
    accumulator -= INTERVAL;
  }
  game.render(ctx, canvas);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
