import { Game } from './core/Game.js';
import { AssetLoader } from './utils/AssetLoader.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const resizeCanvas = () => {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const ratio = 4 / 3;
  let cw, ch;
  if (w / h > ratio) {
    cw = h * ratio;
    ch = h;
  } else {
    cw = w;
    ch = w / ratio;
  }
  canvas.style.width = `${cw}px`;
  canvas.style.height = `${ch}px`;
  canvas.width = cw * dpr;
  canvas.height = ch * dpr;
  ctx.scale(dpr, dpr);
};

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const assets = new AssetLoader();
assets.load([/* image/audio paths */]).then(() => {
  const game = new Game(canvas, ctx);
  game.start();
});
