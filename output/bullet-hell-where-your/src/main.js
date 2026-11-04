import {CONFIG} from './config.js';
import {Player} from './player/player.js';
import {Camera} from './camera/camera.js';
import {Enemy} from './enemies/enemy.js';
import {Bullet} from './bullets/bullet.js';
import {SoundFX} from './utils/audio.js';
import {drawHUD} from './ui/ui.js';
import {rand,dist} from './utils/utils.js';
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
let scale=1,offX=0,offY=0;
function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;scale=Math.min(canvas.width/1920,canvas.height/1080);offX=(canvas.width-1920*scale)/2;offY=(canvas.height-1080*scale)/2;}
window.addEventListener('resize',resize);resize();
const keys={};
window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key==='Shift')keys['shift']=true;if(e.key.toLowerCase()==='p'||e.key==='Escape')togglePause();if(e.key==='Enter')startGame();if(e.key.toLowerCase()==='x')doBomb();});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.key==='Shift')keys['shift']=false;});
canvas.addEventListener('click',()=>{sfx.init();if(state!=='playing')startGame();});
const joy=document.getElementById('joy'),stick=document.getElementById('stick');
let joyId=null;
joy.addEventListener('touchstart',e=>{joyId=e.touches[0].identifier;},{passive:false});
joy.addEventListener('touchmove',e=>{e.preventDefault();for(const t of e.touches){if(t.identifier===joyId){const r=joy.getBoundingClientRect();let dx=t.clientX-(r.left+55),dy=t.clientY-(r.top+55);const d=Math.hypot(dx,dy);if(d>40){dx=dx/d*40;dy=dy/d*40;}stick.style.left=(33+dx)+'px';stick.style.top=(33+dy)+'px';player.touchX=dx/40;player.touchY=dy/40;}}},{passive:false});
joy.addEventListener('touchend',()=>{joyId=null;player.touchX=0;player.touchY=0;stick.style.left='33px';stick.style.top='33px';});
document.getElementById('bFocus').addEventListener('touchstart',e=>{e.preventDefault();player.touchFocus=!player.touchFocus;});
document.getElementById('bBomb').addEventListener('touchstart',e=>{e.preventDefault();doBomb();});
const sfx=new SoundFX();
let state='menu',score=0,time=0,last=0,spawnT=0,bossSpawned=false;
let high=parseInt(localStorage.getItem('pixelPointHighScore')||'0',10);
let player=new Player(5000,5000);
let cam=new Camera();
let bullets=[],enemies=[],particles=[];
let stars=[];for(let i=0;i<300;i++)stars.push({x:rand(0,10000),y:rand(0,10000),s:rand(1,3),c:['#00F5FF','#FF2E97','#B6FF00','#FFFFFF'][i%4]});
function startGame(){sfx.init();sfx.ui();state='playing';score=0;time=0;bullets=[];enemies=[];particles=[];player=new Player(5000,5000);cam.x=4000;cam.y=4000;bossSpawned=false;}
function togglePause(){if(state==='playing')state='paused';else if(state==='paused')state='playing';}
function doBomb(){if(state!=='playing'||player.bombs<=0)return;player.bombs--;bullets=[];particles.push(...makeParticles(player.x,player.y,100,'#FF2E97'));cam.addShake(12);sfx.bomb();score+=500;}
function makeParticles(x,y,n,c){let a=[];for(let i=0;i<n;i++){const ang=rand(0,Math.PI*2),sp=rand(1,6);a.push({x,y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,life:60,c});}return a;}
function spawnEnemy(){const side=Math.floor(rand(0,4));let x,y;if(side===0){x=cam.x+rand(0,1920);y=cam.y-80;}else if(side===1){x=cam.x+rand(0,1920);y=cam.y+1160;}else if(side===2){x=cam.x-80;y=cam.y+rand(0,1080);}else{x=cam.x+2000;y=cam.y+rand(0,1080);}const types=['sentry','interceptor'];enemies.push(new Enemy(x,y,types[Math.floor(rand(0,2))]));}
function loop(ts){requestAnimationFrame(loop);const dt=Math.min(33,ts-last||16);last=ts;if(state==='playing'){time+=dt;score+=Math.floor(dt/16);player.update(keys);cam.update(player,player.vx,player.vy);spawnT+=dt;if(spawnT>900){spawnT=0;spawnEnemy();if(!bossSpawned&&time>30000){bossSpawned=true;enemies.push(new Enemy(player.x+400,player.y-400,'boss'));cam.addShake(8);}}for(const e of enemies)e.update(player,bullets,sfx);enemies=enemies.filter(e=>dist(e.x,e.y,player.x,player.y)<2500&&e.hp>0);for(const b of bullets)b.update();bullets=bullets.filter(b=>b.life>0&&dist(b.x,b.y,player.x,player.y)<2500);for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.life--;}particles=particles.filter(p=>p.life>0);let danger=false;for(const b of bullets){const d=dist(b.x,b.y,player.x,player.y);if(d<50)danger=true;if(Math.abs(b.x-player.x)<=b.r&&Math.abs(b.y-player.y)<=b.r&&player.invuln<=0){player.lives--;player.invuln=120;cam.addShake(10);sfx.hit();particles.push(...makeParticles(player.x,player.y,100,'#00F5FF'));bullets=[];if(player.lives<=0){state='gameover';if(score>high){high=score;localStorage.setItem('pixelPointHighScore',String(high));}}break;}}if(danger&&Math.random()<0.1)sfx.graze();if(danger){ctx.strokeStyle='rgba(255,0,60,'+(0.3+Math.sin(ts/80)*0.3)+')';ctx.lineWidth=8;ctx.strokeRect(0,0,canvas.width,canvas.height);}}
ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=CONFIG.PALETTE.bg;ctx.fillRect(0,0,canvas.width,canvas.height);
ctx.setTransform(scale,0,0,scale,offX+rand(-cam.shake,cam.shake),offY+rand(-cam.shake,cam.shake));
ctx.save();
ctx.translate(-cam.x,-cam.y);
for(const s of stars){ctx.fillStyle=s.c;ctx.fillRect(s.x,s.y,s.s,s.s);}
for(const e of enemies)e.draw(ctx);
for(const b of bullets)b.draw(ctx);
for(const p of particles){ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,3,3);}
player.draw(ctx);
ctx.restore();
ctx.setTransform(1,0,0,1,0,0);
drawHUD(ctx,score,player.lives,player.bombs,time,high,state);
}
requestAnimationFrame(loop);
