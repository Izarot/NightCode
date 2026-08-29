import {StateMachine} from './StateMachine.js';
import {Input} from './Input.js';
import {AudioManager} from './AudioManager.js';
import {HUD} from './HUD.js';
import {LEVELS} from '../levels/levels.js';
import {SaveManager} from './SaveManager.js';
import {ParticleSystem} from './ParticleSystem.js';

export class Game{
constructor(cv,hu,mu){
this.canvas=document.getElementById(cv);
this.ctx=this.canvas.getContext('2d');
this.hudEl=document.getElementById(hu);
this.menuEl=document.getElementById(mu);
this.audio=new AudioManager();
this.save=new SaveManager();
this.particles=new ParticleSystem();
this.input=new Input(this.canvas,this);
this.sm=new StateMachine(this);
this.hud=new HUD(this);
this.cell=48;this.cols=0;this.rows=0;this.offsetX=0;this.offsetY=0;
this.level=null;this.levelIdx=0;
this.runners=[];this.tiles=new Map();
this.tick=0;this.spawned=0;this.saved=0;this.lost=0;
this.phase='setup';this.selected='arrow4';this.rot=0;
this.hover=null;this.simAcc=0;this.tickDur=1000/60;
this.speed=1;this.lastTime=0;
this.resize();
window.addEventListener('resize',()=>this.resize());
}
resize(){
const dpr=window.devicePixelRatio||1;
const w=window.innerWidth,h=window.innerHeight;
this.canvas.width=w*dpr;this.canvas.height=h*dpr;
this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';
this.ctx.setTransform(dpr,0,0,dpr,0,0);
this.W=w;this.H=h;
if(this.level)this.computeLayout();
}
computeLayout(){
const maxW=this.W-24,maxH=this.H-(this.phase==='setup'?96:120);
const sz=Math.min(maxW/this.cols,maxH/this.rows,80);
this.cell=Math.max(28,Math.min(sz,80));
this.offsetX=Math.floor((this.W-this.cell*this.cols)/2);
this.offsetY=Math.floor((this.H-this.cell*this.rows)/2)+12;
}
loadLevel(idx){
this.levelIdx=idx;this.level=LEVELS[idx];
const L=this.level;
this.cols=L.gridSize.cols;this.rows=L.gridSize.rows;
this.walls=new Set();(L.walls||[]).forEach(w=>{
for(let dx=0;dx<w.w;dx++)for(let dy=0;dy<w.h;dy++)this.walls.add((w.x+dx)+','+(w.y+dy));
});
this.spawners=L.spawners.map(s=>({...s,cooldown:s.cooldown||15,t:0}));
this.exits=L.exits.map(e=>({...e,pulse:0}));
this.hazards=L.hazards.map(h=>({...h,flick:Math.random()}));
this.inv={...L.inventory};
this.tiles.clear();
this.runners=[];this.spawned=0;this.saved=0;this.lost=0;
this.tick=0;this.phase='setup';this.speed=1;
this.computeLayout();
this.hud.render();
}
placeTile(x,y,type,rot){
const k=x+','+y;
if(this.walls.has(k))return false;
if(['spawner','exit','hazard'].includes(this.getCellKind(x,y)))return false;
const exist=this.tiles.get(k);
if(exist){this.tiles.delete(k);this.inv[exist.type]++;}
if(!type)return true;
if((this.inv[type]||0)<=0)return false;
this.tiles.set(k,{type,x,y,rot:rot||0,age:0});
this.inv[type]--;
this.audio.place();
return true;
}
rotateHover(){
this.rot=(this.rot+1)%4;
}
getCellKind(x,y){
if(this.walls.has(x+','+y))return 'wall';
if(this.spawners.find(s=>s.x===x&&s.y===y))return 'spawner';
if(this.exits.find(e=>e.x===x&&e.y===y))return 'exit';
if(this.hazards.find(h=>h.x===x&&h.y===y))return 'hazard';
return 'empty';
}
startRun(){
if(this.phase!=='setup')return;
this.phase='run';this.tick=0;this.runners=[];
this.spawners.forEach(s=>s.t=0);
this.hud.render();
this.audio.start();
}
restart(){
this.loadLevel(this.levelIdx);
}
setSpeed(s){this.speed=s;this.hud.render();}
togglePause(){if(this.phase==='run'){this.phase='pause';this.audio.pause();}else if(this.phase==='pause'){this.phase='run';this.audio.unpause();}this.hud.render();}
step(){
if(this.phase!=='run')return;
this.tick++;
this.spawners.forEach(sp=>{
sp.t++;
if(sp.t>=sp.cooldown&&(!sp.maxEmissions||sp.spawned<(sp.maxEmissions||9999))){
sp.t=0;sp.spawned=(sp.spawned||0)+1;
this.runners.push({x:sp.x,y:sp.y,fx:sp.facing[0]==='N'?1:sp.facing[0]==='S'?-1:0,fy:sp.facing[1]==='E'?1:sp.facing[1]==='W'?-1:0,prevX:sp.x,prevY:sp.y});
this.spawned++;
this.particles.burst(this.cx(sp.x),this.cy(sp.y),'#FFC857',6);
}
});
const moves=[];
this.runners.forEach(r=>{
const k=r.x+','+r.y;const t=this.tiles.get(k);
let dx=r.fx,dy=r.fy;
if(t){
const dirs=[{fx:0,fy:1},{fx:1,fy:0},{fx:0,fy:-1},{fx:-1,fy:0}];
const d=dirs[(t.rot)%4];
dx=d.fx;dy=d.fy;
}
const nx=r.x+dx,ny=r.y+dy;
const kk=nx+','+ny;
if(nx<0||ny<0||nx>=this.cols||ny>=this.rows||this.walls.has(kk)){
this.lost++;this.particles.burst(this.cx(r.x),this.cy(r.y),'#FF6B4A',8);
this.audio.smash();return;
}
if(this.hazards.find(h=>h.x===nx&&h.y===ny)){
this.lost++;this.particles.burst(this.cx(nx),this.cy(ny),'#FF6B4A',10);
this.audio.smash();return;
}
if(this.exits.find(e=>e.x===nx&&e.y===ny)){
this.saved++;this.exits.forEach(e=>{if(e.x===nx&&e.y===ny)e.pulse=1;});
this.particles.burst(this.cx(nx),this.cy(ny),'#5EE08C',10);
this.audio.save();return;
}
r.prevX=r.x;r.prevY=r.y;r.x=nx;r.y=ny;r.fx=dx;r.fy=dy;
moves.push(r);
});
this.runners=moves;
const occ={};
this.runners.forEach(r=>{const k=r.x+','+r.y;occ[k]=(occ[k]||0)+1;});
this.runners=this.runners.filter(r=>{
if(occ[r.x+','+r.y]>1){this.lost++;this.particles.burst(this.cx(r.x),this.cy(r.y),'#FF6B4A',6);return false;}
return true;
});
const obj=this.level.objectives;
if(this.tick>=obj.maxTicks||(this.spawned>=obj.maxSpawned)||(this.saved+this.lost>=this.spawned&&this.tick>30)){
this.endRun();
}
}
endRun(){
this.phase='resolve';
const obj=this.level.objectives;
const ok=this.saved>=obj.saveAtLeast&&this.lost<=obj.maxLost;
this.audio[ok?'win':'lose']();
this.save.addHigh(this.saved);
this.menuEl.innerHTML='';
const m=document.createElement('div');m.className='modal';
const stars=ok?(this.lost===0?3:this.saved>=obj.saveAtLeast+2?2:1):0;
m.innerHTML=`<div class="card"><h2 class="${ok?'ok':'fail'}">${ok?'LEVEL COMPLETE':'TRY AGAIN'}</h2>
<div class="stars">${[1,2,3].map(i=>`<span class="s ${i<=stars?'on':''}">★</span>`).join('')}</div>
<div class="stats">
<div class="stat"><div class="v" style="color:var(--accent-green)">${this.saved}</div><div class="l">Saved</div></div>
<div class="stat"><div class="v" style="color:var(--accent-orange)">${this.lost}</div><div class="l">Lost</div></div>
<div class="stat"><div class="v">${this.tick}</div><div class="l">Ticks</div></div>
</div>
<div style="text-align:center;color:var(--text-muted);font-size:13px;">${ok?`High Score: ${this.save.getHigh()}`:`Need: ${obj.saveAtLeast} saved, ≤${obj.maxLost} lost`}</div>
<button class="btn primary" id="next">${ok?(this.levelIdx<LEVELS.length-1?'Next Level':'Finish'):'Retry'}</button>
<button class="btn" id="ls">Level Select</button>
</div>`;
this.menuEl.appendChild(m);
m.querySelector('#next').onclick=()=>{this.menuEl.innerHTML='';ok?this.loadLevel(Math.min(this.levelIdx+1,LEVELS.length-1)):this.restart();};
m.querySelector('#ls').onclick=()=>this.showLevelSelect();
}
cx(x){return this.offsetX+x*this.cell+this.cell/2;}
cy(y){return this.offsetY+y*this.cell+this.cell/2;}
start(){
this.showLevelSelect();
requestAnimationFrame(t=>this.loop(t));
}
showLevelSelect(){
const hs=this.save.getHigh();
this.menuEl.innerHTML='';
const m=document.createElement('div');m.className='modal';
m.innerHTML=`<div class="card"><h2 class="ok">ARROW GRID</h2>
<div style="text-align:center;color:var(--text-muted);">High Score: <span style="color:var(--accent-gold);font-family:monospace">${hs}</span></div>
<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;max-height:300px;overflow:auto;">
${LEVELS.map((l,i)=>`<button class="btn" data-i="${i}">${i+1}. ${l.title}</button>`).join('')}
</div></div>`;
this.menuEl.appendChild(m);
m.querySelectorAll('button[data-i]').forEach(b=>b.onclick=()=>{this.menuEl.innerHTML='';this.loadLevel(+b.dataset.i);});
}
loop(t){
const dt=Math.min(50,t-this.lastTime);this.lastTime=t;
if(this.phase==='run'){
this.simAcc+=dt*this.speed;
while(this.simAcc>=this.tickDur){this.step();this.simAcc-=this.tickDur;if(this.phase!=='run')break;}
}
this.render(dt);
this.particles.update(dt);
requestAnimationFrame(tt=>this.loop(tt));
}
render(dt){
const ctx=this.ctx;
ctx.fillStyle='#0E1428';ctx.fillRect(0,0,this.W,this.H);
if(!this.level)return;
this.computeLayout();
const sz=this.cell;
ctx.fillStyle='#1B2438';
ctx.fillRect(this.offsetX,this.offsetY,this.cols*sz,this.rows*sz);
ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
for(let i=0;i<=this.cols;i++){ctx.beginPath();ctx.moveTo(this.offsetX+i*sz,this.offsetY);ctx.lineTo(this.offsetX+i*sz,this.offsetY+this.rows*sz);ctx.stroke();}
for(let i=0;i<=this.rows;i++){ctx.beginPath();ctx.moveTo(this.offsetX,this.offsetY+i*sz);ctx.lineTo(this.offsetX+this.cols*sz,this.offsetY+i*sz);ctx.stroke();}
this.walls.forEach(k=>{
const[x,y]=k.split(',').map(Number);
ctx.fillStyle='#2A2F3E';ctx.fillRect(this.offsetX+x*sz+1,this.offsetY+y*sz+1,sz-2,sz-2);
ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(this.offsetX+x*sz+1,this.offsetY+y*sz+1,sz-2,4);
});
this.hazards.forEach(h=>{
h.flick=(h.flick+0.05)%1;
const fx=Math.sin(h.flick*10)*3;
const x=this.offsetX+h.x*sz,y=this.offsetY+h.y*sz;
ctx.fillStyle='#FF6B4A';ctx.fillRect(x+2,y+2,sz-4,sz-4);
ctx.fillStyle=`rgba(255,200,100,${0.4+fx/8})`;ctx.fillRect(x+6,y+6,sz-12,sz-12);
});
this.exits.forEach(e=>{
const x=this.offsetX+e.x*sz,y=this.offsetY+e.y*sz;
const p=1+e.pulse;e.pulse*0.9;
ctx.fillStyle='#5EE08C';ctx.fillRect(x+3,y+3,sz-6,sz-6);
ctx.strokeStyle=`rgba(94,224,140,${0.4+e.pulse})`;ctx.lineWidth=3;
ctx.strokeRect(x+3-e.pulse*3,y+3-e.pulse*3,sz-6+e.pulse*6,sz-6+e.pulse*6);
});
this.spawners.forEach(sp=>{
const x=this.offsetX+sp.x*sz,y=this.offsetY+sp.y*sz;
ctx.fillStyle='#FFC857';ctx.fillRect(x+2,y+2,sz-4,sz-4);
const t=Date.now()/1000;const a=(t%2)*Math.PI*2;
ctx.save();ctx.translate(x+sz/2,y+sz/2);ctx.rotate(a);
ctx.fillStyle='#0E1428';ctx.beginPath();ctx.moveTo(0,-sz/4);ctx.lineTo(sz/4,0);ctx.lineTo(0,sz/4);ctx.closePath();ctx.fill();
ctx.restore();
});
this.tiles.forEach(t=>{
const x=this.offsetX+t.x*sz,y=this.offsetY+t.y*sz;
const colors={arrow4:'#3FD0C9',conveyor:'#A78BFA',oneway:'#FFC857',mirror:'#D6D6E0',teleporter:'#FF6FB5'};
const c=colors[t.type]||'#fff';
ctx.fillStyle=c;ctx.fillRect(x+4,y+4,sz-8,sz-8);
ctx.save();ctx.translate(x+sz/2,y+sz/2);
if(t.type==='arrow4'||t.type==='arrow8'){
ctx.rotate(t.rot*Math.PI/2);
ctx.fillStyle='#0E1428';ctx.beginPath();ctx.moveTo(sz/4,0);ctx.lineTo(-sz/6,-sz/5);ctx.lineTo(-sz/8,0);ctx.lineTo(-sz/6,sz/5);ctx.closePath();ctx.fill();
}else if(t.type==='conveyor'){
ctx.strokeStyle='#0E1428';ctx.lineWidth=2;
for(let i=-2;i<3;i++){ctx.beginPath();ctx.moveTo(i*sz/5,-sz/3);ctx.lineTo(i*sz/5+sz/8,sz/3);ctx.stroke();}
}else if(t.type==='oneway'){
ctx.fillStyle='#0E1428';ctx.beginPath();ctx.moveTo(sz/4,0);ctx.lineTo(-sz/6,-sz/5);ctx.lineTo(-sz/6,sz/5);ctx.closePath();ctx.fill();
ctx.fillStyle='rgba(14,20,40,0.5)';ctx.fillRect(-sz/3,-sz/3,4,sz*2/3);
}else if(t.type==='mirror'){
ctx.strokeStyle='#0E1428';ctx.lineWidth=3;
ctx.beginPath();ctx.moveTo(-sz/4,sz/4);ctx.lineTo(sz/4,-sz/4);ctx.stroke();
}else if(t.type==='teleporter'){
ctx.fillStyle='#0E1428';ctx.font=`${sz/2}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✦',0,0);
}
ctx.restore();
});
const t=this.tickDur;const prog=Math.min(1,this.simAcc/t);
this.runners.forEach(r=>{
const ix=r.prevX+(r.x-r.prevX)*prog,iy=r.prevY+(r.y-r.prevY)*prog;
const x=this.offsetX+ix*sz,y=this.offsetY+iy*sz;
ctx.fillStyle='rgba(127,231,255,0.3)';
ctx.fillRect(this.offsetX+r.prevX*sz+sz/3,this.offsetY+r.prevY*sz+sz/3,sz/3,sz/3);
ctx.shadowColor='#7FE7FF';ctx.shadowBlur=10;
ctx.fillStyle='#F5F5F0';ctx.beginPath();ctx.arc(x+sz/2,y+sz/2,sz/3,0,Math.PI*2);ctx.fill();
ctx.shadowBlur=0;
});
this.particles.draw(ctx);
if(this.phase==='setup'&&this.hover){
const h=this.hover;
const x=this.offsetX+h.x*sz,y=this.offsetY+h.y*sz;
const kinds=this.getCellKind(h.x,h.y);
const valid=kinds==='empty'&&(this.inv[this.selected]||0)>0;
ctx.strokeStyle=valid?'#5EE08C':'#FF6B4A';ctx.lineWidth=2;
ctx.strokeRect(x+2,y+2,sz-4,sz-4);
if(valid){
ctx.globalAlpha=0.5;
ctx.save();ctx.translate(x+sz/2,y+sz/2);ctx.rotate(this.rot*Math.PI/2);
ctx.fillStyle='#3FD0C9';ctx.beginPath();ctx.moveTo(sz/4,0);ctx.lineTo(-sz/6,-sz/5);ctx.lineTo(-sz/8,0);ctx.lineTo(-sz/6,sz/5);ctx.closePath();ctx.fill();
ctx.restore();ctx.globalAlpha=1;
}
}
}
}
