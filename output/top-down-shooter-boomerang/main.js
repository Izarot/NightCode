import {Game} from './core/Game.js';
const canvas=document.getElementById('c');
const game=new Game(canvas);
game.start();
window.addEventListener('resize',()=>game.resize());