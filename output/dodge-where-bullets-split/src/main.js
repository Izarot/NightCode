import { Game } from './core/Game.js';
import { Renderer } from './render/Renderer.js';
import { InputManager } from './core/InputManager.js';
import { AudioEngine } from './audio/AudioEngine.js';

const gameCanvas = document.getElementById('game');
const hudCanvas = document.getElementById('hud');
const ctx = gameCanvas.getContext('2d');
const hudCtx = hudCanvas.getContext('2d');

let game, renderer, input, audio;
let lastTime = 0;
let animationId;

function init() {
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = 1920, h = 1080;
    const sw = window.innerWidth, sh = window.innerHeight;
    const scale = Math.min(sw / w, sh / h);
    gameCanvas.width = w * scale * dpr;
    gameCanvas.height = h * scale * dpr;
    gameCanvas.style.width = w * scale + 'px';
    gameCanvas.style.height = h * scale + 'px';
    hudCanvas.width = w * dpr;
    hudCanvas.height = h * dpr;
    hudCanvas.style.width = w + 'px';
    hudCanvas.style.height = h + 'px';
    ctx.scale(scale * dpr, scale * dpr);
    hudCtx.scale(dpr, dpr);
    game?.resize?.(scale);
  };
  window.addEventListener('resize', resize);
  resize();
  
  input = new InputManager();
  audio = new AudioEngine();
  renderer = new Renderer(ctx, hudCtx);
  game = new Game(renderer, input, audio, resize);
  
  lastTime = performance.now();
  animationId = requestAnimationFrame(loop);
}

function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;
  game.update(dt);
  game.render();
  animationId = requestAnimationFrame(loop);
}

window.addEventListener('load', init);