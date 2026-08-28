class Bullet{constructor(x,y,vx,vy,color,size,friendly,life=3){this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.color=color;this.size=size;this.friendly=friendly;this.life=life;this.dead=false;}
update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;this.life-=dt;if(this.life<=0)this.dead=true;}
draw(ctx){ctx.fillStyle=this.color;ctx.shadowBlur=10;ctx.shadowColor=this.color;ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}}
class Particle{constructor(x,y,vx,vy,color,life,size){this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.color=color;this.life=life;this.maxLife=life;this.size=size;this.dead=false;}
update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;this.vx*=0.96;this.vy*=0.96;this.life-=dt;if(this.life<=0)this.dead=true;}
draw(ctx){ctx.globalAlpha=this.life/this.maxLife;ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}}
class Enemy{constructor(x,y,type){this.x=x;this.y=y;this.type=type;const t=ENEMY_TYPES[type];this.hp=t.hp;this.maxHp=t.hp;this.speed=t.speed;this.size=t.size;this.color=t.color;this.pattern=t.pattern;this.score=t.score;this.dead=false;this.angle=0;this.fireTimer=1;this.targetX=x;this.targetY=y;}
update(dt,player,arena){
this.angle+=dt;
if(this.type==='cinderling'){const a=Math.atan2(player.y-this.y,player.x-this.x);this.x+=Math.cos(a)*this.speed*dt;this.y+=Math.sin(a)*this.speed*dt;}
else if(this.type==='geometer'){const a=Math.atan2(player.y-this.y,player.x-this.x);const d=Math.hypot(player.x-this.x,player.y-this.y);if(d>200){this.x+=Math.cos(a)*this.speed*dt;this.y+=Math.sin(a)*this.speed*dt;}else if(d<150){this.x-=Math.cos(a)*this.speed*dt;this.y-=Math.sin(a)*this.speed*dt;}}
else if(this.type==='halo'){const a=this.angle*0.5;this.x=player.x+Math.cos(a)*180;this.y=player.y+Math.sin(a)*180;}
else if(this.type==='sentinel'){this.angle+=dt*0.5;}
else if(this.type==='boss'){this.angle+=dt*0.3;const a=this.angle;this.x+=Math.cos(a)*this.speed*dt;this.y+=Math.sin(a)*this.speed*dt;}
this.x=Math.max(this.size,Math.min(arena.w-this.size,this.x));
this.y=Math.max(this.size,Math.min(arena.h-this.size,this.y));
this.fireTimer-=dt;
if(this.fireTimer<=0&&!this.dead){this.fireTimer=PATTERNS[this.pattern].interval;return true;}
return false;
}
draw(ctx){
ctx.fillStyle=this.color;ctx.shadowBlur=15;ctx.shadowColor=this.color;
if(this.type==='cinderling'){ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.fill();}
else if(this.type==='geometer'){ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);ctx.fillRect(-this.size,-this.size,this.size*2,this.size*2);ctx.restore();}
else if(this.type==='halo'){ctx.beginPath();ctx.arc(this.x,this.y,this.size,0,Math.PI*2);ctx.strokeStyle=this.color;ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.arc(this.x,this.y,4,0,Math.PI*2);ctx.fill();}
else if(this.type==='sentinel'){ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle);ctx.beginPath();ctx.moveTo(0,-this.size);ctx.lineTo(this.size,0);ctx.lineTo(0,this.size);ctx.lineTo(-this.size,0);ctx.closePath();ctx.fill();ctx.restore();}
else if(this.type==='boss'){ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.angle*0.2);for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.arc(0,0,this.size,0,Math.PI);ctx.fill();}ctx.beginPath();ctx.arc(0,0,this.size*0.5,0,Math.PI*2);ctx.fill();ctx.restore();}
if(this.type==='boss'){ctx.shadowBlur=0;ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(this.x-40,this.y-this.size-15,80,6);ctx.fillStyle='#ff00ff';ctx.fillRect(this.x-40,this.y-this.size-15,80*(this.hp/this.maxHp),6);}
ctx.shadowBlur=0;
}}
class Player{constructor(arena){this.x=arena.w/2;this.y=arena.h/2;this.size=12;this.hp=3;this.maxHp=3;this.invuln=0;this.activePatterns=[];this.fireTimer=0;this.flash=0;this.angle=0;}
update(dt,keys,mouse,arena,canFire){
let dx=0,dy=0;if(keys['w']||keys['arrowup'])dy-=1;if(keys['s']||keys['arrowdown'])dy+=1;if(keys['a']||keys['arrowleft'])dx-=1;if(keys['d']||keys['arrowright'])dx+=1;
if(dx||dy){const l=Math.hypot(dx,dy);dx/=l;dy/=l;}
this.x+=dx*320*dt;this.y+=dy*320*dt;
this.x=Math.max(this.size,Math.min(arena.w-this.size,this.x));
this.y=Math.max(this.size,Math.min(arena.h-this.size,this.y));
this.aimAngle=Math.atan2(mouse.y-this.y,mouse.x-this.x);
if(this.invuln>0)this.invuln-=dt;
if(this.flash>0)this.flash-=dt;
this.angle+=dt*2;
this.fireTimer-=dt;
return canFire&&(mouse.down||keys[' '])&&this.fireTimer<=0;
}
draw(ctx,weaveProgress){
if(this.invuln>0&&Math.floor(this.invuln*10)%2===0)return;
ctx.save();ctx.translate(this.x,this.y);
if(weaveProgress>0){ctx.strokeStyle=COLORS.cyan;ctx.lineWidth=2;ctx.beginPath();const r=20+Math.sin(this.angle*4)*3;const a=weaveProgress*Math.PI*2;ctx.arc(0,0,r,-Math.PI/2,-Math.PI/2+a);ctx.stroke();}
for(let i=0;i<this.activePatterns.length;i++){const p=PATTERNS[this.activePatterns[i]];const a=this.angle+i*Math.PI*2/this.activePatterns.length;ctx.save();ctx.rotate(a);ctx.fillStyle=p.color;ctx.shadowBlur=8;ctx.shadowColor=p.color;ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(4,-10);ctx.lineTo(-4,-10);ctx.closePath();ctx.fill();ctx.restore();}
ctx.fillStyle=COLORS.player;ctx.shadowBlur=20;ctx.shadowColor=COLORS.cyan;ctx.beginPath();ctx.arc(0,0,this.size,0,Math.PI*2);ctx.fill();
ctx.strokeStyle=COLORS.cyan;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,this.size+3,0,Math.PI*2);ctx.stroke();
ctx.shadowBlur=0;ctx.restore();
}}