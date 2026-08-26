import {GameObject} from './GameObject.js';
import {math} from '../utils/math.js';
import {EnemyProj} from './Enemies.js';

export class Boss extends GameObject{
constructor(x,y,game){
super(x,y);
this.game=game;this.r=30;this.hp=1500;this.maxHp=1500;this.dmg=30;this.points=10000;this.color='#ff00ff';
this.phase=0;this.phaseT=0;this.attackT=3;this.moveDir={x:1,y:0};
this.targetX=x;this.targetY=y;
}
update(dt){
const p=this.game.player;
this.phaseT+=dt;this.attackT-=dt;
if(this.phaseT>20){this.phase=1;this.phaseT=0;}
if(this.phaseT>20&&this.hp<this.maxHp*0.5){this.phase=2;}
this.x+=this.moveDir.x*60*dt;
this.y+=this.moveDir.y*40*dt;
if(this.x<100||this.x>1180)this.moveDir.x*=-1;
if(this.y<80||this.y>300)this.moveDir.y*=-1;
const dx=p.x-this.x,dy=p.y-this.y;
this.angle=Math.atan2(dy,dx);
if(this.attackT<=0){
this.attackT=this.phase===0?2.5:this.phase===1?1.5:1;
if(this.phase===0||this.phase===1){
for(let i=0;i<(this.phase===0?8:12);i++){
const a=(i/(this.phase===0?8:12))*Math.PI*2;
const sp=200;
this.game.projectiles.push(new EnemyProj(this.x,this.y,Math.cos(a)*sp,Math.sin(a)*sp,15));
}
}else{
const a=Math.atan2(dy,dx);
for(let i=-2;i<=2;i++){
this.game.projectiles.push(new EnemyProj(this.x,this.y,Math.cos(a+i*0.1)*300,Math.sin(a+i*0.1)*300,20));
}
}
this.game.audio.beep(200,0.2,'sawtooth');
}
if(this.hp<=0&&!this.dead){this.dead=true;this.game.particles.explode(this.x,this.y,this.color,40);this.game.audio.explode();this.game.score+=this.points;this.game.enemiesKilled++;this.game.particles.popup(this.x,this.y,'+'+this.points);}
}
draw(ctx){
ctx.save();ctx.translate(this.x,this.y);
ctx.rotate(this.time=this.time||0);this.time+=0.016;
ctx.fillStyle=this.color;
ctx.beginPath();
const r=this.r;
for(let i=0;i<8;i++){
const a=(i/8)*Math.PI*2+this.angle;
const rr=i%2===0?r:r*0.6;
ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);
}
ctx.closePath();ctx.fill();
ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,10,0,Math.PI*2);ctx.fill();
ctx.restore();
this.drawHp(ctx);
}
drawHp(ctx){
const w=300,h=12,x=490,y=20;
ctx.fillStyle='#333';ctx.fillRect(x,y,w,h);
ctx.fillStyle='#ff00ff';ctx.fillRect(x,y,w*(this.hp/this.maxHp),h);
ctx.strokeStyle='#fff';ctx.strokeRect(x,y,w,h);
ctx.fillStyle='#fff';ctx.font='bold 14px Orbitron';ctx.textAlign='center';
ctx.fillText('BOSS',640,30);
}
}