export class Particles{
  constructor(){this.list=[];}
  clear(){this.list.length=0;}
  burst(x,y,color,count=14){
    for(let i=0;i<count;i++){
      const a=Math.random()*Math.PI*2;const sp=Math.random()*4+1;
      this.list.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-1,life:30,color,r:Math.random()*3+2});
    }
  }
  update(){for(const p of this.list){p.x+=p.vx;p.y+=p.vy;p.vy+=.15;p.life--;}this.list=this.list.filter(p=>p.life>0);}
  draw(ctx){for(const p of this.list){ctx.fillStyle=p.color;ctx.globalAlpha=p.life/30;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
}
