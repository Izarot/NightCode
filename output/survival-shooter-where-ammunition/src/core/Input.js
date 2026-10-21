export class Input {
  constructor(canvas){ this.keys={}; this.canvas=canvas; window.addEventListener('keydown',e=>this.keys[e.code]=true); window.addEventListener('keyup',e=>this.keys[e.code]=false); this.canvas.addEventListener('mousedown',e=>this.mouse={x:e.offsetX,y:e.offsetY}); this.canvas.addEventListener('mousemove',e=>this.mouse={x:e.offsetX,y:e.offsetY}); this.canvas.addEventListener('touchstart',e=>{const r=this.canvas.getBoundingClientRect();this.mouse={x:e.touches[0].clientX-r.left,y:e.touches[0].clientY-r.top};}); }
  isDown(k){ return !!this.keys[k]; }
  getMouse(){ return this.mouse||{x:0,y:0}; }
}
