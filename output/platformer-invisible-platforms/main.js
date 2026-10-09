import { initInput, getInput } from './src/input.js';
import { updatePhysics, resolveCollisions } from './src/physics.js';
import { render } from './src/render.js';
import { levels } from './src/levels.js';
import { Player } from './src/entities/Player.js';
import { Camera } from './src/entities/Camera.js';
import { AudioEngine } from './src/audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

const audio = new AudioEngine();
const player = new Player(100, 100);
const camera = new Camera(width, height);
let currentLevel = 0;
let retries = 0;
let highScore = localStorage.getItem('echoHighScore') || 0;
let startTime = 0;
let gameState = 'playing';

initInput(canvas);

function gameLoop(timestamp) {
  if (!startTime) startTime = timestamp;
  const elapsed = timestamp - startTime;
  const speedrun = Math.floor(elapsed / 1000);

  const input = getInput();
  player.update(input, audio);
  updatePhysics(player);
  resolveCollisions(player, levels[currentLevel]);
  camera.follow(player.x, player.y, levels[currentLevel]);

  render(ctx, player, levels[currentLevel], camera, speedrun, retries, highScore, gameState);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
