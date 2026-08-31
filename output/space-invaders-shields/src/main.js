import { Game } from './systems/game.js';
const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);
game.start();
window.addEventListener('resize', () => game.resize());
