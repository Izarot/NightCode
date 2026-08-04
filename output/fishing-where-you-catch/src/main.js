import { Game } from './core/Game.js';
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const game = new Game(canvas, ctx);
function loop(){
  game.update();
  game.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
