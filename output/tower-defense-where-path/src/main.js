import { initGameLoop } from './gameLoop.js';
import { initInput } from './utils/input.js';
import { initAudio } from './utils/audio.js';
import { state } from './state.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  const ratio = 1920 / 1080;
  let w = window.innerWidth;
  let h = window.innerHeight;
  if (w / h > ratio) {
    w = h * ratio;
  } else {
    h = w / ratio;
  }
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
}
window.addEventListener('resize', resize);
resize();

state.canvas = canvas;
state.ctx = ctx;

initAudio();
initInput(canvas);
initGameLoop();
