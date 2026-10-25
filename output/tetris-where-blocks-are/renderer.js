const CELL=30, OFFSET_X=30, OFFSET_Y=20;
const COLORS = { bg:'#0B0F19', grid:'#1F2937', stroke:'rgba(255,255,255,0.4)', ghost:'rgba(255,255,255,0.15)' };
class Renderer{
  constructor(canvas){ this.ctx=canvas.getContext('2d'); this.canvas=canvas; this.shake=0; this.shakeTime=0; this.particles=[]; this.bgHue=220; }
  resize(){ const rect=this.canvas.parentElement.getBoundingClientRect(); const dpr=window.devicePixelRatio||1; this.canvas.width=rect.width*dpr; this.canvas.height=rect.height*dpr; this.ctx.scale(dpr,dpr); this.logicalW=rect.width; this.logicalH=rect.height; }
  drawBackground(domEmo){ this.ctx.fillStyle=COLORS.bg; this.ctx.fillRect(0,0,this.logicalW,this.logicalH);
    const grad=this.ctx.createRadialGradient(this.logicalW/2,this.logicalH/2,0,this.logicalW/2,this.logicalH/2,Math.max(this.logicalW,this.logicalH));
    grad.addColorStop(0,'#111827'); grad.addColorStop(1,'#0B0F19');
    this.ctx.fillStyle=grad; this.ctx.fillRect(0,0,this.logicalW,this.logicalH);
    this.ctx.strokeStyle=COLORS.grid; this.ctx.lineWidth=1;
    for(let c=0;c<=10;c++){ const x=OFFSET_X+c*CELL; this.ctx.beginPath(); this.ctx.moveTo(x,OFFSET_Y); this.ctx.lineTo(x,OFFSET_Y+20*CELL); this.ctx.stroke(); }
    for(let r=0;r<=20;r++){ const y=OFFSET_Y+r*CELL; this.ctx.beginPath(); this.ctx.moveTo(OFFSET_X,y); this.ctx.lineTo(OFFSET_X+10*CELL,y); this.ctx.stroke(); }
  }
  drawBlock(x,y,color,emotion,alpha=1,glow=true,radius=8,scale=1){ const ctx=this.ctx; const px=OFFSET_X+x*CELL+CELL*(1-scale)/2; const py=OFFSET_Y+y*CELL+CELL*(1-scale)/2; const sz=CELL*scale-2;
    ctx.save(); ctx.translate(px+sz/2, py+sz/2);
    if(glow){ ctx.shadowBlur=12*scale; ctx.shadowColor=emotion.color+'99'; }
    ctx.fillStyle=color; ctx.globalAlpha=alpha;
    this.roundRect(-sz/2,-sz/2,sz,sz,radius*scale); ctx.fill();
    ctx.strokeStyle=COLORS.stroke; ctx.lineWidth=1.5*scale; ctx.stroke();
    ctx.restore();
  }
  roundRect(x,y,w,h,r){ const ctx=this.ctx; ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); }
  drawPiece(piece, ghost=false){ const scale=piece.getSpawnScale(); const alpha=ghost?0.3:1; for(const b of piece.getBlocks()){ if(b.y>=0) this.drawBlock(b.x,b.y,piece.emotion.color,piece.emotion,alpha,!ghost,8,scale); } }
  drawGrid(grid){ for(let r=0;r<20;r++) for(let c=0;c<10;c++){ const cell=grid.getCell(r,c); if(cell){ const emo=Emotion.getEmotion(cell.emotion); const prog=grid.getClearProgress(r); if(prog>0){ const sc=1+0.2*prog; const al=1-prog; this.drawBlock(c,r,cell.color,emo,al,true,8,sc); }else{ this.drawBlock(c,r,cell.color,emo,0.8,false,4); } } } }
  drawParticles(){ this.particles.forEach(p=>{ p.life-=16; if(p.life<=0) return; const ctx=this.ctx; ctx.save(); ctx.globalAlpha=p.life/p.maxLife; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); ctx.restore(); p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; }); this.particles=this.particles.filter(p=>p.life>0); }
  emitParticles(x,y,color,count=20){ for(let i=0;i<count;i++){ const ang=Math.random()*Math.PI*2; const spd=1+Math.random()*3; this.particles.push({x,y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,size:2+Math.random()*3,color,maxLife:600,life:600}); } }
  emitBurst(x,y,count=100){ for(let i=0;i<count;i++){ const ang=Math.random()*Math.PI*2; const spd=2+Math.random()*5; this.particles.push({x,y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,size:3+Math.random()*4,color:'#fff',maxLife:800,life:800}); } }
  shakeScreen(intensity=5, duration=200){ this.shake=intensity; this.shakeTime=duration; }
  updateShake(dt){ if(this.shakeTime>0){ this.shakeTime-=dt; this.shake=Math.max(0, this.shake*0.95); } }
  applyShake(){ if(this.shake>0.5){ const dx=(Math.random()-0.5)*this.shake; const dy=(Math.random()-0.5)*this.shake; this.ctx.translate(dx, dy); } }
  drawNext(pieces, container){ container.innerHTML=''; pieces.slice(0,3).forEach(p=>{ const box=document.createElement('div'); box.className='next-box'; box.style.position='relative'; const c=document.createElement('canvas'); c.width=64; c.height=64; c.style.width='100%'; c.style.height='100%'; box.appendChild(c); container.appendChild(box); const ctx=c.getContext('2d'); const cells=[]; for(let y=0;y<p.matrix.length;y++) for(let x=0;x<p.matrix[y].length;x++) if(p.matrix[y][x]) cells.push({x,y}); const minX=Math.min(...cells.map(c=>c.x)), maxX=Math.max(...cells.map(c=>c.x)); const minY=Math.min(...cells.map(c=>c.y)), maxY=Math.max(...cells.map(c=>c.y)); const w=maxX-minX+1, h=maxY-minY+1; const scale=40/Math.max(w,h); const ox=(64-w*scale)/2, oy=(64-h*scale)/2; ctx.save(); ctx.translate(ox,oy); cells.forEach(b=>{ const px=(b.x-minX)*scale, py=(b.y-minY)*scale; ctx.fillStyle=p.emotion.color; ctx.shadowBlur=8; ctx.shadowColor=p.emotion.color+'99'; this.roundRect(px,py,scale-2,scale-2,4); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1; ctx.stroke(); }); ctx.restore(); }); }
  drawHold(piece, container){ container.innerHTML=''; if(!piece) return; const box=document.createElement('div'); box.className='next-box'; box.style.position='relative'; const c=document.createElement('canvas'); c.width=64; c.height=64; c.style.width='100%'; c.style.height='100%'; box.appendChild(c); container.appendChild(box); const ctx=c.getContext('2d'); const cells=[]; for(let y=0;y<piece.matrix.length;y++) for(let x=0;x<piece.matrix[y].length;x++) if(piece.matrix[y][x]) cells.push({x,y}); const minX=Math.min(...cells.map(c=>c.x)), maxX=Math.max(...cells.map(c=>c.x)); const minY=Math.min(...cells.map(c=>c.y)), maxY=Math.max(...cells.map(c=>c.y)); const w=maxX-minX+1, h=maxY-minY+1; const scale=40/Math.max(w,h); const ox=(64-w*scale)/2, oy=(64-h*scale)/2; ctx.save(); ctx.translate(ox,oy); cells.forEach(b=>{ const px=(b.x-minX)*scale, py=(b.y-minY)*scale; ctx.fillStyle=piece.emotion.color; ctx.shadowBlur=8; ctx.shadowColor=piece.emotion.color+'99'; this.roundRect(px,py,scale-2,scale-2,4); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1; ctx.stroke(); }); ctx.restore(); }
}
window.Renderer = { Renderer, CELL, OFFSET_X, OFFSET_Y, COLORS };