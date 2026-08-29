export class HUD{
constructor(g){this.g=g;g.hudEl.innerHTML='';this.render();}
render(){
const g=this.g;g.hudEl.innerHTML='';
const top=document.createElement('div');top.className='topbar';
top.innerHTML=`<div class="title">Arrow Grid Director</div>
<div class="objectives">${g.level?`
<div class="pill ${g.saved>=(g.level.objectives.saveAtLeast||0)?'ok':''}">
<span>★</span><span>Save ${g.level.objectives.saveAtLeast}+</span>
</div>
<div class="pill ${g.lost<=g.level.objectives.maxLost?'ok':'fail'}">
<span>✗</span><span>≤${g.level.objectives.maxLost} lost</span>
</div>
<div class="pill">⏱ ${g.level.objectives.maxTicks} ticks</div>
`:''}</div>
<div class="topbtns">
<button class="iconbtn" id="pause" title="Pause (Esc)">${g.phase==='pause'?'▶':'❚❚'}</button>
<button class="iconbtn" id="restart" title="Restart">↻</button>
</div>`;
g.hudEl.appendChild(top);
if(g.phase==='setup'||g.phase==='run'||g.phase==='pause'){
const inv=document.createElement('div');inv.className='inv';
const tools=['arrow4','conveyor','oneway','mirror','teleporter','arrow8'];
const icons={'arrow4':'➤','oneway':'→','conveyor':'≡','mirror':'◢','teleporter':'✦','arrow8':'✸'};
tools.forEach((t,i)=>{
const c=g.inv[t]||0;
const s=document.createElement('div');
s.className='slot'+(g.selected===t?' sel':'')+(c===0?' empty':'');
s.innerHTML=`<div class="ic">${icons[t]||'?'}</div>${c>0?`<div class="badge">${c}</div>`:''}<div class="key">${i+1}</div>`;
s.onclick=()=>{if(c>0){g.selected=t;g.rot=0;this.render();}};
inv.appendChild(s);
});
g.hudEl.appendChild(inv);
}
if(g.phase==='run'||g.phase==='pause'||g.phase==='resolve'){
const ab=document.createElement('div');ab.className='actionbar';
if(g.phase!=='resolve'){
ab.innerHTML=`<button class="abtn" id="r">Restart</button>
<button class="abtn" id="sp">Speed ${g.speed}×</button>
<button class="abtn primary" id="go">${g.phase==='pause'?'Resume':'Run'}</button>`;
g.hudEl.appendChild(ab);
ab.querySelector('#r').onclick=()=>g.restart();
ab.querySelector('#sp').onclick=()=>g.setSpeed(g.speed>=4?1:g.speed*2);
ab.querySelector('#go').onclick=()=>{if(g.phase==='pause')g.togglePause();else g.startRun();};
}
const tm=document.createElement('div');tm.className='timer';tm.innerHTML=`<svg viewBox="0 0 60 60"><circle class="bg" cx="30" cy="30" r="26"/><circle class="fg" cx="30" cy="30" r="26" stroke-dasharray="${2*Math.PI*26}" stroke-dashoffset="${2*Math.PI*26*(1-Math.max(0,1-g.tick/(g.level.objectives.maxTicks||1)))}"/></svg><span>${g.tick}</span>`;
g.hudEl.appendChild(tm);
const ct=document.createElement('div');ct.className='counters';
const total=g.spawned||1;
ct.innerHTML=`<div class="ctr spawned"><span>S</span><div class="bar"><div class="fill" style="width:${Math.min(100,g.spawned/total*100)}%"></div></div><span>${g.spawned}</span></div>
<div class="ctr saved"><span>✓</span><div class="bar"><div class="fill" style="width:${Math.min(100,g.saved/total*100)}%"></div></div><span>${g.saved}</span></div>
<div class="ctr lost"><span>✗</span><div class="bar"><div class="fill" style="width:${Math.min(100,g.lost/total*100)}%"></div></div><span>${g.lost}</span></div>`;
g.hudEl.appendChild(ct);
}
if(g.phase==='setup'&&g.level){
const start=document.createElement('div');start.style.cssText='position:absolute;top:60px;left:50%;transform:translateX(-50%);pointer-events:auto;';
start.innerHTML=`<button class="abtn primary" id="st">▶ Start (Space)</button>`;
g.hudEl.appendChild(start);
start.querySelector('#st').onclick=()=>g.startRun();
}
top.querySelector('#pause').onclick=()=>g.togglePause();
top.querySelector('#restart').onclick=()=>g.restart();
}
}
