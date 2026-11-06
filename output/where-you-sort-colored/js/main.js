// main.js
import { Game } from './game.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { AudioManager } from './audio.js';
import { UI } from './ui.js';

let canvas, ctx;
let game, renderer, input, audio, ui;

function init() {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  game = new Game();
  renderer = new Renderer(canvas, game);
  input = new Input(canvas, game);
  audio = new AudioManager();
  ui = new UI(canvas, game);

  audio.init().then(() => {
    game.start();
    requestAnimationFrame(gameLoop);
  });
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  renderer.resize();
}

function gameLoop(timestamp) {
  const delta = Math.min((timestamp - (gameLoop.lastTime || 0)) / 1000, 0.1);
  gameLoop.lastTime = timestamp;
  game.update(delta);
  renderer.render();
  requestAnimationFrame(gameLoop);
}

init();