import { GameState } from './core/state.js';
import { COLORS, VIRTUAL_WIDTH, VIRTUAL_HEIGHT } from './config/constants.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameState = new GameState();

canvas.width = VIRTUAL_WIDTH;
canvas.height = VIRTUAL_HEIGHT;

let lastTimestamp = 0;
const dt = 1 / 60;

function loop(timestamp) {
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  gameState.update(delta / 1000);
  gameState.render(ctx);

  requestAnimationFrame(loop);
}

gameState.init();
requestAnimationFrame(loop);