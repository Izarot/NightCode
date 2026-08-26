import {Boomerang} from './Boomerang.js';
import {math} from '../utils/math.js';
import {STATE} from '../core/Game.js';

export class Player{
constructor(x,y,game){
this.x=x;this.y=y;this.game=game;this.angle=0;
this.speed=220;this.r=10;
this.hp=100;this.maxHp=100;
this.invuln=0;this.flash=0;
this.throwCd=0;this.dashCd=0;this.dashTimer=0;
this.enhancement=null;
}
update(dt){
const g=this.game,inp=g.input;
if(g.state!==STATE.PLAYING)return;
const md=inp.moveDir();
this.x+=md.dx*this.speed*dt;
this.y+=md.dy*this.speed*dt;
this.x=Math.max(20,Math.min(1260,this.x));
this.y=Math.max(20,Math.min(700,this.y));
this.angle=Math.atan2(inp.mouse.y-this.y,inp.mouse.x-this.x);
if(this.invuln>0)this.invuln-=dt;
if(this.flash>0)this.flash-=dt;
if(this.throwCd>0)this.throwCd-=dt;
if(this.dashCd>0)this.dashCd-=dt;
if(this.dashTimer>0)this.dashTimer-=dt;
if((inp.pressed('Space')||inp.pressed('ShiftLeft')||inp.pressed('KeyX'))&&this.dashCd<=0&&this.game.dashUnlocked&&(md.dx!==0||md.dy!==0)){
this.x+=md.dx*100;this.y+=md.dy*100;
this.x=Math.max(20,Math.min(1260,this.x));
this.y=Math.max(20,Math.min(700,this.y));
this.dashCd=2;this.invuln=0.2;this.dashTimer=0.2;
this.game.dashDist+=100;
this.game.audio.dash();
this.game.particles.afterimage(this.x-md.dx*100,this.y-md.dy*100,this.angle);
}
if(inp.mouse.click&&this.throwCd<=0&&!g.enhanceSys.active){
this.throw();
inp.mouse.click=false;
}
}
throw(){
const g=this.game;
const baseSpd=this.enhancement==='rapid'?675:450;
const maxRng=this.enhancement==='rapid'?262:350;
if(this.enhancement==='split'){
const a1=this.angle-0.13,a2=this.angle+0.13;
g.entities.push(new Boomerang(this.x,this.y,Math.cos(a1),Math.sin(a1),baseSpd,maxRng,this.enhancement,this));
g.entities.push(new Boomerang(this.x,this.y,Math.cos(a2),Math.sin(a2),baseSpd,maxRng,this.enhancement,this));
}else{
g.entities.push(new Boomerang(this.x,this.y,Math.cos(this.angle),Math.sin(this.angle),baseSpd,maxRng,this.enhancement,this));
}
this.throwCd=0.4;
g.boomerangsThrown++;
g.audio.throw();
}
takeDamage(d){
if(this.invuln>0)return;
this.hp-=d;
this.flash=0.5;this.invuln=0.5;
this.game.audio.hit();
this.game.particles.damage(this.x,this.y,d);
this.game.shake=3;
if(this.hp<=0){this.loseLife();}
}
loseLife(){
this.lives=this.game.lives-1;this.game.lives=this.lives;
if(this.lives<=0){this.gameOver();}
else{this.hp=100;this.x=640;this.y=360;this.game.particles.explode(this.x,this.y,'#ff00aa',20);}
}
gameOver(){
const g=this.game;
g.state=STATE.GAME_OVER;
if(g.score>g.highScore){g.highScore=g.score;Storage.set('boomerang_hi',g.highScore);}
g.audio.explode();
}
draw(ctx){
if(this.flash>0){ctx.fillStyle='#fff';}
else{ctx.fillStyle='#00ffcc';}
ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);
ctx.beginPath();ctx.moveTo(12,0);ctx.quadraticCurveTo(6,-8,-6,-10);ctx.quadraticCurveTo(-12,-2,-12,0);ctx.quadraticCurveTo(-12,2,-6,10);ctx.quadraticCurveTo(6,8,12,0);ctx.fill();
ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();
ctx.restore();
}
}
import {Storage} from '../utils/storage.js';