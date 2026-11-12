import { Game } from './game.js';
const canvas = document.getElementById('game');
const uiOverlay = document.getElementById('ui-overlay');
const game = new Game(canvas, uiOverlay);
game.init();
function loop(ts){ game.update(ts); game.render(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);