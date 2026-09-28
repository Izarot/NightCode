export class PressurePlate{
  constructor(x,y,color='standard'){this.x=x;this.y=y;this.color=color;this.activated=false}
  isActivated(){return this.activated}
  render(ctx,ox,oy,size,scale){const sx=ox+this.x*size*scale;const sy=oy+this.y*size*scale;const s=size*scale;ctx.fillStyle=this.activated?'#00ff00':'#555';ctx.strokeStyle='#888';ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx+s/2,sy+s/2,s*0.3,0,Math.PI*2);ctx.fill();ctx.stroke()}
}
