import { Game } from './game.js';
import { UI } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const uiContainer = document.getElementById('ui');
const hud = document.getElementById('hud');
const timerEl = document.getElementById('timer');

const game = new Game(canvas);
const ui = new UI(uiContainer, hud, timerEl);

game.start(ui);