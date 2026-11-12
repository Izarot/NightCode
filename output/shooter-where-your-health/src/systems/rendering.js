export class Renderer {
  constructor(game){
    this.game=game;
    this.ctx=game.ctx;
    this.bgPattern=null;
    this.createBackground();
  }
  createBackground(){
    const size=64;
    const canvas=document.createElement('canvas');
    canvas.width=size; canvas.height=size;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#0a0a0f'; ctx.fillRect(0,0,size,size);
    ctx.strokeStyle='#00ffff11'; ctx.lineWidth=1;
    for(let i=0;i<=size;i+=16){
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(size,i); ctx.stroke();
    }
    this.bgPattern=this.ctx.createPattern(canvas,'repeat');
  }
  render(){
    const g=this.game; const ctx=this.ctx;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,g.canvas.width,g.canvas.height);
    ctx.save();
    ctx.translate(g.offsetX,g.offsetY);
    ctx.scale(g.scale,g.scale);
    ctx.translate(-g.camera.x,-g.camera.y);
    if(g.camera.shakeIntensity>0){
      ctx.translate((Math.random()-0.5)*g.camera.shakeIntensity,(Math.random()-0.5)*g.camera.shakeIntensity);
    }
    this.drawBackground();
    this.drawWorldBounds();
    for(const hp of g.healthPacks.list) this.drawHealthPack(hp);
    for(const e of g.enemies.list) this.drawEnemy(e);
    for(const b of g.weapon.bullets) this.drawBullet(b);
    this.drawPlayer(g.player);
    if(g.player.invuln>0) this.drawInvulnEffect(g.player);
    ctx.restore();
  }
  drawBackground(){
    const g=this.game; const ctx=this.ctx;
    ctx.fillStyle=this.bgPattern;
    ctx.fillRect(g.camera.x,g.camera.y,g.logicalWidth,g.logicalHeight);
  }
  drawWorldBounds(){
    const g=this.game; const ctx=this.ctx;
    ctx.strokeStyle='#00ffff33'; ctx.lineWidth=2;
    ctx.strokeRect(0,0,g.worldBounds.w,g.worldBounds.h);
  }
  drawPlayer(p){
    const ctx=this.ctx;
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle);
    const gradient=ctx.createRadialGradient(0,0,0,0,0,p.radius*1.5);
    gradient.addColorStop(0,p.colorCore); gradient.addColorStop(0.5,p.colorCore+'88'); gradient.addColorStop(1,'transparent');
    ctx.fillStyle=gradient; ctx.beginPath(); ctx.arc(0,0,p.radius*1.5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=p.colorRing; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,p.radius,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle=p.colorCore; ctx.beginPath(); ctx.moveTo(p.radius+4,0); ctx.lineTo(p.radius+12,-4); ctx.lineTo(p.radius+12,4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  drawInvulnEffect(p){
    const ctx=this.ctx;
    ctx.save(); ctx.translate(p.x,p.y);
    ctx.strokeStyle='#00ffff88'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(0,0,p.radius+5+Math.sin(Date.now()/50)*3,0,Math.PI*2); ctx.stroke();
    ctx.restore();
  }
  drawEnemy(e){
    const ctx=this.ctx;
    ctx.save(); ctx.translate(e.x,e.y); ctx.rotate(e.angle);
    const colors={basic:'#ff0066',fast:'#00ff88',tank:'#ff6600'};
    const c=colors[e.type]||e.color;
    ctx.fillStyle=c+'44'; ctx.beginPath(); ctx.arc(0,0,e.radius+2,0,Math.PI*2); ctx.fill();
    if(e.type==='tank'){
      ctx.fillStyle=c; ctx.beginPath();
      for(let i=0;i<6;i++){ const a=(i/6)*Math.PI*2; ctx.lineTo(Math.cos(a)*e.radius,Math.sin(a)*e.radius); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke();
    }else if(e.type==='fast'){
      ctx.fillStyle=c; ctx.beginPath(); ctx.moveTo(e.radius,0); ctx.lineTo(-e.radius*0.7,e.radius*0.7); ctx.lineTo(-e.radius*0.5,0); ctx.lineTo(-e.radius*0.7,-e.radius*0.7); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke();
    }else{
      ctx.fillStyle=c; ctx.beginPath(); ctx.arc(0,0,e.radius,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.stroke();
    }
    if(e.health<e.maxHealth){
      const bw=30; const bh=4;
      ctx.fillStyle='#1a1a2e'; ctx.fillRect(-bw/2,-e.radius-10,bw,bh);
      ctx.fillStyle='#ff0066'; ctx.fillRect(-bw/2,-e.radius-10,bw*e.health/e.maxHealth,bh);
    }
    ctx.restore();
  }
  drawBullet(b){
    const ctx=this.ctx;
    ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(b.angle);
    const gradient=ctx.createLinearGradient(-10,0,10,0);
    gradient.addColorStop(0,'transparent'); gradient.addColorStop(0.5,b.color); gradient.addColorStop(1,'transparent');
    ctx.fillStyle=gradient; ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(12,-3); ctx.lineTo(12,3); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  drawHealthPack(h){
    const ctx=this.ctx;
    const bob=Math.sin(h.bob)*3;
    ctx.save(); ctx.translate(h.x,h.y+bob);
    ctx.fillStyle='#00ff88'; ctx.strokeStyle='#00ff88';
    ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(0,-h.radius); ctx.lineTo(h.radius*0.7,0); ctx.lineTo(0,h.radius); ctx.lineTo(-h.radius*0.7,0); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle='#0a0a0f'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('+',0,1);
    ctx.restore();
  }
}