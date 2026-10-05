import { GameEngine } from './engine/gameEngine.js';
import { InputHandler } from './input/inputHandler.js';
import { AudioManager } from './audio/audioManager.js';
import { HUD } from './ui/hud.js';
import { Menu } from './ui/menu.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fit container
function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Initialize managers
const inputHandler = new InputHandler();
const audioManager = new AudioManager();
const hud = new HUD(document.getElementById('hud'));
const menu = new Menu(
    document.getElementById('menu'),
    document.getElementById('instructions'),
    document.getElementById('game-over'),
    document.getElementById('level-complete')
);

// Create game engine
const gameEngine = new GameEngine({
    canvas,
    ctx,
    inputHandler,
    audioManager,
    hud,
    menu
});

// Start game loop
function gameLoop(timestamp) {
    gameEngine.update(timestamp);
    gameEngine.render();
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// Handle menu events
document.getElementById('start-btn').addEventListener('click', () => {
    menu.hideAll();
    gameEngine.start();
});

document.getElementById('instructions-btn').addEventListener('click', () => {
    menu.showInstructions();
});

document.getElementById('back-to-menu').addEventListener('click', () => {
    menu.showMenu();
});

document.getElementById('restart-btn').addEventListener('click', () => {
    menu.hideAll();
    gameEngine.restart();
});

document.getElementById('next-level-btn').addEventListener('click', () => {
    menu.hideAll();
    gameEngine.nextLevel();
});
}