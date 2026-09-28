export class ParticleSystem{
  constructor(){this.particles=[]}
  add(x,y,type){for(let i=0;i<5;i++){this.particles.push({x:x*64,y:y*64,vx:(Math.random()-0.5)*2,vy:(Math.random()-0.5)*2-1,life:500,type})}}
  update(dt){const now=performance.now();this.particles=this.particles.filter(p=>p.life>0);this.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=dt})}
  render(ctx,ox,oy,size,scale){this.particles.forEach(p=>{ctx.fillStyle=p.type==='dust'?'rgba(255,255,255,0.5)':'rgba(0,255,255,0.7)';ctx.beginPath();ctx.arc(ox+p.x*scale,oy+p.y*scale,3*scale,0,Math.PI*2);ctx.fill()})}
  clear(){this.particles=[]}
}
