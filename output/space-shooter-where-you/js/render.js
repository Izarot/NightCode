export class Render{
  constructor(game){ this.game = game; this.cache = {}; }
  
  resize(){ }
  
  update(dt){ }
  
  frame(){
    const g = this.game; const ctx = g.ctx; const w = g.canvas.width/g.canvas.clientWidth; const h = g.canvas.height/g.canvas.clientHeight;
    ctx.clearRect(0,0,g.canvas.width/g.canvas.clientWidth,g.canvas.height/g.canvas.clientHeight);
    ctx.fillStyle = '#050a1a';
    ctx.fillRect(0,0,g.canvas.width/g.canvas.clientWidth,g.canvas.height/g.canvas.clientHeight);
    
    this.drawPlayer();
    this.drawEnemies();
    this.drawProjectiles();
    this.drawHUD();
  }
  
  drawPlayer(){ const g = this.game; const p = g.player; const ctx = g.ctx; const w = g.canvas.width/g.canvas.clientWidth; const h = g.canvas.height/g.canvas.clientHeight;
    ctx.save(); ctx.translate(w/2, h/2); ctx.rotate(p.angle);
    ctx.fillStyle = '#c0d8ff';
    ctx.beginPath(); ctx.moveTo(0,-p.r); ctx.lineTo(p.r,0); ctx.lineTo(0,p.r); ctx.lineTo(-p.r,0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  
  drawEnemies(){ const g = this.game; const ctx = g.ctx; const w = g.canvas.width/g.canvas.clientWidth; const h = g.canvas.height/g.canvas.clientHeight;
    for(const e of g.enemy.list){ ctx.fillStyle = '#ff4400'; ctx.beginPath(); ctx.arc(e.x-w/2, e.y-h/2, e.r, 0, Math.PI*2); ctx.fill(); }
  }
  
  drawProjectiles(){ const g = this.game; const ctx = g.ctx; const w = g.canvas.width/g.canvas.clientWidth; const h = g.canvas.height/g.canvas.clientHeight;
    for(const p of g.weapon.projectiles){ ctx.fillStyle = '#88ccff'; ctx.beginPath(); ctx.arc(p.x-w/2, p.y-h/2, p.r, 0, Math.PI*2); ctx.fill(); }
  }
  
  drawHUD(){ const g = this.game; const s = g.state; const ctx = g.ctx; const w = g.canvas.width/g.canvas.clientWidth; const h = g.canvas.height/g.canvas.clientHeight;
    ctx.fillStyle = 'rgba(10,20,40,.7)'; ctx.fillRect(10,10,200,30); ctx.fillStyle = '#00d4ff'; ctx.fillText('STAGE '+s.stage, 20, 30);
    ctx.fillStyle = 'rgba(10,20,40,.7)'; ctx.fillRect(w-210,10,200,30); ctx.fillStyle = '#00d4ff'; ctx.fillText('SCORE: '+s.score, w-200, 30);
    const mins = Math.floor(s.time/60); const secs = Math.floor(s.time%60); ctx.fillText('TIME: '+mins+':'+('0'+secs).slice(-2), w/2-50, 30);
  }
}