import {GameObject} from './GameObject.js';
import {math} from '../utils/math.js';

export class Grunt extends GameObject{
constructor(x,y,game){super(x,y);this.game=game;this.r=10;this.hp=50;this.dmg=10;this.points=100;this.color='#ff2244';this.contactCd=0;}
update(dt){
const p=this.game.player;
const dx=p.x-this.x,dy=p.y-this.y;
const d=Math.sqrt(dx*dx+dy*dy)||1;
this.x+=(dx/d)*80*dt;this.y+=(dy/d)*80*dt;
this.angle=Math.atan2(dy,dx);
if(this.contactCd>0)this.contactCd-=dt;
if(this.hp<=0)this.dead=true;
}
draw(ctx){ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle+Math.PI/2);ctx.fillStyle=this.color;ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(10,8);ctx.lineTo(-10,8);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();ctx.restore();}
}

export class Shooter extends GameObject{
constructor(x,y,game){super(x,y);this.game=game;this.r=12;this.hp=40;this.dmg=15;this.points=250;this.color='#22aaff';this.fireT=2;this.strafe=1;}
update(dt){
const p=this.game.player;
const dx=p.x-this.x,dy=p.y-this.y;
const d=Math.sqrt(dx*dx+dy*dy)||1;
if(d<200){this.x-=(dx/d)*60*dt;this.y-=(dy/d)*60*dt;}
else if(d>250){this.x+=(dx/d)*60*dt;this.y+=(dy/d)*60*dt;}
this.x+=this.strafe*60*dt;
if(this.x<50||this.x>1230)this.strafe*=-1;
this.angle=Math.atan2(dy,dx);
this.fireT-=dt;
if(this.fireT<=0){
this.fireT=2;
const ndx=dx/d,ndy=dy/d;
this.game.projectiles.push(new EnemyProj(this.x,this.y,ndx*250,ndy*250,15));
}
if(this.hp<=0)this.dead=true;
}
draw(ctx){ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);ctx.fillStyle=this.color;ctx.fillRect(-12,-12,24,24);ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(8,-2,6,4);ctx.restore();}
}

export class Dasher extends GameObject{
constructor(x,y,game){super(x,y);this.game=game;this.r=11;this.hp=75;this.dmg=25;this.points=300;this.color='#aa44ff';this.teleportT=1.5;this.flashT=0;}
update(dt){
const p=this.game.player;
this.teleportT-=dt;this.flashT-=dt;
if(this.teleportT<0.3&&this.flashT<=0)this.flashT=0.3;
if(this.teleportT<=0){
this.teleportT=1.5;this.flashT=0;
this.game.particles.explode(this.x,this.y,this.color,8);
let nx=this.x,ny=this.y;
for(let i=0;i<10;i++){nx=this.x+(Math.random()-0.5)*300;ny=this.y+(Math.random()-0.5)*300;nx=Math.max(30,Math.min(1250,nx));ny=Math.max(30,Math.min(690,ny));}
this.x=nx;this.y=ny;
this.game.particles.explode(this.x,this.y,this.color,8);
}
this.angle+=dt*3;
if(this.hp<=0)this.dead=true;
}
draw(ctx){ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);ctx.fillStyle=this.flashT>0?'#ffffff':this.color;ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(12,0);ctx.lineTo(0,12);ctx.lineTo(-12,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();ctx.restore();}
}

export class Shielded extends GameObject{
constructor(x,y,game){super(x,y);this.game=game;this.r=15;this.hp=100;this.dmg=10;this.points=500;this.color='#ffcc22';this.shielded=true;}
update(dt){
const p=this.game.player;
const dx=p.x-this.x,dy=p.y-this.y;
const d=Math.sqrt(dx*dx+dy*dy)||1;
this.x+=(dx/d)*50*dt;this.y+=(dy/d)*50*dt;
this.angle=Math.atan2(dy,dx);
if(this.hp<=0)this.dead=true;
}
draw(ctx){ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);ctx.fillStyle=this.color;ctx.beginPath();for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;ctx.lineTo(Math.cos(a)*15,Math.sin(a)*15);}ctx.closePath();ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='rgba(255,255,255,0.6)';ctx.beginPath();ctx.moveTo(8,0);ctx.arc(0,0,15,-Math.PI/2,Math.PI/2);ctx.closePath();ctx.fill();ctx.restore();}
}

export class EnemyProj{
constructor(x,y,vx,vy,dmg){this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.dmg=dmg;this.r=5;this.dead=false;}
update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;if(this.x<0||this.x>1280||this.y<0||this.y>720)this.dead=true;}
draw(ctx){ctx.fillStyle='#ffaa00';ctx.beginPath();ctx.arc(this.x,this.y,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();}
}