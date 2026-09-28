export class Block{
  constructor(x,y,color='blue'){this.gx=x;this.gy=y;this.px=x;this.py=y;this.color=color;const colors={blue:'#00ffff',orange:'#ff6600',green:'#00ff00'};this.fill=colors[color]||'#00ffff'}
  move(dx,dy,tween){this.gx+=dx;this.gy+=dy;tween.add(this,'px',this.gx,120);tween.add(this,'py',this.gy,120)}
  render(ctx,ox,oy,size,scale){const sx=ox+this.px*size*scale;const sy=oy+this.py*size*scale;const s=size*scale;ctx.fillStyle=this.fill;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.fillRect(sx,sy,s,s);ctx.strokeRect(sx,sy,s,s)}
}
