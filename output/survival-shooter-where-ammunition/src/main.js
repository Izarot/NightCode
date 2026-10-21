import { GameManager } from './core/GameManager.js';
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resize(){canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight;}
window.addEventListener('resize',resize);
resize();
const game = new GameManager(ctx, canvas);
game.start();