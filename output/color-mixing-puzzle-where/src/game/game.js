import { Input } from '../engine/input.js';
import { Player } from './player.js';
import { makeLevel } from './level.js';
import { W,H, GRAV } from '../engine/constants.js';
import { clamp, rgb, rgba, tint } from '../engine/constants.js';
import { sfx } from '../engine/audio.js';

export class Game{
  constructor(canvas){
    this.canvas=canvas; this.ctx=canvas.getContext('2d');
    this.input=new Input(canvas);
    this.level=makeLevel();
    this.player=new Player(this.level.spawn.x, this.level.spawn.y);
    this.state='menu'; this.menuIdx=0; this.menuItems=['Start','Reset High Score'];
    this.best=parseFloat(localStorage.getItem('cs_best')||'0')||0;
    this.parTime=45; this.startTime=0; this.endTime=0;
    this.particles=[]; this.bgStars=Array.from({length:80},()=>({x:Math.random()*2000,y:Math.random()*720,s:Math.random()*2+0.5}));
    this.resize();
  }
  resize(){ /* CSS handles responsive scaling via 100% width */ }
  frame(t){
    const dt=Math.min(0.033, 1/60);
    this.ctx.fillStyle='#0a0a18'; this.ctx.fillRect(0,0,W,H);
    // bg parallax
    const cam=this.level.cam;
    this.bgStars.forEach(s=>{ this.ctx.fillStyle=rgba(200,180,255,0.5+s*0.2); this.ctx.fillRect((s.x*0.3-cam.x*0.2)%W,(s.y)%H,s,s);});
    // far gradient
    const grd=this.ctx.createLinearGradient(0,0,0,H);
    grd.addColorStop(0,'#2a0a4a'); grd.addColorStop(1,'#0a0a18');
    this.ctx.fillStyle=grd; this.ctx.fillRect(0,0,W,H);
    if(this.state==='menu'){ this.drawMenu(); return; }
    if(this.state==='play') this.update(dt,t);
    this.draw();
    if(this.state==='won') this.drawWin();
  }
  update(dt,t){
    const L=this.level;
    L.t+=dt;
    this.player.update(dt, L, this.input);
    // cam follow
    L.cam.x = clamp(this.player.x - W/2, 0, 2400);
    // particles
    this.particles.forEach(p=>{ p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=200*dt; p.life-=dt; });
    this.particles=this.particles.filter(p=>p.life>0);
    if(this.particles.length<60) this.particles.push({x:Math.random()*1280,y:Math.random()*720,vx:(Math.random()-0.5)*40,vy:(Math.random()-0.5)*40,life:0.8,c:[Math.random()*255,Math.random()*255,255]});
    // droplet physics
    L.droplets.forEach(d=>{ if(d.dynamic){ d.vy+=GRAV*dt; d.x+=d.vx*dt; d.y+=d.vy*dt; L.solids.forEach(s=>{ if(s.x<d.x+24&&s.x+s.w>d.x&&s.y<d.y+24&&s.y+s.h>d.y){ d.dynamic=false; d.dead=false; }}); if(d.y>H+50){d.dead=true; d.dynamic=false;} }});
    // platforms activation
    L.platforms.forEach(p=>{ if(this.player.match(p.c)){ if(!p.active){sfx.gate(); for(let i=0;i<20;i++) this.spawnP(p.x+p.w/2,p.y);} p.active=true;} else p.active=false; });
    // gate visuals
    L.gates.forEach(g=>{ if(g.open && Math.random()<0.1) this.spawnP(g.x,g.y+Math.random()*g.h); });
  }
  spawnP(x,y){ this.particles.push({x,y,vx:(Math.random()-0.5)*120,vy:(Math.random()-0.5)*120-30,life:0.7,c:[255,200,Math.random()*255]}); }
  respawn(){
    this.player.x=this.level.spawn.x; this.player.y=this.level.spawn.y;
    this.player.vx=0; this.player.vy=0; this.player.inventory=[]; this.player.active=[0,0,0];
  }
  win(){
    if(this.state==='won') return;
    this.state='won'; sfx.win();
    const t=this.level.t;
    if(this.best===0||t<this.best){ this.best=t; localStorage.setItem('cs_best', t.toFixed(2)); }
  }
  draw(){
    const ctx=this.ctx; const L=this.level; const cam=L.cam;
    ctx.save(); ctx.translate(-cam.x,0);
    // solids
    L.solids.forEach(s=>{ const gx=s.x-cam.x; if(gx<-64||gx>W+64) return; ctx.fillStyle='#3a1a5a'; ctx.fillRect(s.x,s.y,s.w,s.h); ctx.strokeStyle='#ff00aa55'; ctx.strokeRect(s.x,s.y,s.w,s.h); });
    // palettes
    L.palettes.forEach(p=>{ const c=p.c||[80,80,120]; ctx.fillStyle=rgba(c[0],c[1],c[2],0.6); ctx.beginPath(); ctx.arc(p.x+p.w/2,p.y+p.h/2,p.w/2,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#fff8'; ctx.stroke(); const a=L.t*2; ctx.strokeStyle=rgba(255,255,255,0.4); for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(p.x+p.w/2,p.y+p.h/2, 8+i*6, a+i, a+i+1); ctx.stroke(); }});
    // hazards
    L.hazards.forEach(h=>{ const c=h.c; ctx.fillStyle=rgba(c[0],c[1],c[2],0.7); ctx.fillRect(h.x,h.y,h.w,h.h); for(let i=0;i<5;i++){ const yy=h.y+Math.sin(L.t*4+i)*4; ctx.beginPath(); ctx.arc(h.x+i*30,h.y+yy*0.1,4,0,Math.PI*2); ctx.fill(); }});
    // platforms
    L.platforms.forEach(p=>{ ctx.globalAlpha=p.active?1:0.25; ctx.fillStyle=rgb(p.c[0],p.c[1],p.c[2]); ctx.fillRect(p.x,p.y,p.w,p.h); ctx.globalAlpha=1; if(p.active && this.player.match(p.c)){ ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.strokeRect(p.x,p.y,p.w,p.h); }});
    // gates
    L.gates.forEach(g=>{ ctx.fillStyle= g.open? rgba(g.c[0],g.c[1],g.c[2],0.4) : rgb(g.c[0],g.c[1],g.c[2]); ctx.fillRect(g.x,g.y,g.w,g.h); ctx.strokeStyle='#fff8'; ctx.strokeRect(g.x,g.y,g.w,g.h); if(this.player.match(g.c) && !g.open){ ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.strokeRect(g.x-2,g.y-2,g.w+4,g.h+4); }});
    // droplets
    L.droplets.forEach(d=>{ if(d.dead) return; const c=d.c; const g=ctx.createRadialGradient(d.x+12,d.y+12,2,d.x+12,d.y+12,14); g.addColorStop(0,rgb(c[0],c[1],c[2])); g.addColorStop(1,rgba(c[0],c[1],c[2],0)); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(d.x+12,d.y+12,12,0,Math.PI*2); ctx.fill();});
    // exit
    if(L.exit){ const e=L.exit; const pulse=0.5+0.5*Math.sin(L.t*4); ctx.fillStyle=rgba(255,255,255,0.3+pulse*0.4); ctx.beginPath(); ctx.ellipse(e.x+e.w/2,e.y+e.h/2,e.w/2,e.h/2,0,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke(); }
    // player
    this.player.draw(ctx);
    // particles
    this.particles.forEach(p=>{ ctx.fillStyle=rgba(p.c[0],p.c[1],p.c[2], clamp(p.life,0,1)); ctx.fillRect(p.x,p.y,3,3); });
    ctx.restore();
    // HUD
    this.drawHUD();
  }
  drawHUD(){
    const ctx=this.ctx;
    // active color
    const c=this.player.active;
    ctx.fillStyle='#fff'; ctx.font='bold 16px monospace'; ctx.fillText('ACTIVE', 20, 22);
    ctx.beginPath(); ctx.arc(90,40,22,0,Math.PI*2); ctx.fillStyle=rgb(c[0],c[1],c[2]); ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
    // inventory
    ctx.fillStyle='#fff'; ctx.fillText('INVENTORY', 140, 22);
    for(let i=0;i<3;i++){
      const x=140+i*40, y=40;
      ctx.beginPath(); ctx.arc(x,40,12,0,Math.PI*2); ctx.fillStyle=this.player.inventory[i]?rgb(this.player.inventory[i].c[0],this.player.inventory[i].c[1],this.player.inventory[i].c[2]):'#222'; ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
    }
    // level title
    ctx.fillStyle='#ff00aa'; ctx.font='bold 18px monospace'; ctx.textAlign='center'; ctx.fillText('CHROMASHIFT — Level 1: The Paint Factory', W/2, 26); ctx.textAlign='left';
    // timer
    const t=this.level.t; const mm=String(Math.floor(t/60)).padStart(2,'0'); const ss=String(Math.floor(t%60)).padStart(2,'0');
    ctx.fillStyle = t>this.parTime ? '#ff4060' : '#fff';
    ctx.font='bold 22px monospace'; ctx.textAlign='right';
    ctx.fillText(`⏱ ${mm}:${ss}`, W-20, 32);
    ctx.font='14px monospace'; ctx.fillText(`Par ${this.parTime}s | Best ${this.best?this.best.toFixed(2):'--'}s`, W-20, 50);
    ctx.textAlign='left';
    // controls hint
    ctx.fillStyle='#aaf'; ctx.font='12px monospace'; ctx.fillText('Arrows/WASD:Move  Space:Jump  Shift+Release:Throw  R:Restart', 20, H-16);
  }
  drawMenu(){
    const ctx=this.ctx;
    ctx.fillStyle='#fff'; ctx.font='bold 60px monospace'; ctx.textAlign='center';
    ctx.fillText('CHROMASHIFT', W/2, 220);
    ctx.font='20px monospace'; ctx.fillStyle='#ff00aa'; ctx.fillText('A 2D Color-Mixing Puzzle Platformer', W/2, 260);
    this.menuItems.forEach((m,i)=>{
      ctx.fillStyle = i===this.menuIdx ? '#fff' : '#888';
      ctx.font='bold 28px monospace';
      ctx.fillText((i===this.menuIdx?'> ':'  ')+m, W/2, 360+i*50);
    });
    ctx.font='14px monospace'; ctx.fillStyle='#aaf';
    ctx.fillText('Press SPACE/CLICK to select | Use ↑↓', W/2, 500);
    ctx.fillText('Best Time: '+(this.best?this.best.toFixed(2)+'s':'--'), W/2, 530);
    ctx.textAlign='left';
    if(this.input.consume('ArrowUp')||this.input.consume('KeyW')) this.menuIdx=(this.menuIdx-1+this.menuItems.length)%this.menuItems.length;
    if(this.input.consume('ArrowDown')||this.input.consume('KeyS')) this.menuIdx=(this.menuIdx+1)%this.menuItems.length;
    if(this.input.consume('Space')||this.input._down){
      this.input._down=false;
      if(this.menuIdx===0){ this.state='play'; this.level=makeLevel(); this.player=new Player(this.level.spawn.x,this.level.spawn.y); }
      else { localStorage.removeItem('cs_best'); this.best=0; }
    }
  }
  drawWin(){
    const ctx=this.ctx;
    ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.textAlign='center';
    ctx.font='bold 60px monospace'; ctx.fillText('LEVEL COMPLETE!', W/2, 240);
    ctx.font='24px monospace';
    ctx.fillText(`Time: ${this.level.t.toFixed(2)}s  (Par ${this.parTime}s)`, W/2, 320);
    ctx.fillText(`Best: ${this.best.toFixed(2)}s`, W/2, 360);
    ctx.fillStyle='#ff0'; ctx.fillText('Press SPACE to return to menu', W/2, 460);
    ctx.textAlign='left';
    if(this.input.consume('Space')){ this.state='menu'; }
    for(let i=0;i<5;i++) this.particles.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-0.5)*100,vy:-Math.random()*150,life:1.5,c:[Math.random()*255,Math.random()*255,Math.random()*255]});
  }
}
function clamp(v,a,b){return v<a?a:v>b?b:v;}
