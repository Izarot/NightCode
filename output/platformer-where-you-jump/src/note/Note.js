const COLORS={C:'#ff6b9d',D:'#c44569',E:'#f8b500',F:'#6bff6b',G:'#00d4ff',A:'#7b68ee',B:'#ff4757'};
export class Note{
  constructor(x,y,pitch,beat,type){
    this.x=x;this.y=y;this.pitch=pitch;this.beat=beat;this.type=type;
    this.beatTime=beat;this.hit=false;this.missed=false;this.lastBeat=0;
    this.scale=1;this.flash=0;
  }
  draw(ctx){
    ctx.save();
    const s=this.scale*(this.hit?1:this.pulse);
    ctx.translate(this.x,this.y);ctx.scale(s,s);
    const c=COLORS[this.pitch];
    ctx.fillStyle=this.missed?'#ff0000':(this.hit?'#fff':c);
    ctx.shadowColor=c;ctx.shadowBlur=this.hit?30:15;
    ctx.beginPath();
    ctx.ellipse(-10,0,14,10,0,0,Math.PI*2);
    ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillRect(4,-30,3,30);
    ctx.beginPath();
    ctx.moveTo(7,-30);ctx.quadraticCurveTo(20,-28,18,-18);
    ctx.quadraticCurveTo(14,-22,7,-22);ctx.fill();
    ctx.restore();
  }
}
