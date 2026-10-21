export class Loop {
  constructor(update, render){ this.update=update; this.render=render; this.last=0; this.rafId=0; this.fps=60; this.dt=1/60; }
  start(){ this.last=performance.now(); this.tick(); }
  tick(){ const now=performance.now(); let dt=(now-this.last)/1000; this.last=now; if(dt>this.dt*2)dt=this.dt*2; this.update(dt); this.render(); this.rafId=requestAnimationFrame(this.tick.bind(this)); }
  stop(){ cancelAnimationFrame(this.rafId); }
}
