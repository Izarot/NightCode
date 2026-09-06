class Player{
constructor(x,y){this.x=x;this.y=y;this.vx=0;this.vy=0;this.r=8;this.trail=[];this.alive=true}
update(dt,keys){let ax=0,ay=0;if(keys.has('w')||keys.has('arrowup'))ay=-1;if(keys.has('s')||keys.has('arrowdown'))ay=1;if(keys.has('a')||keys.has('arrowleft'))ax=-1;if(keys.has('d')||keys.has('arrowright'))ax=1;const mag=Math.sqrt(ax*ax+ay*ay);if(mag>0){ax/=mag;ay/=mag;this.vx+=ax*800*dt;this.vy+=ay*800*dt}const sp=Math.sqrt(this.vx*this.vx+this.vy*this.vy);if(sp>200){this.vx=this.vx/sp*200;this.vy=this.vy/sp*200}this.x+=this.vx*dt;this.y+=this.vy*dt;this.trail.push({x:this.x,y:this.y});if(this.trail.length>5)this.trail.shift()}}
class Traps{
update(dt){this.list.forEach(t=>{if(t.type==='patrol'){const tt=(t.t+=dt*150/(Math.abs(t.bx-t.ax)||1));if(tt>1)t.t=0;const u=Math.max(0,Math.min(1,tt));t.x=t.ax+(t.bx-t.ax)*u;t.y=t.ay+(t.by-t.ay)*u}else{const a=t.ang+=dt*(1.5);t.x=t.cx+Math.cos(a)*t.r;t.y=t.cy+Math.sin(a)*t.r}})}
}