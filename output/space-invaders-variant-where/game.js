/* Splinter Command — pure HTML5 Canvas */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 0, H = 0;
function resize() {
  const r = canvas.getBoundingClientRect();
  W = canvas.width = Math.floor(r.width * devicePixelRatio);
  H = canvas.height = Math.floor(r.height * devicePixelRatio);
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0,0);
  W /= devicePixelRatio; H /= devicePixelRatio;
}
window.addEventListener('resize', resize);
resize();

/* ---- Audio (Web Audio API synth) ---- */
let actx = null;
function audio() { if(!actx){ actx = new (window.AudioContext||window.webkitAudioContext)(); } return actx; }
function beep(freq, dur, type='square', vol=.15) {
  try { const a=audio(), o=a.createOddBufferSource?null:null, g=a.createGain();
    const t=a.currentTime; const s=a.createOscillator(); s.type=type; s.frequency.value=freq; g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtAtTime(.001,t+dur); s.connect(g).connect(a.destination); s.start(t); s.stop(t+dur); }
  catch(e){}
}
function sfxShoot(){ beep(880,.08,'square',.08); }
function sfxHit(){ beep(220,.12,'sawtooth',.12); }
function sfxSplit(){ beep(440,.06,'triangle',.1); setTimeout(()=>beep(660,.06,'triangle',.1),40); }
function sfxExplode(){ beep(110,.3,'sawtooth',.18); }
function sfxHurt(){ beep(160,.2,'sawtooth',.2); }

/* ---- Input ---- */
const keys = {};
window.addEventListener('keydown', e=>{ keys[e.code]=true; if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault(); });
window.addEventListener('keyup', e=>{ keys[e.code]=false; });
let mouseDown = false;
canvas.addEventListener('mousedown', ()=>{ mouseDown=true; audio(); });
canvas.addEventListener('mouseup', ()=>{ mouseDown=false; });
canvas.addEventListener('touchstart', e=>{ e.preventDefault(); mouseDown=true; audio(); }, {passive:false});
canvas.addEventListener('touchend', ()=>{ mouseDown=false; });

/* ---- State ---- */
let player, bullets=[], enemies=[], particles=[], stars=[];
let score=0, wave=1, threatCount=0, hp=100, gameOver=false, paused=false, startTime=0, elapsed=0;
let bestScore = parseInt(localStorage.getItem('sc_best')||'0',10);
document.getElementById('best-score').textContent = 'BEST: ' + bestScore;

/* ---- Entities ---- */
class Entity {
  constructor(x,y,vx,vy,r,tier){ this.x=x; this.y=y; this.vx=vx; this.vy=vy; this.r=r; this.tier=tier; this.hp=tier===1?1:(tier===2?2:1); this.alive=true; this.flash=0; this.scale=1; this.dropTimer=0; }
  update(dt){ this.x+=this.vx*dt; this.y+=this.vy*dt; if(this.flash>0)this.flash-=dt; }
}
class Player extends Entity {
  constructor(){ super(W/2,H-60,0,0,14,0); this.accel=0.8; this.friction=0.92; this.maxSpeed=6; this.fireCD=0; this.shake=0; }
  update(dt){ let ax=0,ay=0; if(keys['ArrowLeft']||keys['KeyA'])ax=-1; if(keys['ArrowRight']||keys['KeyD'])ax=1; if(keys['ArrowUp']||keys['KeyW'])ay=-1; if(keys['ArrowDown']||keys['KeyS'])ay=1; if(ax||ay){ const len=Math.hypot(ax,ay)||1; ax/=len; ay/=len; this.vx+=ax*this.accel*dt; this.vy+=ay*this.accel*dt; } this.vx*=this.friction; this.vy*=this.friction; const sp=Math.hypot(this.vx,this.vy); if(sp>this.maxSpeed){ this.vx=this.vx/sp*this.maxSpeed; this.vy=this.vy/sp*this.maxSpeed; } this.x+=this.vx*dt; this.y+=this.vy*dt;
    if(this.x<this.r){this.x=this.r;this.vx=0;} if(this.x>W-this.r){this.x=W-this.r;this.vx=0;} if(this.y<this.r){this.y=this.r;this.vy=0;} if(this.y>H-this.r){this.y=H-this.r;this.vy=0;} if(this.shake>0)this.shake-=dt;
    if(this.fireCD>0)this.fireCD-=dt; if((keys['Space']||mouseDown)&&this.fireCD<=0){ this.shoot(); this.fireCD=0.18; this.shake=2; }
  }
  shoot(){ bullets.push({x:this.x, y:this.y-this.r, vx:-3, vy:-3, r:3, life:1.5}); sfxShoot(); }
  draw(){ ctx.save(); ctx.translate(this.x+(Math.random()-.5)*this.shake, this.y+(Math.random()-.5)*this.shake); ctx.strokeStyle='#0ff'; ctx.lineWidth=2; ctx.shadowColor='#0ff'; ctx.shadowBlur=12; ctx.beginPath(); ctx.moveTo(0,-this.r); ctx.lineTo(this.r*.7,this.r*.7); ctx.lineTo(0,this.r*.3); ctx.lineTo(-this.r*.7,this.r*.7); ctx.closePath(); ctx.stroke(); ctx.fillStyle='#0ff'; ctx.beginPath(); ctx.arc(0,0,3,0,7); ctx.fill(); ctx.restore(); }
}
class Enemy extends Entity {
  constructor(x,y,vx,vy,tier){ super(x,y,vx,vy,tier===1?34:(tier===2?22:12),tier); }
  update(dt){ super.update(dt); if(this.y<this.r){ this.y=this.r; this.vy=Math.abs(this.vy)*0.8; this.x+=Math.sign(this.x-W/2)*30; } if(this.x<this.r){this.x=this.r;this.vx=Math.abs(this.vx);} if(this.x>W-this.r){this.x=W-this.r;this.vx=-Math.abs(this.vx);} }
  draw(){ const c=this.tier===1?'#c060ff':(this.tier===2?'#ff40cc':'#ff80f0'); ctx.save(); ctx.translate(this.x,this.y); ctx.strokeStyle=c; ctx.lineWidth=this.tier===1?2:1.5; ctx.shadowColor=c; ctx.shadowBlur=10; ctx.globalAlpha=this.flash>0?.3:1; ctx.beginPath(); if(this.tier===1){ctx.rect(-this.r,-this.r,this.r*2,this.r*2);} else if(this.tier===2){ctx.moveTo(0,-this.r);ctx.lineTo(this.r,0);ctx.lineTo(0,this.r);ctx.lineTo(-this.r,0);ctx.closePath();} else {ctx.moveTo(0,-this.r);ctx.lineTo(this.r*.6,0);ctx.lineTo(0,this.r);ctx.lineTo(-.6*this.r,0);ctx.closePath();} ctx.stroke(); ctx.fillStyle=c; ctx.globalAlpha=this.flash>0?.3:1; ctx.beginPath(); ctx.arc(0,0,this.r*.3,0,7); ctx.fill(); ctx.restore(); }
}
class Particle {
  constructor(x,y,vx,vy,life,color,grav=0.15){ this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.life=life;this.maxLife=life;this.color=color;this.grav=grav; }
  update(dt){ this.x+=this.vx*dt; this.y+=this.vy*dt; this.vy+=this.grav*dt; this.life-=dt; }
  draw(){ const a=Math.max(0,this.life/this.maxLife); ctx.globalAlpha=a; ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,2,0,7); ctx.fill(); ctx.globalAlpha=1; }
}

/* ---- Helpers ---- */
function spawnEnemy(tier){ const x=40+Math.random()*(W-80); const y=40+Math.random()*(H/2); const sp=(tier===3?2.2:tier===2?1.4:0.6)*(Math.random()*.5+.5); const ang=Math.atan2(player.y-y, player.x-x)+Math.PI/2; const vx=Math.cos(ang)*sp, vy=Math.sin(ang)*sp; enemies.push(new Enemy(x,y,vx,vy,tier)); }
function explode(x,y,tier){ const n=tier===3?14:tier===2?10:6; for(let i=0;i<n;i++){ const a=Math.random()*7; const sp=1+Math.random()*3; particles.push(new Particle(x,y,Math.cos(a)*sp,Math.sin(a)*sp,0.4+Math.random()*.4,'#ff40cc',0.15)); } sfxExplode(); }
function splitEnemy(e){ const baseVx=e.vx*0.5, baseVy=e.vy*0.5; const children=[]; const count=e.tier===1?2:(e.tier===2?6:0); if(count===0) return; for(let i=0;i<count;i++){ const a=(i/count)*Math.PI*2; const sp=1.2; children.push(new Enemy(e.x,e.y,baseVx+Math.cos(a)*sp,baseVy+Math.sin(a)*sp,e.tier+1)); } enemies.push(...children); sfxSplit(); }

/* ---- Wave system ---- */
let waveEnemiesLeft=0, waveSpawnTimer=0;
function startWave(w){ wave=w; waveEnemiesLeft=5+w*2; waveSpawnTimer=0; }
function spawnFromWave(){ if(waveEnemiesLeft<=0)return; waveSpawnTimer-=1; if(waveSpawnTimer<=0){ waveSpawnTimer=0.8; const tier=Math.min(3,1+Math.floor(w/2)); spawnEnemy(tier); waveEnemiesLeft--; threatCount++; } }

/* ---- Background ---- */
function initStars(){ stars=[]; for(let i=0;i<80;i++)stars.push({x:Math.random()*W,y:Math.random()*H,z:Math.random()*0.8+0.2,s:Math.random()*1.5+0.5}); }
function drawBG(){ ctx.fillStyle='#05060f'; ctx.fillRect(0,0,W,H); for(const s of stars){ ctx.globalAlpha=s.z; ctx.fillStyle='#fff'; ctx.fillRect(s.x,s.y,s.s,s.s); } ctx.globalAlpha=1; const g=ctx.createLinearGradient(0,H,0,H-60); g.addColorStop(0,'rgba(120,0,255,0)'); g.addColorStop(1,'rgba(120,0,250,.25)'); ctx.fillStyle=g; ctx.fillRect(0,H-60,W,60); ctx.strokeStyle='rgba(0,255,255,.08)'; ctx.lineWidth=1; for(let x=0;x<W;x+=40){ ctx.beginPath(); ctx.moveTo(x,H-60); ctx.lineTo(x,H); ctx.stroke(); } }

/* ---- Game loop ---- */
let last=performance.now();
function loop(now){
  requestAnimationFrame(loop);
  if(paused||gameOver){ drawBG(); updateHUD(); return; }
  const dt=Math.min(2,(now-last)/16.67); last=now;
  elapsed=performance.now()-startTime;
  update(dt);
  render();
  updateHUD();
}
function update(dt){
  if(gameOver)return;
  player.update(dt);
  for(const b of bullets){ b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt; }
  bullets=bullets.filter(b=>b.life>0&&b.y>-10&&b.y<H+10&&b.x>-10&&b.x<W+10);
  for(const e of enemies){ e.update(dt); }
  for(const p of particles){ p.update(dt); }
  particles=particles.filter(p=>p.life>0);
  /* collisions: bullet vs enemy */
  for(const b of bullets){ for(const e of enemies){ if(!e.alive)continue; const dx=b.x-e.x, dy=b.y-e.y; if(dx*dx+dy*dy < (b.r+e.r)*(b.r+e.r)){ b.life=0; e.hp--; e.flash=0.1; if(e.hp<=0){ e.alive=false; score+=e.tier===1?100:(e.tier===2?250:500); explode(e.x,e.y,e.tier); if(e.tier<3) splitEnemy(e); } sfxHit(); break; } } }
  bullets=bullets.filter(b=>b.life>0);
  enemies=enemies.filter(e=>e.alive);
  /* player vs enemy */
  for(const e of enemies){ const dx=player.x-e.x, dy=player.y-e.y; if(dx*dx+dy*dy < (player.r+e.r)*(player.r+e.r)){ player.hp-=10; sfxHurt(); explode(player.x,player.y,0); player.x=W/2; player.y=H-60; if(player.hp<=0){ gameOver=true; if(score>bestScore){bestScore=score;localStorage.setItem('sc_best',bestScore);} } break; } }
  /* wave progression */
  spawnFromWave();
  if(waveEnemiesLeft<=0 && enemies.length===0 && particles.length===0){ wave++; startWave(wave); }
  threatCount=enemies.filter(e=>e.tier>=2).length;
}
function render(){ drawBG(); player.draw(); for(const e of enemies)e.draw(); for(const b of bullets)drawBullet(b); for(const p of particles)p.draw(); }
function drawBullet(b){ ctx.save(); ctx.fillStyle='#0ff'; ctx.shadowColor='#0ff'; ctx.shadowBlur=8; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,7); ctx.fill(); ctx.restore(); }

/* ---- HUD ---- */
function updateHUD(){ document.getElementById('score').textContent=score; document.getElementById('wave').textContent=wave; document.getElementById('threat').textContent=threatCount; const wf=((wave%5)/5)*100; document.getElementById('wave-fill').style.width=wf+'%'; document.getElementById('health-fill').style.width=Math.max(0,hp)+'%'; const m=Math.floor(elapsed/60000), s=Math.floor((elapsed%60000)/1000); document.getElementById('timer').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); }

/* ---- Controls ---- */
document.getElementById('start-btn').onclick=()=>{ document.getElementById('start-screen').classList.add('hidden'); audio(); resetGame(); };
document.getElementById('resume-btn').onclick=()=>{ paused=false; document.getElementById('pause-overlay').classList.add('hidden'); };
document.getElementById('restart-btn').onclick=()=>{ resetGame(); };
window.addEventListener('keydown',e=>{ if(e.code==='Escape'){ if(paused){paused=false;document.getElementById('pause-overlay').classList.add('hidden');} else {paused=true;document.getElementById('pause-overlay').classList.remove('hidden');} } });

/* ---- Reset ---- */
function resetGame(){ player=new Player(); bullets=[]; enemies=[]; particles=[]; score=0; wave=1; hp=100; gameOver=false; paused=false; startTime=performance.now(); initStars(); startWave(1); }
initStars(); resetGame(); requestAnimationFrame(loop);
