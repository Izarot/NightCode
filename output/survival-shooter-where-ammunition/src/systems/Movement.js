import { CONFIG } from '../data/config.js';
export class Movement {
  constructor(gm){ this.gm=gm; }
  update(dt){ const p=this.gm.player; if(!p)return; const phys=this.gm.ecs.getComponent(p,'Physics'); const input=this.gm.input; let ax=0,ay=0; if(input.isDown('ArrowUp')||input.isDown('KeyW'))ay-=1; if(input.isDown('ArrowDown')||input.isDown('KeyS'))ay+=1; if(input.isDown('ArrowLeft')||input.isDown('KeyA'))ax-=1; if(input.isDown('ArrowRight')||input.isDown('KeyD'))ax+=1; const len=Math.hypot(ax,ay); if(len>0){ax/=len;ay/=len;} const accel=CONFIG.accel; if(ax===0&&ay===0){ phys.vx*=Math.max(0,1-CONFIG.friction*dt); phys.vy*=Math.max(0,1-CONFIG.friction*dt); } else { phys.vx+=ax*accel*dt; phys.vy+=ay*accel*dt; } const spd=Math.hypot(phys.vx,phys.vy); if(spd>CONFIG.maxSpeed){ phys.vx=phys.vx/spd*CONFIG.maxSpeed; phys.vy=phys.vy/spd*CONFIG.maxSpeed; } phys.x+=phys.vx*dt; phys.y+=phys.vy*dt; }
}
