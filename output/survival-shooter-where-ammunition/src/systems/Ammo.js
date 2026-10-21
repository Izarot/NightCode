import { CONFIG } from '../data/config.js';
export class Ammo {
  constructor(gm){ this.gm=gm; }
  update(dt){ const p=this.gm.player; if(!p)return; const pp=this.gm.ecs.getComponent(p,'Physics'); this.gm.cells.forEach((c,i)=>{ const dx=pp.x-c.x,dy=pp.y-c.y; const dist=Math.hypot(dx,dy); if(dist<30){ const w=this.gm.ecs.getComponent(p,'Weapon'); const weapon=CONFIG.weapons[w.type]; w.mag=Math.min(weapon.max,w.mag+Math.ceil(weapon.max*0.1)); this.gm.cells.splice(i,1); this.gm.score++; if(this.gm.score>this.gm.highScore){this.gm.highScore=this.gm.score;localStorage.setItem('neo_mineral_high',this.gm.score);} } }); }
}
