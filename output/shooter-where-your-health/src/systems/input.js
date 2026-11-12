export class Input {
  constructor(){
    this.keys={};
    this.mouseX=0; this.mouseY=0;
    this.mouseDown=false;
    window.addEventListener('keydown',e=>{this.keys[e.key.toLowerCase()]=true; if(e.key===' ')e.preventDefault();});
    window.addEventListener('keyup',e=>{this.keys[e.key.toLowerCase()]=false;});
    window.addEventListener('mousemove',e=>{this.mouseX=e.clientX; this.mouseY=e.clientY;});
    window.addEventListener('mousedown',e=>{if(e.button===0)this.mouseDown=true;});
    window.addEventListener('mouseup',e=>{if(e.button===0)this.mouseDown=false;});
    window.addEventListener('touchstart',e=>{e.preventDefault(); this.mouseDown=true; const t=e.touches[0]; this.mouseX=t.clientX; this.mouseY=t.clientY;},{passive:false});
    window.addEventListener('touchmove',e=>{e.preventDefault(); const t=e.touches[0]; this.mouseX=t.clientX; this.mouseY=t.clientY;},{passive:false});
    window.addEventListener('touchend',e=>{this.mouseDown=false;});
  }
  update(){}
}