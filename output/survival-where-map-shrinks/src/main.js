import {Game} from './core/game.js';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function resize(){
  const r = 16/9;
  let w = window.innerWidth, h = window.innerHeight;
  let cw = w, ch = w/r;
  if(ch>h){ch=h;cw=h*r;}
  canvas.style.width = cw+'px';
  canvas.style.height = ch+'px';
}
window.addEventListener('resize', resize);
resize();
const game = new Game(canvas, ctx);
game.init();
