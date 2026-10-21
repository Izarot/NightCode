export class Lighting {
  constructor(ctx){ this.ctx=ctx; }
  render(player){ const phys=player?this.ctx.canvas:{}; const x=phys.x||0,y=phys.y||0; const grad=this.ctx.createRadialGradient(x,y,0,x,y,150); grad.addColorStop(0,'rgba(10,10,18,0)'); grad.addColorStop(1,'rgba(10,10,18,0.8)'); this.ctx.fillStyle=grad; this.ctx.fillRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height); }
}
