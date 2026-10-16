import { Game } from './src/core/Game.js';

const canvas = document.getElementById('gameCanvas');
const uiOverlay = document.getElementById('ui-overlay');

const game = new Game(canvas, uiOverlay);
game.init();