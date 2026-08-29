export class ParticleSystem{
constructor(){this.ps=[];}
burst(x,y,c,n=8){
for(let i=0;i<n;i++){
const a=Math.random()*Math.PI*2,s=1+Math.random()*3;
this.ps.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,c});
}
}
update(dt){
const k=dt/16;
this.ps=this.ps.filter(p=>{
p.x+=p.vx*k;p.y+=p.vy*k;p.vy+=0.15*k;p.life-=0.02*k;return p.life>0;
});
}
draw(ctx){
this.ps.forEach(p=>{
ctx.globalAlpha=Math.max(0,p.life);
ctx.fillStyle=p.c;
ctx.fillRect(p.x-2,p.y-2,4,4);
});
ctx.globalAlpha=1;
}
}
