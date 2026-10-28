class ParticleSystem {
  constructor(){
    this.particles = [];
  }
  emit(x, y, color, count=10){
    for(let i=0;i<count;i++){
      this.particles.push({
        x, y,
        vx: (Math.random()-0.5)*2,
        vy: (Math.random()-0.5)*2,
        life: 1,
        color
      });
    }
  }
  update(dt){
    for(let i=this.particles.length-1;i>=0;i--){
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy;
      p.life -= dt / 500;
      if(p.life <= 0) this.particles.splice(i,1);
    }
  }
  draw(ctx){
    ctx.save();
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.restore();
  }