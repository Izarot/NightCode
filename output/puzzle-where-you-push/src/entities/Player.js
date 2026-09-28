import { easeOutQuad } from '../utils/MathUtils.js';

export class Player{
  constructor(x,y){this.gx=x;this.gy=y;this.px=x;this.py=y;this.canMove=true;this.scale=1;this.bob=0}
  move(dx,dy,tween){this.gx+=dx;this.gy+=dy;tween.add(this,'px',this.gx,120);tween.add(this,'py',this.gy,120);this.bob=0}
  render(ctx,ox,oy,size,scale){this.bob+=0.1;const bob=Math.sin(this.bob)*2;this.scale=1+Math.sin(this.bob)*0.05;const sx=ox+this.px*size*scale;const sy=oy+this.py*size*scale;const s=size*scale*this.scale;ctx.fillStyle='#00ffff';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.save();ctx.translate(sx+size*scale/2,sy+size*scale/2);ctx.scale(this.scale,this.scale);ctx.translate(-size*scale/2,-size*scale/2);ctx.beginPath();ctx.arc(size*scale/2,size*scale/2,s*0.4,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore()}
}
