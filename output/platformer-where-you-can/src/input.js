export class Input{ constructor(){ this.h={}; } on(ev,fn){ if(!this.h[ev])this.h[ev]=[]; this.h[ev].push(fn); } emit(ev,e){ (this.h[ev]||[]).forEach(fn=>fn(e)); } }
window.addEventListener('keydown',e=>input.emit('keydown',e));
window.addEventListener('keyup',e=>input.emit('keyup',e));