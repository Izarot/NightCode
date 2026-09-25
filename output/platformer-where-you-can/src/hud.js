export class HUD{ constructor(el){ this.el=el; }
  update(t,rem,sc,hs){ this.el.innerHTML='<div style="position:absolute;top:10px;left:10px;color:#fff">Score: '+Math.max(sc,hs)+'</div><div style="position:absolute;top:10px;left:150px;color:#fff">Time: '+(t/1000).toFixed(2)+'</div><div style="position:absolute;top:40px;left:200px;width:150px;height:10px;background:#333"><div style="width:'+(rem*15)+'px;height:100%;background:#00ff88"></div></div>'; }
  render(){ }
}