import { Game } from './game/game.js';
const canvas = document.getElementById('game');
const game = new Game(canvas);
function loop(t){ game.frame(t/1000); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
window.addEventListener('resize', ()=>game.resize());
