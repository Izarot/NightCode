import { Game } from './game.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

// Expose for debugging
window.game = game;

// Prevent context menu on canvas
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Handle visibility change
let wasPaused = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (game.state === 'PLAYING') {
      game.pause();
      wasPaused = true;
    }
  } else if (wasPaused) {
    game.resume();
    wasPaused = false;
  }
});

console.log('Slime Serpent initialized');
