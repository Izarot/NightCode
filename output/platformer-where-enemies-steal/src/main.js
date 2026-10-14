import { GameLoop } from './core/GameLoop.js';
import { config } from './config.js';

// Initialize game loop
const gameCanvas = document.getElementById('gameCanvas');
const game = new GameLoop(gameCanvas, config);

// Start the game
function startGame() {
    game.start();
}

// Wait for user interaction to start (for audio context)
document.addEventListener('click', startGame, { once: true });
document.addEventListener('keydown', startGame, { once: true });