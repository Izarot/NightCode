import { init, update, render } from './systems/GameLoop.js';
import { setupInput } from './systems/Input.js';
import { loadLevel } from './systems/LevelLoader.js';
import { loadAudio } from './systems/Audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resize);
resize();

await loadAudio();
await loadLevel('level1');
setupInput(canvas);
init();

let last = 0;
function loop(ts) {
  const dt = (ts - last) / 1000;
  last = ts;
  update(dt);
  render(ctx);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
