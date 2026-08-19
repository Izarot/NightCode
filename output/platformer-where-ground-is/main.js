import { Game } from './game.js';
import { AudioManager } from './audio.js';

const audio = new AudioManager();
const game = new Game(document.getElementById('gameCanvas'), audio);
game.start();