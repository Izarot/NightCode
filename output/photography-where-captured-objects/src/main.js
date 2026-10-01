import { Game } from './core/Game.js';
import { AssetLoader } from './core/AssetLoader.js';
import { InputHandler } from './core/InputHandler.js';
import { AudioManager } from './systems/AudioManager.js';
import { StorageManager } from './utils/StorageManager.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;

// Responsive canvas scaling
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = 800 * dpr;
  canvas.height = 600 * dpr;
  ctx.scale(dpr, dpr);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const loader = new AssetLoader();
const input = new InputHandler();
const audio = new AudioManager();
const storage = new StorageManager();

const menuScreen = document.getElementById('menu-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const toggleMusicBtn = document.getElementById('toggle-music');
const shutterBtn = document.getElementById('shutter-btn');
const pauseBtn = document.getElementById('pause-btn');
const settingsBtn = document.getElementById('settings-btn');

let game;

startBtn.addEventListener('click', () => {
  menuScreen.style.display = 'none';
  shutterBtn.style.display = 'block';
  pauseBtn.style.display = 'block';
  settingsBtn.style.display = 'block';
  initGame();
});

restartBtn.addEventListener('click', () => {
  endScreen.style.display = 'none';
  shutterBtn.style.display = 'block';
  pauseBtn.style.display = 'block';
  settingsBtn.style.display = 'block';
  initGame();
});

menuBtn.addEventListener('click', () => {
  endScreen.style.display = 'none';
  menuScreen.style.display = 'flex';
});

toggleMusicBtn.addEventListener('click', () => {
  audio.toggleMusic();
  toggleMusicBtn.textContent = audio.isMusicEnabled() ? 'Music: ON' : 'Music: OFF';
});

shutterBtn.addEventListener('click', () => {
  if (game && game.state === 'playing') {
    input.setShutterPressed(true);
  }
});

pauseBtn.addEventListener('click', () => {
  if (game && game.state === 'playing') {
    game.pause();
  } else if (game && game.state === 'paused') {
    game.resume();
  }
});

function initGame() {
  loader.loadAll().then(() => {
    game = new Game(canvas, ctx, input, audio, storage);
    game.start();
    gameLoop();
  });
}

function gameLoop() {
  if (game) {
    game.update();
    game.render();
  }
  requestAnimationFrame(gameLoop);
}
