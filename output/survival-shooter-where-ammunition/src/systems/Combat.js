import { CONFIG } from '../data/config.js';
export class Combat {
  constructor(gm){ this.gm=gm; }
  update(dt){ const p=this.gm.player; if(!p)return; const w=this.gm.ecs.getComponent(p,'Weapon'); if(w.cool>0)w.cool-=dt; const mouse=this.gm.input.getMouse(); if(this.gm.input.isDown('Mouse0')&&w.cool<=0&&w.mag>0){ this.fire(p,w,mouse); w.mag--; w.cool=CONFIG.weapons[w.type].cool; this.shakeScreen(3); } }
  fire(pid,w,mouse){ const phys=this.gm.ecs.getComponent(pid,'Physics'); const dx=mouse.x-phys.x,dy=mouse.y-phys.y; const dist=Math.hypot(dx,dy); if(dist<1)return; const nx=dx/dist,ny=dy/dist; const speed=CONFIG.bulletSpeed; this.gm.bullets.push({x:phys.x+nx*phys.r,y:phys.y+ny*phys.r,vx:nx*speed,vy:ny*speed,life:1.5,type:w.type}); }
  shakeScreen(intensity){ this.gm.shake.timer=0.2; this.gm.shake.x=(Math.random()-0.5)*intensity; this.gm.shake.y=(Math.random()-0.5)*intensity; }
}
