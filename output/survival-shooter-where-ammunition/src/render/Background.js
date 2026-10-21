export class Background {
  constructor(ctx){ this.ctx=ctx; this.stars=[]; for(let i=0;i<100;i++)this.stars.push({x:Math.random()*2000,y:Math.random()*2000}); }
  render(){ const ctx=this.ctx; ctx.fillStyle='#0a0a12'; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height); ctx.fillStyle='#00f0ff'; this.stars.forEach(s=>{ ctx.fillRect(s.x%ctx.canvas.width,s.y%ctx.canvas.height,1,1); }); }
}
