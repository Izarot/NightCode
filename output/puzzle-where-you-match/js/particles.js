class Particles{
 constructor(){this.list=[];this.colors=['#00f5ff','#ff2ea6','#b6ff2e','#ff9f1c','#8b5cff','#00ffc8']}
 burst(x,y,n=18){for(let i=0;i<n&&this.list.length<50;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*3;this.list.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,c:this.colors[Math.floor(Math.random()*this.colors.length)],r:2+Math.random()*3})}}
 update(dt){this.list.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.05;p.life-=dt/600});this.list=this.list.filter(p=>p.life>0)}
 draw(ctx){this.list.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.c;ctx.shadowColor=p.c;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;ctx.shadowBlur=0}
}
