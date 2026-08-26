import {Input} from './Input.js';
import {Audio} from './Audio.js';
import {Player} from '../entities/Player.js';
import {Spawner} from '../systems/Spawner.js';
import {HUD} from '../systems/HUD.js';
import {ParticleSystem} from '../systems/ParticleSystem.js';
import {EnhancementSystem} from '../systems/EnhancementSystem.js';
import {Boss} from '../entities/Boss.js';
import {Storage} from '../utils/storage.js';
import {math} from '../utils/math.js';

export const STATE={TITLE:0,PLAYING:1,PAUSED:2,GAME_OVER:3,ENHANCE:4};

export class Game{
constructor(canvas){
this.canvas=canvas;this.ctx=canvas.getContext('2d');
this.input=new Input(canvas);
this.audio=new Audio();
this.particles=new ParticleSystem();
this.state=STATE.TITLE;
this.lastTime=0;this.time=0;this.runTime=0;
this.score=0;this.lives=3;this.enemiesKilled=0;this.boomerangsThrown=0;this.dashDist=0;
this.highScore=Storage.get('boomerang_hi',0);
this.entities=[];this.projectiles=[];this.pickups=[];this.crates=[];
this.dashUnlocked=false;
this.resize();this.initArena();
}
resize(){
const wrap=document.getElementById('wrap');
const r=wrap.getBoundingClientRect();
const ar=1280/720;
let w=r.width,h=r.height;
if(w/h>ar){w=h*ar;}else{h=w/ar;}
w=Math.min(w,1280);h=Math.min(h,720);
this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';
}
initArena(){
this.crates=[];
for(let i=0;i<8;i++){
this.crates.push({x:200+Math.random()*880,y:150+Math.random()*420,w:40,h:40,hp:100,color:'#aa7733'});
}
}
start(){
this.player=new Player(640,360,this);
this.spawner=new Spawner(this);
this.hud=new HUD(this);
this.enhanceSys=new EnhancementSystem(this);
this.lastTime=performance.now();
this.loop(this.lastTime);
}
loop(now){
const dt=Math.min(0.033,(now-this.lastTime)/1000);
this.lastTime=now;
this.update(dt);
this.draw();
requestAnimationFrame(t=>this.loop(t));
}
update(dt){
this.input.update();
this.time+=dt;
if(this.state===STATE.PLAYING){
this.runTime+=dt;
this.player.update(dt);
this.entities.forEach(e=>e.update(dt));
this.projectiles.forEach(p=>p.update(dt));
this.pickups.forEach(p=>p.update(dt));
this.particles.update(dt);
this.spawner.update(dt);
this.checkCollisions();
this.cleanup();
if(this.runTime>=300&&!this.bossSpawned){this.spawnBoss();}
if(this.score>=25000&&!this.dashUnlocked){this.dashUnlocked=true;this.audio.beep(800,0.1);}
if(this.score>=50000&&this.lives<3){this.lives++;this.audio.beep(1200,0.15);}
}
else if(this.state===STATE.ENHANCE){
this.enhanceSys.update(dt);
}
if(this.input.pressed('Enter')||this.input.pressed('KeyR')){
if(this.state===STATE.TITLE)this.startGame();
else if(this.state===STATE.GAME_OVER)this.startGame();
}
if((this.input.pressed('Escape')||this.input.pressed('KeyP'))&&(this.state===STATE.PLAYING||this.state===STATE.PAUSED)){
this.state=this.state===STATE.PLAYING?STATE.PAUSED:STATE.PLAYING;
}
if(this.input.pressed('Digit1'))this.enhanceSys.choose(0);
if(this.input.pressed('Digit2'))this.enhanceSys.choose(1);
if(this.input.pressed('Digit3'))this.enhanceSys.choose(2);
}
spawnBoss(){
this.bossSpawned=true;
this.entities.push(new Boss(640,200,this));
}
startGame(){
this.state=STATE.PLAYING;
this.score=0;this.lives=3;this.enemiesKilled=0;this.boomerangsThrown=0;this.dashDist=0;
this.runTime=0;this.bossSpawned=false;
this.entities=[];this.projectiles=[];this.pickups=[];
this.player=new Player(640,360,this);
this.spawner=new Spawner(this);
this.enhanceSys=new EnhancementSystem(this);
this.dashUnlocked=false;
this.initArena();
this.particles.clear();
}
checkCollisions(){
const p=this.player;
this.crates.forEach(c=>{
if(math.dist(p.x,p.y,c.x+c.w/2,c.y+c.h/2)<25){
const dx=p.x-(c.x+c.w/2),dy=p.y-(c.y+c.h/2);
const d=Math.sqrt(dx*dx+dy*dy)||1;
p.x+=(dx/d)*3;p.y+=(dy/d)*3;
}
});
this.entities.forEach(e=>{
if(e.dead)return;
if(math.dist(p.x,p.y,e.x,e.y)<e.r+10){
if(!p.invuln){p.takeDamage(e.dmg||10);}
}
});
this.projectiles.forEach(pr=>{
if(pr.dead)return;
if(math.dist(p.x,p.y,pr.x,pr.y)<pr.r+10){
if(!p.invuln){p.takeDamage(pr.dmg);pr.dead=true;this.particles.explode(pr.x,pr.y,'#ffaa00',5);}
}
});
this.pickups.forEach(pk=>{
if(pk.dead)return;
if(math.dist(p.x,p.y,pk.x,pk.y)<20){
pk.onPick(p);pk.dead=true;this.audio.beep(900,0.08);
}
});
}
cleanup(){
this.entities=this.entities.filter(e=>!e.dead);
this.projectiles=this.projectiles.filter(p=>!p.dead);
this.pickups=this.pickups.filter(p=>!p.dead);
this.crates=this.crates.filter(c=>c.hp>0);
}
draw(){
const ctx=this.ctx;
ctx.fillStyle='#0a0420';ctx.fillRect(0,0,1280,720);
this.drawGrid();
this.crates.forEach(c=>{ctx.fillStyle=c.color;ctx.fillRect(c.x,c.y,c.w,c.h);ctx.strokeStyle='#fff';ctx.strokeRect(c.x,c.y,c.w,c.h);});
this.pickups.forEach(p=>p.draw(ctx));
this.entities.forEach(e=>e.draw(ctx));
this.projectiles.forEach(p=>p.draw(ctx));
if(this.state===STATE.PLAYING||this.state===STATE.PAUSED||this.state===STATE.ENHANCE)this.player.draw(ctx);
this.particles.draw(ctx);
this.hud.draw(ctx);
if(this.state===STATE.TITLE)this.drawTitle(ctx);
if(this.state===STATE.GAME_OVER)this.drawGameOver(ctx);
if(this.state===STATE.PAUSED)this.drawPaused(ctx);
if(this.state===STATE.ENHANCE)this.enhanceSys.draw(ctx);
}
drawGrid(){
const ctx=this.ctx;
ctx.strokeStyle='#1a0a3a';ctx.lineWidth=1;
const ox=Math.sin(this.time*0.3)*20,oy=Math.cos(this.time*0.4)*20;
for(let x=0;x<=1280;x+=64){ctx.beginPath();ctx.moveTo(x+ox,0);ctx.lineTo(x+ox,720);ctx.stroke();}
for(let y=0;y<=720;y+=64){ctx.beginPath();ctx.moveTo(0,y+oy);ctx.lineTo(1280,y+oy);ctx.stroke();}
}
drawTitle(ctx){
ctx.fillStyle='rgba(10,4,32,0.85)';ctx.fillRect(0,0,1280,720);
ctx.save();ctx.translate(640,260);
const r=80+Math.sin(this.time*2)*5;
ctx.rotate(this.time*1.5);
ctx.fillStyle='#00ffcc';ctx.beginPath();ctx.moveTo(0,-r);ctx.quadraticCurveTo(r*0.6,-r*0.3,r,0);ctx.quadraticCurveTo(r*0.6,r*0.3,0,r);ctx.quadraticCurveTo(-r*0.6,r*0.3,-r,0);ctx.quadraticCurveTo(-r*0.6,-r*0.3,0,-r);ctx.fill();
ctx.restore();
ctx.fillStyle='#00ffcc';ctx.font='bold 72px Orbitron';ctx.textAlign='center';
ctx.fillText('BOOMERANG',640,200);
ctx.fillStyle='#ff00aa';ctx.font='24px Orbitron';
ctx.fillText('PROJECT BOOMERANG',640,160);
const a=0.5+0.5*Math.sin(this.time*4);
ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.font='bold 32px Orbitron';
ctx.fillText('PRESS ENTER TO START',640,500);
ctx.fillStyle='#aaa';ctx.font='18px Orbitron';
ctx.fillText('WASD MOVE  |  MOUSE AIM  |  CLICK THROW  |  SHIFT DASH',640,560);
ctx.fillText('HIGH SCORE: '+this.highScore,640,600);
}
drawGameOver(ctx){
ctx.fillStyle='rgba(40,0,0,0.85)';ctx.fillRect(0,0,1280,720);
ctx.fillStyle='#ff0044';ctx.font='bold 96px Orbitron';ctx.textAlign='center';
ctx.fillText('GAME OVER',640,280);
ctx.fillStyle='#fff';ctx.font='32px Orbitron';
ctx.fillText('SCORE: '+this.score,640,400);
ctx.fillText('HIGH SCORE: '+this.highScore,640,450);
ctx.fillStyle='#00ffcc';ctx.font='24px Orbitron';
ctx.fillText('ENEMIES: '+this.enemiesKilled,640,510);
ctx.fillText('BOOMERANGS: '+this.boomerangsThrown,640,545);
ctx.fillText('DASH DIST: '+Math.floor(this.dashDist),640,580);
const a=0.5+0.5*Math.sin(this.time*4);
ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.font='bold 28px Orbitron';
ctx.fillText('PRESS ENTER TO PLAY AGAIN',640,660);
}
drawPaused(ctx){
ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,1280,720);
ctx.fillStyle='#00ffcc';ctx.font='bold 80px Orbitron';ctx.textAlign='center';
ctx.fillText('PAUSED',640,340);
ctx.fillStyle='#fff';ctx.font='24px Orbitron';
ctx.fillText('PRESS ESC TO RESUME',640,420);
}
}