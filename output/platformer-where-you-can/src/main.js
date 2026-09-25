import {Physics} from './physics.js';
import {Input} from './input.js';
import {AudioSys} from './audio.js';
import {Rewind} from './rewind.js';
import {HUD} from './hud.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const hudEl = document.getElementById('hud');

let w = 640, h = 360;
function resize(){
  const ratio = w/h;
  let nw = window.innerWidth;
  let nh = nw/ratio;
  if(nh > window.innerHeight){nh = window.innerHeight; nw = nh*ratio;}
  canvas.style.width = nw+'px';
  canvas.style.height = nh+'px';
  canvas.width = w;
  canvas.height = h;
}
window.addEventListener('resize', resize);
resize();

const physics = new Physics();
const input = new Input();
const audio = new AudioSys();
const rewind = new Rewind();
const hud = new HUD(hudEl);

let player = {x:100,y:300,vx:0,vy:0,w:32,h:48,grounded:false,facing:1};
let vel = {vx:0,vy:0};
let keys = {left:false,right:false,jump:false,rewind:false,fast:false};
let lastTime = 0;
let dt = 0;
let timer = 0;
let score = 0;
let highScore = localStorage.getItem('chronoshift-high')||0;

input.on('keydown', e=>{ if(e.key==='a'||e.key==='ArrowLeft')keys.left=true; if(e.key==='d'||e.key==='ArrowRight')keys.right=true; if(e.key==='w'||e.key==='ArrowUp'||e.key===' ')keys.jump=true; if(e.key==='q')keys.rewind=true; if(e.key==='Shift')keys.fast=true; });
input.on('keyup', e=>{ if(e.key==='a'||e.key==='ArrowLeft')keys.left=false; if(e.key==='d'||e.key==='ArrowRight')keys.right=false; if(e.key==='w'||e.key==='ArrowUp'||e.key===' ')keys.jump=false; if(e.key==='q')keys.rewind=false; if(e.key==='Shift')keys.fast=false; });

function record(){
  rewind.push({x:player.x,y:player.y,vx:player.vx,vy:player.vy,grounded:player.grounded,facing:player.facing,timer:timer});
}

function update(ms){
  if(!lastTime) lastTime = ms;
  dt = (ms-lastTime)/1000;
  lastTime = ms;
  timer += dt*1000;
  
  if(keys.rewind){
    rewind.update(keys.fast?2:1);
    const s = rewind.get();
    if(s){ player.x=s.x; player.y=s.y; player.vx=s.vx; player.vy=s.vy; player.grounded=s.grounded; player.facing=s.facing; }
  }else{
    rewind.record();
    physics.step(player,keys,dt);
  }
  
  hud.update(timer, rewind.remaining, score, highScore);
  requestAnimationFrame(update);
}

function render(){
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0,0,w,50);
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: '+(score<10000?score:highScore),10,30);
  ctx.fillText('Time: '+(timer/1000).toFixed(2), w/2-50,30);
  ctx.fillStyle = '#00ff88';
  ctx.fillRect(w-150,10,rewind.remaining*15,20);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(w-150,10,150,20);
  
  ctx.fillStyle = '#ff6b6b';
  ctx.fillRect(player.x,player.y,player.w,player.h);
  
  hud.render();
  requestAnimationFrame(render);
}

requestAnimationFrame(update);
requestAnimationFrame(render);

window.addEventListener('blur',()=>{ if(rewind.active) rewind.stop(); });

export {player, score, timer, highScore};