// main.js - game loop, states, input
import Player from './player.js';
import Level from './level.js';
import UI from './ui.js';
import FX from './fx.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const W = 1280, H = 720;
let scale = Math.min(window.innerWidth/W, window.innerHeight/H);
let offsetX = (window.innerWidth - W*scale)/2;
let offsetY = (window.innerHeight - H*scale)/2;
canvas.width = W * window.devicePixelRatio;
canvas.height = H * window.devicePixelRatio;
canvas.style.width = `${W}px`;
canvas.style.height = `${H}px`;
ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
window.addEventListener('resize',()=>{scale=Math.min(window.innerWidth/W,window.innerHeight/H);offsetX=(window.innerWidth-W*scale)/2;offsetY=(window.innerHeight-H*scale)/2;canvas.style.width=`${W}px`;canvas.style.height=`${H}px`;});

const keys = {left:false,right:false,jump:false,invert:false,restart:false,pause:false};
window.addEventListener('keydown',e=>{switch(e.code){case'KeyA':case'ArrowLeft':keys.left=true;break;case'KeyD':case'ArrowRight':keys.right=true;break;case'Space':case'KeyW':case'ArrowUp':keys.jump=true;break;case'ShiftLeft':case'KeyE':keys.invert=true;break;case'KeyR':keys.restart=true;break;case'Escape':case'KeyP':keys.pause=true;break}}
);
window.addEventListener('keyup',e=>{switch(e.code){case'KeyA':case'ArrowLeft':keys.left=false;break;case'KeyD':case'ArrowRight':keys.right=false;break;case'Space':case'KeyW':case'ArrowUp':keys.jump=false;break;case'ShiftLeft':case'KeyE':keys.invert=false;break;case'KeyR':keys.restart=false;break;case'Escape':case'KeyP':keys.pause=false;break}}
);

const fx = new FX();
fx.init();

let state = 'Title';
let currentLevel = 0;
let levels = [Level.load(1),Level.load(2),Level.load(3),Level.load(4),Level.load(5)];
let player = new Player(160, 600);
let ui = new UI();
let timer = 0;
let invertCooldown = 0;
let invertFlash = 0;

function startLevel(lvl){currentLevel=lvl;player.x=levels[lvl-1].start.x;player.y=levels[lvl-1].start.y;player.palette=0;player.health=3;player.invuln=0;invertCooldown=0;invertFlash=0;timer=0;ui.updateLevelName(levels[lvl-1].name);ui.updatePrismCount(0,levels[lvl-1].prisms.length);}

function gameLoop(dt){if(state!=='Playing')return;if(keys.pause){state='Paused';return;}
let fixedDT = 1/60;
let accumulator = dt;while(accumulator>=fixedDT){accumulator-=fixedDT;update(fixedDT);}let alpha = accumulator/fixedDT;interpolate(alpha);requestAnimationFrame(loop);}

function update(dt){if(state!=='Playing')return;keys.invert&&invertCooldown<=0&&invertFlash<=0&&(player.palette=1-player.palette,invertCooldown=0.25,invertFlash=0.12,fx.invertSound());
invertCooldown-=dt;if(invertCooldown<0)invertCooldown=0;if(invertFlash>0){invertFlash-=dt;ctx.fillStyle='white';ctx.globalAlpha=Math.min(1,invertFlash*10);ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}
player.update(dt,keys,player.palette,levels[currentLevel-1]);
levels[currentLevel-1].update(player,player.palette);
checkCollisions();
updateHUD();
}

function interpolate(alpha){ctx.clearRect(0,0,W,H);ctx.fillStyle='#0b1020';ctx.fillRect(0,0,W,H);levels[currentLevel-1].draw(ctx,player.palette,alpha);player.draw(ctx,player.palette,alpha);ui.draw(ctx,player, timer);}

function checkCollisions(){// simple AABB