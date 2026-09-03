import {COLORS} from './Data.js';
export class ParticleSystem{
  constructor(max){this.max=max;this.pool=[];}
  burst(x,y,color,count=20){
    for(let i=0;i<count;i++){
      if(this.pool.length>=this.max)this.pool.shift();
      const a=Math.random()*Math.PI*2;
      const s=100+Math.random()*200;
      this.pool.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-100,life:0.8,color,r:4+Math.random()*4});
    }
  }
  update(dt){
    for(let i=this.pool.length-1;i>=0;i--){
      const p=this.pool[i];
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      p.vy+=400*dt;p.life-=dt;
      if(p.life<=0)this.pool.splice(i,1);
    }
  }
  draw(ctx){
    for(const p of this.pool){
      ctx.globalAlpha=Math.max(0,p.life);
      ctx.fillStyle=p.color;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
}