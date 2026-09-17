import { Game } from './js/game.js';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let game;

function resize(){
  const dpr = Math.min(window.devicePixelRatio, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr);
  if(game) game.resize();
}

window.addEventListener('resize', resize);
resize();

game = new Game(canvas, ctx);
window.game = game;
