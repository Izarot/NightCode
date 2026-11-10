const CVS_W = 800, CVS_H = 600;
const GRAV = 0.5;
const COLORS = {
  bg: '#0f0f1a', stone: '#2d2d44', stoneDark: '#1a1a2e',
  water: '#00ffff', waterDark: '#0088cc', waterLight: '#88ffff',
  fire: '#ff6600', fireCore: '#ffcc00', fireDark: '#cc3300',
  steam: '#ffffff', steamDim: '#aaaaaa',
  ice: '#88ddff', iceDark: '#44aacc',
  lava: '#ff3300', lavaGlow: '#ffaa00',
  gold: '#ffd700', green: '#00ff88', red: '#ff3333', white: '#ffffff'
};
const TILE = 32;
const LEVEL_W = 25, LEVEL_H = 18;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CVS_W; canvas.height = CVS_H;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, type, dur, vol=0.1, start=0){ if(!audioCtx) return; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=vol; g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+dur); o.connect(g); g.connect(audioCtx.destination); o.start(audioCtx.currentTime+start); o.stop(audioCtx.currentTime+dur+start); }
function sfxJump(){ beep(440, 'square', 0.1); }
function sfxDash(){ beep(220, 'sawtooth', 0.15, 0.05); }
function sfxSteam(){ beep(800, 'sine', 0.3, 0.03); }
function sfxCollect(){ beep(660, 'triangle', 0.1); }
function sfxWin(){ [660,880,1320].forEach((f,i)=>beep(f,'sine',0.2,0.1,i*0.15)); }

const input = { keys: {}, down(k){ this.keys[k]=true; }, up(k){ this.keys[k]=false; } };
window.addEventListener('keydown', e=>{ input.down(e.code); if(['Space','Enter','ShiftLeft','ShiftRight'].includes(e.code)) e.preventDefault(); });
window.addEventListener('keyup', e=>input.up(e.code));

class Vec { constructor(x=0,y=0){ this.x=x; this.y=y; } add(v){ this.x+=v.x; this.y+=v.y; return this; } scale(s){ this.x*=s; this.y*=s; return this; } copy(){ return new Vec(this.x,this.y); } }

class Entity { constructor(x,y,w,h,col){ this.pos=new Vec(x,y); this.vel=new Vec(); this.w=w; this.h=h; this.col=col; this.grounded=false; this.active=true; }
  get left(){ return this.pos.x; } get right(){ return this.pos.x+this.w; } get top(){ return this.pos.y; } get bottom(){ return this.pos.y+this.h; }
  update(dt){ this.vel.y+=GRAV*dt; this.pos.add(this.vel.copy().scale(dt)); }
  draw(){ ctx.fillStyle=this.col; ctx.fillRect(this.pos.x,this.pos.y,this.w,this.h); }
}

class Particle { constructor(x,y,vx,vy,life,col,size,type='rect'){ this.pos=new Vec(x,y); this.vel=new Vec(vx,vy); this.life=life; this.maxLife=life; this.col=col; this.size=size; this.type=type; }
  update(dt){ this.vel.y+=GRAV*0.2*dt; this.pos.add(this.vel.copy().scale(dt)); this.life-=dt; }
  draw(){ const a=this.life/this.maxLife; ctx.globalAlpha=a; ctx.fillStyle=this.col; if(this.type=='circle'){ ctx.beginPath(); ctx.arc(this.pos.x,this.pos.y,this.size,0,Math.PI*2); ctx.fill(); }else{ ctx.fillRect(this.pos.x,this.pos.y,this.size,this.size); } ctx.globalAlpha=1; }
}

class Player extends Entity {
  constructor(x,y,isAqua){ super(x,y,24,36, isAqua?COLORS.water:COLORS.fire); this.isAqua=isAqua; this.speed=3; this.jumpPower=11; this.dashCd=0; this.dashDur=0; this.reservoir=isAqua?100:50; this.maxRes=isAqua?100:100; this.trail=[]; this.stun=0; }
  handleInput(dt){ if(this.stun>0){ this.stun-=dt; return; }
    let move=0;
    if(this.isAqua){ if(input.keys['KeyA']) move=-1; if(input.keys['KeyD']) move=1; }
    else{ if(input.keys['ArrowLeft']) move=-1; if(input.keys['ArrowRight']) move=1; }
    this.vel.x = move * this.speed * 60;
    const jumpKey = this.isAqua ? 'KeyW' : 'ArrowUp';
    if(input.keys[jumpKey] && this.grounded){ this.vel.y=-this.jumpPower*60; this.grounded=false; sfxJump(); }
    const dashKey = this.isAqua ? 'Space' : 'Enter';
    if(input.keys[dashKey] && this.dashCd<=0 && this.reservoir>10){ this.dashCd=3; this.dashDur=0.2; this.reservoir-=15; sfxDash(); const dir = this.vel.x>0?1:(this.vel.x<0?-1:(this.isAqua?1:1)); this.vel.x = dir*25*60; this.vel.y = -5*60; }
    if(this.dashCd>0) this.dashCd-=dt;
    if(this.dashDur>0){ this.dashDur-=dt; this.spawnTrail(); }
  }
  spawnTrail(){ for(let i=0;i<2;i++){ if(this.isAqua) particles.push(new Particle(this.pos.x+Math.random()*this.w, this.pos.y+this.h, (Math.random()-0.5)*2, Math.random()*2, 0.5, COLORS.waterLight, 3, 'circle')); else particles.push(new Particle(this.pos.x+Math.random()*this.w, this.pos.y+this.h, (Math.random()-0.5)*2, -Math.random()*2, 0.4, COLORS.fireCore, 4, 'circle')); }
  }
  update(dt, level){ this.handleInput(dt); super.update(dt); this.collideLevel(level); this.clampReservoir(); }
  clampReservoir(){ this.reservoir=Math.max(0,Math.min(this.maxRes,this.reservoir)); if(!this.isAqua){ if(this.reservoir>80) this.stun=0.1; } }
  collideLevel(level){ this.grounded=false; const nextX=this.pos.x+this.vel.x/60; const nextY=this.pos.y+this.vel.y/60;
    for(let ty=0;ty<LEVEL_H;ty++) for(let tx=0;tx<LEVEL_W;tx++){
      const t=level[ty][tx]; if(!t.solid) continue;
      const tx1=tx*TILE, ty1=ty*TILE, tx2=tx1+TILE, ty2=ty1+TILE;
      if(this.right>tx1 && this.left<tx2 && nextY+this.h>ty1 && this.top<ty2 && this.vel.y>0){ this.pos.y=ty1-this.h; this.vel.y=0; this.grounded=true; }
      if(this.right>tx1 && this.left<tx2 && nextY<ty2 && this.bottom>ty1 && this.vel.y<0){ this.pos.y=ty2; this.vel.y=0; }
      if(this.bottom>ty1 && this.top<ty2 && nextX+this.w>tx1 && this.left<tx2 && this.vel.x>0){ this.pos.x=tx1-this.w; this.vel.x=0; }
      if(this.bottom>ty1 && this.top<ty2 && nextX<tx2 && this.right>tx1 && this.vel.x<0){ this.pos.x=tx2; this.vel.x=0; }
    }
  }
  draw(){ ctx.save(); ctx.translate(this.pos.x+this.w/2, this.pos.y+this.h/2);
    if(this.isAqua){ ctx.fillStyle=COLORS.water; ctx.beginPath(); ctx.ellipse(0,0,12,18,0,0,Math.PI*2); ctx.fill(); ctx.fillStyle=COLORS.waterLight; ctx.beginPath(); ctx.ellipse(-3,-5,4,6,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(3,-5,4,6,0,0,Math.PI*2); ctx.fill(); }
    else{ ctx.fillStyle=COLORS.fireDark; ctx.beginPath(); ctx.ellipse(0,0,14,20,0,0,Math.PI*2); ctx.fill(); const g=ctx.createRadialGradient(0,0,0,0,0,14); g.addColorStop(0,COLORS.fireCore); g.addColorStop(0.5,COLORS.fire); g.addColorStop(1,COLORS.fireDark); ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(0,-2,10,16,0,0,Math.PI*2); ctx.fill(); }
    ctx.restore();
  }
}

let particles=[];
function updateParticles(dt){ for(let i=particles.length-1;i>=0;i--){ particles[i].update(dt); if(particles[i].life<=0) particles.splice(i,1); } }
function drawParticles(){ particles.forEach(p=>p.draw()); }

let level=[];
function initLevel(){ level=[]; for(let y=0;y<LEVEL_H;y++){ level[y]=[]; for(let x=0;x<LEVEL_W;x++){ let solid=false, type='stone', temp=20;
      if(y===LEVEL_H-1 || x===0 || x===LEVEL_W-1) solid=true;
      if(y===12 && x>2 && x<22) { solid=true; type='ice'; temp=-10; }
      if(y===6 && x===12) { solid=true; type='lava'; temp=500; }
      if(y===3 && x>5 && x<19) { solid=true; type='gate'; temp=20; }
      level[y][x]={solid,type,temp,wet:0,hot:0};
    } }
}

let aqua, ignis;
function initPlayers(){ aqua=new Player(50, CVS_H-100, true); ignis=new Player(CVS_W-100, CVS_H-100, false); }

let timer=0, running=false, synergy=0, objectives={1:false,2:false,3:false,4:false};
let bestTime = parseFloat(localStorage.getItem('ashvapor_best')) || 0;

function updateSynergy(){ const dx=aqua.pos.x-ignis.pos.x, dy=aqua.pos.y-ignis.pos.y; const dist=Math.hypot(dx,dy); if(dist<80) synergy=Math.min(100, synergy+0.5); else synergy=Math.max(0, synergy-0.2); }

function checkInteractions(){
  // Aqua wets tiles below
  const aTx=Math.floor(aqua.pos.x/TILE), aTy=Math.floor((aqua.pos.y+aqua.h)/TILE);
  if(level[aTy] && level[aTy][aTx]) level[aTy][aTx].wet=Math.min(100, level[aTy][aTx].wet+5);
  // Ignis heats tiles below
  const iTx=Math.floor(ignis.pos.x/TILE), iTy=Math.floor((ignis.pos.y+ignis.h)/TILE);
  if(level[iTy] && level[iTy][iTx]) level[iTy][iTx].hot=Math.min(100, level[iTy][iTx].hot+5);

  // Steam generation: wet + hot
  for(let y=0;y<LEVEL_H;y++) for(let x=0;x<LEVEL_W;x++){
    const t=level[y][x]; if(t.wet>30 && t.hot>30 && t.type!='lava'){
      t.wet=Math.max(0,t.wet-2); t.hot=Math.max(0,t.hot-1);
      for(let i=0;i<3;i++) particles.push(new Particle(x*TILE+Math.random()*TILE, y*TILE, (Math.random()-0.5)*10, -Math.random()*50-20, 1.5, COLORS.steam, 4, 'circle'));
      if(Math.random()<0.05) sfxSteam();
      // Steam lift force
      if(aqua.pos.x>x*TILE && aqua.pos.x<(x+1)*TILE && aqua.pos.y>y*TILE && aqua.pos.y<(y+2)*TILE) aqua.vel.y=-200;
      if(ignis.pos.x>x*TILE && ignis.pos.x<(x+1)*TILE && ignis.pos.y>y*TILE && ignis.pos.y<(y+2)*TILE) ignis.vel.y=-200;
    }
    // Ice melting
    if(t.type==='ice' && t.hot>50){ t.hot=Math.max(0,t.hot-2); t.temp+=1; if(t.temp>0){ t.type='water'; t.solid=false; if(!objectives[1]){ objectives[1]=true; sfxCollect(); } } }
    // Gate unlocking: needs cold (wet) on left, hot on right (simplified)
    if(t.type==='gate'){
      const leftCold = level[y][x-1]?.wet>50;
      const rightHot = level[y][x+1]?.hot>50;
      if(leftCold && rightHot){ t.solid=false; t.type='open'; if(!objectives[3]){ objectives[3]=true; sfxCollect(); } }
    }
  }
  // Water collection
  if(level[aTy] && level[aTy][aTx] && level[aTy][aTx].type==='water'){ aqua.reservoir=Math.min(aqua.maxRes, aqua.reservoir+2); level[aTy][aTx].wet=Math.max(0, level[aTy][aTx].wet-1); }
  // Exit check
  if(aqua.pos.y<100 && ignis.pos.y<100 && !objectives[4]){ objectives[4]=true; win(); }
}

function win(){ running=false; sfxWin(); if(bestTime===0 || timer<bestTime){ bestTime=timer; localStorage.setItem('ashvapor_best', bestTime); } showMsg(`CLEARED! Time: ${formatTime(timer)}${timer<=bestTime?' NEW RECORD!':''}`, 'Replay'); }

function formatTime(t){ const m=Math.floor(t/60); const s=(t%60).toFixed(2).padStart(5,'0'); return `${m}:${s}`; }
function updateHUD(){ document.getElementById('timer').textContent=formatTime(timer); document.getElementById('highscore').textContent=`Best: ${bestTime?formatTime(bestTime):'--:--.--'}`;
  document.getElementById('aqua-water-bar').style.width=`${aqua.reservoir}%`; document.getElementById('aqua-water-txt').textContent=`${Math.round(aqua.reservoir)}%`;
  document.getElementById('aqua-chill-bar').style.width=`${Math.min(100, aqua.reservoir)}%`; document.getElementById('aqua-chill-txt').textContent=`${Math.round(Math.min(100, aqua.reservoir))}%`;
  document.getElementById('ignis-heat-bar').style.width=`${ignis.reservoir}%`; document.getElementById('ignis-heat-txt').textContent=`${Math.round(ignis.reservoir)}%`;
  document.getElementById('ignis-over-bar').style.width=`${Math.min(100, Math.max(0, ignis.reservoir-50)*2)}%`; document.getElementById('ignis-over-txt').textContent=`${Math.round(Math.min(100, Math.max(0, ignis.reservoir-50)*2))}%`;
  document.getElementById('synergy-fill').style.width=`${synergy}%`;
  Object.keys(objectives).forEach(k=>{ const el=document.getElementById('obj'+k); if(el) el.classList.toggle('done', objectives[k]); });
}

function drawLevel(){ for(let y=0;y<LEVEL_H;y++) for(let x=0;x<LEVEL_W;x++){
  const t=level[y][x]; if(!t.solid && t.type!='water' && t.type!='lava') continue;
  const px=x*TILE, py=y*TILE;
  if(t.type==='stone'){ ctx.fillStyle=COLORS.stone; ctx.fillRect(px,py,TILE,TILE); ctx.fillStyle=COLORS.stoneDark; ctx.fillRect(px,py,1,TILE); ctx.fillRect(px,py,TILE,1); }
  else if(t.type==='ice'){ const g=ctx.createLinearGradient(px,py,px+TILE,py+TILE); g.addColorStop(0,COLORS.ice); g.addColorStop(1,COLORS.iceDark); ctx.fillStyle=g; ctx.fillRect(px,py,TILE,TILE); ctx.strokeStyle=COLORS.white; ctx.lineWidth=1; ctx.strokeRect(px+1,py+1,TILE-2,TILE-2); }
  else if(t.type==='lava'){ ctx.fillStyle=COLORS.lava; ctx.fillRect(px,py,TILE,TILE); for(let i=0;i<3;i++){ ctx.fillStyle=COLORS.lavaGlow; ctx.globalAlpha=0.3; ctx.fillRect(px+Math.random()*TILE, py+Math.random()*TILE, 4,4); ctx.globalAlpha=1; } }
  else if(t.type==='gate'){ ctx.fillStyle=COLORS.stoneDark; ctx.fillRect(px,py,TILE,TILE); ctx.strokeStyle=objectives[3]?COLORS.green:COLORS.gold; ctx.lineWidth=3; ctx.strokeRect(px+2,py+2,TILE-4,TILE-4); }
  else if(t.type==='water'){ ctx.fillStyle=COLORS.waterDark; ctx.globalAlpha=0.6; ctx.fillRect(px,py+TILE*0.3,TILE,TILE*0.7); ctx.globalAlpha=1; }
 }}

function loop(ts){ if(!last) last=ts; const dt=Math.min(0.05, (ts-last)/1000); last=ts;
  if(running){ timer+=dt; aqua.update(dt, level); ignis.update(dt, level); checkInteractions(); updateSynergy(); updateParticles(dt); }
  draw(); updateHUD(); requestAnimationFrame(loop); }
let last=0;
function draw(){ ctx.fillStyle=COLORS.bg; ctx.fillRect(0,0,CVS_W,CVS_H);
  // Parallax bg
  ctx.fillStyle=COLORS.stoneDark; for(let i=0;i<20;i++){ ctx.fillRect((i*50-timer*10)%CVS_W, (i*30)%CVS_H, 2,2); }
  drawLevel(); drawParticles(); aqua.draw(); ignis.draw();
  // Steam visual near players
  if(synergy>50){ ctx.strokeStyle=COLORS.steam; ctx.lineWidth=2; ctx.globalAlpha=0.3; ctx.beginPath(); ctx.moveTo(aqua.pos.x+aqua.w/2, aqua.pos.y); ctx.lineTo(ignis.pos.x+ignis.w/2, ignis.pos.y); ctx.stroke(); ctx.globalAlpha=1; }
}

function showMsg(text, btnText='Start'){ document.getElementById('msg-text').innerHTML=text; document.getElementById('start-btn').textContent=btnText; document.getElementById('msg-box').style.display='block'; }
function hideMsg(){ document.getElementById('msg-box').style.display='none'; }

document.getElementById('start-btn').onclick=()=>{ if(audioCtx.state==='suspended') audioCtx.resume(); hideMsg(); if(!running){ initLevel(); initPlayers(); timer=0; synergy=0; objectives={1:false,2:false,3:false,4:false}; particles=[]; running=true; } };

showMsg('ASH & VAPOR<br><small>WASD/Space + Arrows/Enter</small><br>Cooperate: Water + Fire = Steam');
requestAnimationFrame(loop);