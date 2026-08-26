export class ParticleSystem{
constructor(){this.particles=[];this.popups=[];}
update(dt){
this.particles=this.particles.filter(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vy+=200*dt;return p.life>0;});
this.popups=this.popups.filter(p=>{p.y-=40*dt;p.life-=dt;return p.life>0;});
}
draw(ctx){
this.particles.forEach(p=>{ctx.fillStyle=p.color;ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillRect(p.x-2,p.y-2,4,4);ctx.globalAlpha=1;});
this.popups.forEach(p=>{ctx.fillStyle=p.color;ctx.font='bold 16px Orbitron';ctx.textAlign='center';ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillText(p.text,p.x,p.y);ctx.globalAlpha=1;});
}
explode(x,y,color,n=10){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2;const s=50+Math.random()*150;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0.5,max:0.5,color});}}
popup(x,y,text,color='#ffdd00'){this.popups.push({x,y,text,color,life:1,max:1});}
hit(x,y){this.explode(x,y,'#ffaa00',5);}
afterimage(x,y,angle){this.particles.push({x,y,vx:0,vy:0,life:0.3,max:0.3,color:'rgba(0,255,204,0.5)'});}
damage(x,y,d){this.explode(x,y,'#ff0044',6);this.popup(x,y-20,'-'+d,'#ff0044');}
trail(x,y,color){this.particles.push({x,y,vx:(Math.random()-0.5)*20,vy:(Math.random()-0.5)*20,life:0.3,max:0.3,color});}
clear(){this.particles=[];this.popups=[];}
}