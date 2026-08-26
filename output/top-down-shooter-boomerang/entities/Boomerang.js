import {GameObject} from './GameObject.js';
import {math} from '../utils/math.js';

export class Boomerang extends GameObject{
constructor(x,y,dx,dy,speed,maxRange,enh,owner){
super(x,y);
this.dx=dx;this.dy=dy;this.speed=speed;this.maxRange=maxRange;
this.enh=enh;this.owner=owner;
this.dist=0;this.returning=false;
this.angle=Math.atan2(dy,dx);
this.dmg=25;this.hits=[];
}
update(dt){
const g=this.owner.game;
if(!this.returning){
this.dist+=this.speed*dt;
if(this.dist>=this.maxRange*0.7){this.speed*=0.6;}
if(this.dist>=this.maxRange)this.returning=true;
}else{
const tx=this.owner.x,ty=this.owner.y;
let ax=tx-this.x,ay=ty-this.y;
const ad=Math.sqrt(ax*ax+ay*ay);
if(ad>5){ax/=ad;ay/=ad;}
if(this.enh==='homing'){
let near=null,nd=200;
g.entities.forEach(e=>{if(e===this||e.dead||e===this.owner)return;const d=math.dist(this.x,this.y,e.x,e.y);if(d<nd){nd=d;near=e;}});
if(near){const tx2=near.x-this.x,ty2=near.y-this.y;const ang=Math.atan2(ty2,tx2);const ca=Math.atan2(ay,ax);let diff=ang-ca;while(diff>Math.PI)diff-=2*Math.PI;while(diff<-Math.PI)diff+=2*Math.PI;const turn=Math.sign(diff)*Math.min(Math.abs(diff),0.17);const na=ca+turn;ax=Math.cos(na);ay=Math.sin(na);}}
this.x+=ax*this.speed*dt;
this.y+=ay*this.speed*dt;
if(ad<15){this.dead=true;}
}
this.x+=this.dx*this.speed*dt*0;
this.x+=ax*this.speed*dt;
this.y+=ay*this.speed*dt;
this.angle+=15*dt;
g.particles.trail(this.x,this.y,this.returning?'#ffdd00':'#ffffff');
g.entities.forEach(e=>{
if(e===this||e.dead||e===this.owner||e.isPickup)return;
if(this.hits.includes(e))return;
const d=math.dist(this.x,this.y,e.x,e.y);
if(d<e.r+8){
if(e.shielded&&this.angle<Math.PI){
this.dx*=-1;this.dy*=-1;this.returning=true;
return;
}
e.hp-=this.dmg;this.hits.push(e);
g.particles.hit(this.x,this.y);
g.audio.hit();
if(this.enh==='piercing'){}
else{this.dead=true;}
if(this.enh==='explosive'){g.particles.explode(this.x,this.y,'#ff8800',15);g.audio.explode();for(const e2 of g.entities){if(e2!==e&&!e2.dead&&math.dist(this.x,this.y,e2.x,e2.y)<50){e2.hp-=50;}}}
if(e.hp<=0&&!e.dead){e.dead=true;g.score+=e.points;g.enemiesKilled++;g.particles.explode(e.x,e.y,e.color||'#fff',12);g.particles.popup(e.x,e.y,'+'+e.points);if(Math.random()<0.2){g.pickups.push(new Pickup(e.x,e.y,'enhance'));}}
}
});
}
draw(ctx){
ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);
ctx.fillStyle=this.returning?'#ffdd00':'#ffffff';
ctx.beginPath();ctx.moveTo(10,0);ctx.quadraticCurveTo(5,-5,-5,-5);ctx.lineTo(-10,0);ctx.lineTo(-5,5);ctx.quadraticCurveTo(5,5,10,0);ctx.fill();
ctx.strokeStyle='#00ffcc';ctx.lineWidth=2;ctx.stroke();
ctx.restore();
}
}
class Pickup{
constructor(x,y,type){this.x=x;this.y=y;this.type=type;this.dead=false;this.r=12;this.t=0;this.isPickup=true;}
update(dt){this.t+=dt;}
draw(ctx){ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.t*2);ctx.fillStyle='#ff00aa';ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold 14px Orbitron';ctx.textAlign='center';ctx.fillText('+',0,5);ctx.restore();}
onPick(g){g.enhanceSys.trigger();}
}