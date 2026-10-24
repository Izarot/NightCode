class Renderer{
  constructor(ctx){
    this.ctx = ctx;
    this.particles = [];
  }
  render(car, track, waveform){
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for(let i = 0; i < track.length; i++){
      const seg = track[i];
      const screenX = (seg.x - car.x) * 0.5 + ctx.canvas.width/2;
      const screenY = ctx.canvas.height/2 - seg.y;
      ctx.lineTo(screenX, screenY);
    }
    ctx.stroke();
    ctx.fillStyle = '#faff00';
    ctx.beginPath();
    ctx.arc(car.x * 0.5 + ctx.canvas.width/2, ctx.canvas.height/2 - car.y, 8, 0, Math.PI*2);
    ctx.fill();
    this.renderParticles();
  }
  renderParticles(){
    const ctx = this.ctx;
    ctx.fillStyle = '#ff00aa';
    for(const p of this.particles){
      ctx.fillRect(p.x, p.y, 2, 2);
      p.y -= 0.5;
      p.life--;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }
  addParticle(x, y){
    this.particles.push({x, y, life: 20});
  }
}