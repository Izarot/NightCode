export class Renderer {
  constructor(ctx, hudCtx) {
    this.ctx = ctx;
    this.hudCtx = hudCtx;
  }
  
  clear() {
    this.ctx.fillStyle = '#05050A';
    this.ctx.fillRect(0, 0, 1920, 1080);
  }
  
  drawGrid(px, py) {
    this.ctx.strokeStyle = '#1A1A2E';
    this.ctx.lineWidth = 1;
    
    const offsetX = (px % 50) - 25;
    const offsetY = (py % 50) - 25;
    
    for (let x = offsetX; x < 1920; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, 1080);
      this.ctx.stroke();
    }
    for (let y = offsetY; y < 1080; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(1920, y);
      this.ctx.stroke();
    }
  }
  
  drawProjectiles(seeds, shards) {
    this.ctx.fillStyle = '#FF2E63';
    for (const s of seeds) {
      this.ctx.save();
      this.ctx.translate(s.x, s.y);
      this.ctx.rotate(Date.now() * 0.003);
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = '#FF2E63';
      this.ctx.fillRect(-12, -12, 24, 24);
      this.ctx.restore();
    }
    
    this.ctx.fillStyle = '#FFE600';
    for (const h of shards) {
      this.ctx.save();
      this.ctx.translate(h.x, h.y);
      this.ctx.rotate(Math.atan2(h.vy, h.vx));
      this.ctx.fillRect(-8, -2, 16, 4);
      this.ctx.restore();
    }
  }
  
  drawPlayer(p) {
    this.ctx.fillStyle = '#00F5D4';
    this.ctx.strokeStyle = '#FF6B00';
    this.ctx.lineWidth = 2;
    
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.beginPath();
    this.ctx.moveTo(-10, 0);
    this.ctx.lineTo(10, -8);
    this.ctx.lineTo(10, 8);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }
  
  drawParticles(particles) {
    for (const p of particles) {
      this.ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;  
      this.ctx.fillRect(p.x-1, p.y-1, 2, 2);
    }
  }
  
  drawHUD(game) {
    const ctx = this.hudCtx;
    ctx.clearRect(0, 0, 1920, 1080);
    
    ctx.fillStyle = '#E0E0E0';
    ctx.font = '48px monospace';
    ctx.fillText(`TIME: ${game.time.toFixed(2)}s`, 50, 60);
    ctx.fillText(`SCORE: ${game.score}`, 50, 120);
    ctx.fillText(`HIGH: ${game.highScore.toFixed(2)}s`, 50, 180);
    
    ctx.fillStyle = '#FF2E63';
    for (let i = 0; i < game.player.lives; i++) {
      ctx.fillRect(1800 - i*60, 100, 50, 30);
    }
  }
}
