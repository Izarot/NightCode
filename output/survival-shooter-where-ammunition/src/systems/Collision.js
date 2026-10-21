export class Collision {
  constructor(gm){ this.gm=gm; }
  update(dt){ const p=this.gm.player; if(!p)return; const phys=this.gm.ecs.getComponent(p,'Physics'); const canvas=this.gm.canvas; if(phys.x<phys.r){phys.x=phys.r;phys.vx*=-0.5;} if(phys.x>canvas.width-phys.r){phys.x=canvas.width-phys.r;phys.vx*=-0.5;} if(phys.y<phys.r){phys.y=phys.r;phys.vy*=-0.5;} if(phys.y>canvas.height-phys.r){phys.y=canvas.height-phys.r;phys.vy*=-0.5;} }
}
