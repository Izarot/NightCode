let lastTime=0,animId=null;
function init(){
  loadBest();
  initRenderer();initInput();initUI();
  showScreen('title');
  lastTime=performance.now();
  requestAnimationFrame(loop);
}
function loop(t){
  const dt=(t-lastTime)/1000;lastTime=t;
  state.windT=(state.windT||0)+dt;
  for(let i=state.particles.length-1;i>=0;i--){
    const p=state.particles[i];
    p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.life-=0.02;
    if(p.life<=0)state.particles.splice(i,1);
  }
  if(state.activeScreen==='play'){
    state.elapsedTime=(state.elapsedTime||0)+(Date.now()-state.startTime>0?(Date.now()-state.startTime):0);
    if(state.placed.length){
      const elapsed=Date.now()-state.startTime;
      const hours=Math.floor(elapsed/3600000);
      state.elapsedTime=elapsed;
    }
    updateHUD();
  }
  render();
  animId=requestAnimationFrame(loop);
}
window.addEventListener('load',init);
