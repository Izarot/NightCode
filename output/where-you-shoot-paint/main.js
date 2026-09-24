import { Game } from './src/engine.js';
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const game = new Game(canvas, ctx);
game.start();
window.addEventListener('resize', () => game.resize());