import { CONFIG } from '../data/config.js';
export class AI {
  constructor(gm){ this.gm=gm; }
  update(dt){ const p=this.gm.player; if(!p)return; const pp=this.gm.ecs.getComponent(p,'Physics'); this.gm.enemies.forEach(e=>{ const phys=this.gm.ecs.getComponent(e,'Physics'); const ai=this.gm.ecs.getComponent(e,'AI'); if(!phys||!ai)return; const dx=pp.x-phys.x,dy=pp.y-phys.y; const dist=Math.hypot(dx,dy); if(dist>0){ const nx=dx/dist,ny=dy/dist; phys.vx+=nx*ai.speed*dt; phys.vy+=ny*ai.speed*dt; } const spd=Math.hypot(phys.vx,phys.vy); if(spd>ai.maxSpeed){ phys.vx=phys.vx/spd*ai.maxSpeed; phys.vy=phys.vy/spd*ai.maxSpeed; } }); }
}
