const Particles = (() => {
  const list = [];
  function spawn(x, y, color, count=8, speed=2) {
    for(let i=0;i<count;i++){
      const ang = Math.random()*Math.PI*2;
      const spd = speed*(0.5+Math.random()*0.5);
      list.push({x,y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,life:1,decay:0.015+Math.random()*0.01,color,size:2+Math.random()*3});
    }
  }
  function spawnConfetti(x, y) {
    const colors = ['#00d4ff','#7fff57','#ff9f43','#00b4a0','#fff'];
    for(let i=0;i<30;i++){
      const ang = Math.random()*Math.PI*2;
      const spd = 3+Math.random()*4;
      list.push({x,y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd-2,life:1,decay:0.008,color:colors[Math.floor(Math.random()*colors.length)],size:4+Math.random()*4,rot:Math.random()*Math.PI*2,vr:(Math.random()-0.5)*0.2});
    }
  }
  function update() {
    for(let i=list.length-1;i>=0;i--){
      const p=list[i];
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.life-=p.decay;
      if(p.rot!==undefined) p.rot+=p.vr;
      if(p.life<=0) list.splice(i,1);
    }
  }
  function draw(ctx) {
    list.forEach(p=>{
      ctx.save();
      ctx.globalAlpha=p.life;
      ctx.fillStyle=p.color;
      ctx.translate(p.x,p.y);
      if(p.rot!==undefined) ctx.rotate(p.rot);
      ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
      ctx.restore();
    });
  }
  function clear() { list.length=0; }
  return { spawn, spawnConfetti, update, draw, clear };
})();