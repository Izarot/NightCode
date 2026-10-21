export class Renderer {
  constructor(ctx){ this.ctx=ctx; }
  renderEntities(ecs,enemies,player,bullets,cells,particles){ particles.forEach(p=>this.drawCircle(p.x,p.y,p.life*5,p.color)); cells.forEach(c=>this.drawCircle(c.x,c.y,6,'#ffaa00')); bullets.forEach(b=>this.drawCircle(b.x,b.y,3,'#ffffff')); enemies.forEach(e=>{ const phys=ecs.getComponent(e,'Physics'); if(phys)this.drawCircle(phys.x,phys.y,phys.r,'#ff0055'); }); const pp=ecs.getComponent(player,'Physics'); if(pp)this.drawCircle(pp.x,pp.y,pp.r,'#00f0ff'); }
  drawCircle(x,y,r,color){ this.ctx.fillStyle=color; this.ctx.beginPath(); this.ctx.arc(x,y,r,0,Math.PI*2); this.ctx.fill(); }
}
