export class InputHandler{
  constructor(canvas){this.canvas=canvas;this.keys={};this.callbacks=[];this.touchStart=null;this.init()}
  init(){window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){e.preventDefault();const k=e.key;const dirs={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};const d=dirs[k];if(d)this.handleMove(d[0],d[1])}});this.canvas.addEventListener('touchstart',e=>{e.preventDefault();this.touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:false});this.canvas.addEventListener('touchend',e=>{e.preventDefault();if(!this.touchStart)return;const dx=e.changedTouches[0].clientX-this.touchStart.x;const dy=e.changedTouches[0].clientY-this.touchStart.y;if(Math.abs(dx)>Math.abs(dy)){this.handleMove(dx>0?1:-1,0)}else{this.handleMove(0,dy>0?1:-1)}},{passive:false})}
  handleMove(dx,dy){this.callbacks.forEach(cb=>cb(dx,dy))}
  onMove(cb){this.callbacks.push(cb)}
}
