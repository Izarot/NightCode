import { Game } from './game.js';
import { StateManager } from './state.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fit window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const game = new Game(canvas, ctx);
const stateManager = new StateManager(game);

// Start with menu state
stateManager.changeState('menu');

game.setStateManager(stateManager);
game.start();