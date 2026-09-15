const C = { W: 10, H: 15, CS: 32, COLORS: ['#ffd700', '#e85d04', '#00bfff', '#32cd32', '#9b30ff'], TYPES: { NORMAL: 0, BOMB: 1, RAINBOW: 2, LINE_H: 3, LINE_V: 4 } };
const S = { LOADING: 0, IDLE: 1, SWAPPING: 2, PHYSICS: 3, MATCHING: 4, DISSOLVING: 5, PAUSED: 6, GAMEOVER: 7 };
const canvas = document.getElementById('canvas'), ctx = canvas.getContext('2d');
let W, H, scale, state = S.LOADING, grid = [], particles = [], selected = null, swapAnim = null, chain = 0, score = 0, timer = 0, running = true, goals = {}, goalColors = [], highScore = 0;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(f, d, t='sine', v=0.1) { if(!audioCtx) return; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type=t; o.frequency.value=f; g.gain.value=v; g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+d); o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+d); }
function noise(ctx, w, h) { const d=ctx.createImageData(w,h); for(let i=0;i<d.data.length;i+=4){ const n=Math.random()*60; d.data[i]=d.data[i+1]=d.data[i+2]=n; d.data[i+3]=255; } return d; }
const noiseCache = {}; function getNoise(c) { if(!noiseCache[c]){ const cnv=document.createElement('canvas'); cnv.width=cnv.height=32; const c2=cnv.getContext('2d'); c2.fillStyle=c; c2.fillRect(0,0,32,32); c2.globalCompositeOperation='overlay'; c2.putImageData(noise(c2,32,32),0,0); noiseCache[c]=cnv; } return noiseCache[c]; }
function resize() { W = canvas.parentElement.clientWidth; H = canvas.parentElement.clientHeight; scale = Math.min(W, H) / (C.W * C.CS); canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio); }
function initGrid() { grid = Array.from({length:C.W},()=>Array(C.H).fill(null)); goalColors = []; goals = {}; for(let i=0;i<3;i++){ const c=Math.floor(Math.random()*C.COLORS.length); if(!goalColors.includes(c)) goalColors.push(c); } goalColors.forEach(c=>goals[c]=Math.floor(Math.random()*6)+5); fillTop(); }
function fillTop() { for(let x=0;x<C.W;x++) for(let y=C.H-1;y>=0;y--) if(!grid[x][y]){ const c=goalColors[Math.floor(Math.random()*goalColors.length)]; grid[x][y]={x,y,tx:x,ty:y,c,type:C.TYPES.NORMAL,vx:0,vy:0,alpha:1,scale:1,matched:false}; break; } }
function getColHeight(x) { for(let y=C.H-1;y>=0;y--) if(grid[x][y]) return y+1; return 0; }
function isEmpty(x,y) { return x<0||x>=C.W||y<0||y>=C.H||!grid[x][y]; }
function physicsTick() { let moved=false; for(let y=1;y<C.H;y++) for(let x=0;x<C.W;x++){ const b=grid[x][y]; if(!b||b.matched) continue; if(isEmpty(x,y-1)){ grid[x][y-1]=b; grid[x][y]=null; b.ty=y-1; moved=true; continue; } const lh=getColHeight(x-1), rh=getColHeight(x+1), ch=y+1; if(ch-lh>=2&&isEmpty(x-1,y-1)){ grid[x-1][y-1]=b; grid[x][y]=null; b.tx=x-1; b.ty=y-1; moved=true; } else if(ch-rh>=2&&isEmpty(x+1,y-1)){ grid[x+1][y-1]=b; grid[x][y]=null; b.tx=x+1; b.ty=y-1; moved=true; } } return moved; }
function findMatches() { const vis=Array.from({length:C.W},()=>Array(C.H).fill(false)); const clusters=[]; for(let x=0;x<C.W;x++) for(let y=0;y<C.H;y++){ const b=grid[x][y]; if(!b||b.matched||vis[x][y]) continue; const col=b.c, q=[[x,y]], cl=[]; vis[x][y]=true; while(q.length){ const [cx,cy]=q.shift(); cl.push({x:cx,y:cy}); [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]].forEach(([nx,ny])=>{ if(nx>=0&&nx<C.W&&ny>=0&&ny<C.H&&!vis[nx][ny]){ const nb=grid[nx][ny]; if(nb&&!nb.matched&&(nb.c===col||nb.type===C.TYPES.RAINBOW||b.type===C.TYPES.RAINBOW)){ vis[nx][ny]=true; q.push([nx,ny]); } } }); } if(cl.length>=3) clusters.push({blocks:cl,color:col}); } return clusters; }
function spawnParticles(x,y,c,count=12) { for(let i=0;i<count;i++) particles.push({x:(x+0.5)*C.CS,y:(y+0.5)*C.CS,vx:(Math.random()-0.5)*4,vy:-Math.random()*3-1,life:1,decay:0.015+Math.random()*0.01,c,size:2+Math.random()*3,rot:Math.random()*Math.PI,vr:(Math.random()-0.5)*0.2}); }
function clearMatches(clusters) { clusters.forEach(cl=>{ cl.blocks.forEach(p=>{ const b=grid[p.x][p.y]; if(b){ spawnParticles(p.x,p.y,b.c); if(b.type===C.TYPES.BOMB) explode(p.x,p.y); else if(b.type===C.TYPES.RAINBOW) clearColor(b.c); else if(b.type===C.TYPES.LINE_H) clearRow(p.y); else if(b.type===C.TYPES.LINE_V) clearCol(p.x); grid[p.x][p.y]=null; } }); }); }
function explode(x,y){ for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++){ const nx=x+dx, ny=y+dy; if(nx>=0&&nx<C.W&&ny>=0&&ny<C.H&&grid[nx][ny]){ spawnParticles(nx,ny,grid[nx][ny].c,6); grid[nx][ny]=null; } } }
function clearColor(c){ for(let x=0;x<C.W;x++) for(let y=0;y<C.H;y++) if(grid[x][y]&&grid[x][y].c===c){ spawnParticles(x,y,c,6); grid[x][y]=null; } }
function clearRow(y){ for(let x=0;x<C.W;x++) if(grid[x][y]){ spawnParticles(x,y,grid[x][y].c,6); grid[x][y]=null; } }
function clearCol(x){ for(let y=0;y<C.H;y++) if(grid[x][y]){ spawnParticles(x,y,grid[x][y].c,6); grid[x][y]=null; } }
function updateGoals(clusters){ clusters.forEach(cl=>{ cl.blocks.forEach(p=>{ const b=grid[p.x][p.y]; if(b&&goals[b.c]!==undefined){ goals[b.c]=Math.max(0,goals[b.c]-1); } }); }); }
function checkWin(){ return Object.values(goals).every(v=>v<=0); }
function addScore(base){ score += base * (chain||1); document.getElementById('score-value').textContent = score; }
function loop(ts) { if(!last) last=ts; const dt=Math.min((ts-last)/1000,0.1); last=ts; if(running&&state!==S.PAUSED) timer+=dt; update(dt); render(); requestAnimationFrame(loop); }
let last=0;
function update(dt) { if(state===S.SWAPPING){ swapAnim.t+=dt; const p=Math.min(swapAnim.t/0.15,1); const e=1-Math.pow(1-p,3); swapAnim.a.x=lerp(swapAnim.a.sx,swapAnim.a.tx,e); swapAnim.a.y=lerp(swapAnim.a.sy,swapAnim.a.ty,e); swapAnim.b.x=lerp(swapAnim.b.sx,swapAnim.b.tx,e); swapAnim.b.y=lerp(swapAnim.b.sy,swapAnim.b.ty,e); if(p>=1){ grid[swapAnim.a.tx][swapAnim.a.ty]=swapAnim.a; grid[swapAnim.b.tx][swapAnim.b.ty]=swapAnim.b; swapAnim.a.x=swapAnim.a.tx; swapAnim.a.y=swapAnim.a.ty; swapAnim.b.x=swapAnim.b.tx; swapAnim.b.y=swapAnim.b.ty; const m=findMatches(); if(m.length){ chain=1; state=S.DISSOLVING; beep(440,0.1); } else { beep(200,0.1,'square',0.05); state=S.SWAPPING; swapAnim={a:{...swapAnim.a,tx:swapAnim.a.sx,ty:swapAnim.a.sy,sx:swapAnim.a.tx,sy:swapAnim.a.ty,t:0},b:{...swapAnim.b,tx:swapAnim.b.sx,ty:swapAnim.b.sy,sx:swapAnim.b.tx,sy:swapAnim.b.ty,t:0},t:0}; setTimeout(()=>state=S.IDLE,150); } } }
 else if(state===S.PHYSICS){ if(!physicsTick()){ const m=findMatches(); if(m.length){ chain++; state=S.DISSOLVING; beep(440+chain*50,0.1); } else { chain=0; state=S.IDLE; fillTop(); } } }
 else if(state===S.DISSOLVING){ const m=findMatches(); if(m.length){ addScore(m.reduce((s,c)=>s+c.blocks.length*10,0)); updateGoals(m); clearMatches(m); state=S.PHYSICS; } else { state=S.PHYSICS; } }
 else if(state===S.IDLE){ if(checkWin()){ state=S.GAMEOVER; running=false; showOverlay('LEVEL COMPLETE!'); } }
 particles.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.1; p.life-=p.decay; p.rot+=p.vr; }); particles=particles.filter(p=>p.life>0);
 grid.forEach(col=>col.forEach(b=>{ if(b){ b.x=lerp(b.x,b.tx,0.2); b.y=lerp(b.y,b.ty,0.2); b.scale=lerp(b.scale,1,0.2); b.alpha=lerp(b.alpha,1,0.1); } }));
 const mulEl=document.getElementById('multiplier'); if(chain>1){ mulEl.textContent='×'+chain+' COMBO'; mulEl.classList.add('show'); } else mulEl.classList.remove('show');
 document.getElementById('timer-value').textContent=formatTime(timer);
 renderGoals();
 }
function lerp(a,b,t){ return a+(b-a)*t; }
function formatTime(t){ const m=Math.floor(t/60), s=Math.floor(t%60), ms=Math.floor((t%1)*100); return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`; }
function renderGoals(){ const el=document.getElementById('goals'); el.innerHTML=''; goalColors.forEach(c=>{ const g=goals[c]; const d=document.createElement('div'); d.className='goal'+(g<=0?' met':''); d.innerHTML=`<div class="goal-color" style="background:${C.COLORS[c]}"></div><span class="goal-count">${g}</span>`; el.appendChild(d); }); }
function render() { ctx.clearRect(0,0,W,H); ctx.save(); ctx.translate((W-C.W*C.CS*scale)/2,(H-C.H*C.CS*scale)/2); ctx.scale(scale,scale);
 ctx.fillStyle='rgba(0,0,0,0.2)'; ctx.fillRect(0,0,C.W*C.CS,C.H*C.CS);
 grid.forEach(col=>col.forEach(b=>{ if(b&&!b.matched){ drawBlock(b); } }));
 if(swapAnim){ drawBlock(swapAnim.a); drawBlock(swapAnim.b); }
 ctx.restore();
 particles.forEach(p=>{ ctx.save(); ctx.globalAlpha=p.life; ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle=p.c; ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size); ctx.restore(); });
 }
function drawBlock(b){ const x=b.x*C.CS, y=(C.H-1-b.y)*C.CS, s=C.CS*b.scale; ctx.save(); ctx.translate(x+C.CS/2,y+C.CS/2); ctx.scale(b.scale,b.scale); ctx.translate(-C.CS/2,-C.CS/2); ctx.globalAlpha=b.alpha; const pat=ctx.createPattern(getNoise(C.COLORS[b.c]),'repeat'); ctx.fillStyle=pat; roundRect(ctx,0,0,C.CS,C.CS,6); ctx.fill(); ctx.restore(); }
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); }
function getCell(px,py){ const rx=(W-C.W*C.CS*scale)/2, ry=(H-C.H*C.CS*scale)/2; const x=Math.floor((px-rx)/(C.CS*scale)), y=C.H-1-Math.floor((py-ry)/(C.CS*scale)); if(x>=0&&x<C.W&&y>=0&&y<C.H) return {x,y}; return null; }
function handleDown(e){ if(state!==S.IDLE) return; const p=e.touches?e.touches[0]:e; const cell=getCell(p.clientX,p.clientY); if(!cell) return; const b=grid[cell.x][cell.y]; if(!b) return; if(selected){ if(selected.x===cell.x&&selected.y===cell.y){ selected=null; return; } if(Math.abs(selected.x-cell.x)+Math.abs(selected.y-cell.y)===1){ const b2=grid[cell.x][cell.y]; if(b2){ swapAnim={a:{...selected,sx:selected.x,sy:selected.y,tx:cell.x,ty:cell.y,x:selected.x,y:selected.y,t:0},b:{...b2,sx:cell.x,sy:cell.y,tx:selected.x,ty:selected.y,x:cell.x,y:cell.y,t:0},t:0}; grid[selected.x][selected.y]=null; grid[cell.x][cell.y]=null; state=S.SWAPPING; beep(330,0.05); } selected=null; } else { selected={x:cell.x,y:cell.y}; } } else { selected={x:cell.x,y:cell.y}; } }
function showOverlay(title){ document.getElementById('overlay-title').textContent=title; document.getElementById('o-score').textContent=score; highScore=Math.max(highScore,score); localStorage.setItem('sandfall_hs',highScore); document.getElementById('o-best').textContent=highScore; document.getElementById('o-time').textContent=formatTime(timer); document.getElementById('overlay').classList.add('show'); }
function hideOverlay(){ document.getElementById('overlay').classList.remove('show'); }
function restart(){ state=S.LOADING; score=0; timer=0; chain=0; running=true; particles=[]; selected=null; swapAnim=null; document.getElementById('score-value').textContent=0; initGrid(); state=S.IDLE; hideOverlay(); }
canvas.addEventListener('mousedown',handleDown); canvas.addEventListener('touchstart',handleDown,{passive:true});
document.getElementById('btn-pause').onclick=()=>{ if(state===S.PAUSED){ state=S.IDLE; hideOverlay(); } else { state=S.PAUSED; showOverlay('PAUSED'); } };
document.getElementById('btn-restart').onclick=restart;
document.getElementById('btn-resume').onclick=()=>{ state=S.IDLE; hideOverlay(); };
document.getElementById('btn-menu-restart').onclick=restart;
window.addEventListener('resize',resize);
highScore=parseInt(localStorage.getItem('sandfall_hs')||'0');
resize();
initGrid();
state=S.IDLE;
requestAnimationFrame(loop);