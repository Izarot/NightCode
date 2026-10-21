export class Particles {
  constructor(gm){ this.gm=gm; }
  update(dt){ this.gm.particlesList=this.gm.particlesList.filter(p=>p.life>0); this.gm.particlesList.forEach(p=>{ p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; }); }
  spawn(x,y,color,count){ for(let i=0;i<count;i++){ const a=Math.random()*Math.PI*2; const s=Math.random()*100+50; this.gm.particlesList.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0.5,color}); } }
}
