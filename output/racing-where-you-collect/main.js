import { Game } from './core.js';
import { UI } from './ui.js';

function init() {
  const canvas = document.getElementById('gameCanvas');
  const game = new Game(canvas);
  window.addEventListener('resize', () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    game.ctx.scale(dpr, dpr);
  });
}
init();