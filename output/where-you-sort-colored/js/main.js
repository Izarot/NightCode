import { Game } from './game.js';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const game = new Game(canvas, ctx);
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const maxW = window.innerWidth * 0.95;
  const maxH = window.innerHeight * 0.95;
  const size = Math.min(maxW, maxH * 0.9);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  ctx.scale(dpr, dpr);
  game.resize(size, size);
}
window.addEventListener('resize', resize);
resize();
function loop(ts) { game.update(ts); game.render(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);