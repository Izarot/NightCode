const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// --- Config & Constants ---
const TILE = 16;
const GRAVITY = 0.5;
const MAX_SPEED = 6;
const ACCEL = 0.8;
const DECEL = 0.9;
const AIR_ACCEL = 0.4;
const JUMP_VEL = -12;
const WALL_JUMP_MULT = 1.2;
const DASH_SPEED = 10;
const DASH_COOLDOWN = 200;
const BP_MAX = 100;
const BP_REGEN = 5/60; // per frame
const BP_COST_BASE = 20;
const BP_COST_INC = 10;
const BRIDGE_DURATION = 5000;
const BRIDGE_FADE = 500;
const BRIDGE_MAX_SPAN = 8 * TILE;
const BRIDGE_MIN_SPAN = 2 * TILE;

// --- Audio ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
let soundEnabled = true;
function playTone(freq, dur, type='square', vol=0.1, start=0){ if(!soundEnabled) return; const o=audioCtx.createOscillator(), g=audioCtx.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=vol; o.connect(g); g.connect(audioCtx.destination); const t=audioCtx.currentTime+start; o.start(t); o.stop(t+dur); }
function sfxJump(){ playTone(440,0.1,'square',0.08); }
sfxBuild(){ playTone(523,0.1,'sine',0.08); playTone(440,0.1,'sine',0.08,0.1); playTone(349,0.1,'sine',0.08,0.2); }
sfxDash(){ playTone(600,0.05,'sawtooth',0.06); }
sfxHurt(){ playTone(150,0.1,'sawtooth',0.1); }
sfxCheckpoint(){ [523,659,784,1047,1318].forEach((f,i)=>playTone(f,0.1,'sine',0.08,i*0.1)); }
sfxBridgeFade(){ if(!soundEnabled) return; const b=audioCtx.createBuffer(1,audioCtx.sampleRate*0.3,audioCtx.sampleRate), d=b.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; const src=audioCtx.createBufferSource(), f=audioCtx.createBiquadFilter(); src.buffer=b; f.type='lowpass'; f.frequency.value=300; src.connect(f); f.connect(audioCtx.destination); src.start(); }

// --- Asset Generation (Procedural) ---
const sprites = {};
function genSprite(w,h,draw){ const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d'); x.imageSmoothingEnabled=false; draw(x); return c; }
sprites.player = {
  idle: genSprite(12,16,x=>{ x.fillStyle='#e94560'; x.fillRect(2,0,8,16); x.fillStyle='#fff'; x.fillRect(4,2,2,2); x.fillRect(8,2,2,2); }),
  walk: [
    genSprite(12,16,x=>{ x.fillStyle='#e94560'; x.fillRect(2,0,8,16); x.fillStyle='#fff'; x.fillRect(4,2,2,2); x.fillRect(8,2,2,2); x.fillStyle='#27ae60'; x.fillRect(2,14,3,2); x.fillRect(7,14,3,2); }),
    genSprite(12,16,x=>{ x.fillStyle='#e94560'; x.fillRect(2,0,8,16); x.fillStyle='#fff'; x.fillRect(4,2,2,2); x.fillRect(8,2,2,2); x.fillStyle='#27ae60'; x.fillRect(2,14,3,2); x.fillRect(7,14,3,2); })
  ],
  jump: genSprite(12,16,x=>{ x.fillStyle='#e94560'; x.fillRect(2,0,8,16); x.fillStyle='#fff'; x.fillRect(4,2,2,2); x.fillRect(8,2,2,2); x.fillStyle='#f39c12'; x.fillRect(2,14,8,2); })
};
sprites.slime = [
  genSprite(16,16,x=>{ x.fillStyle='#27ae60'; x.beginPath(); x.arc(8,12,8,0,Math.PI*2); x.fill(); x.fillStyle='#fff'; x.fillRect(4,8,3,3); x.fillRect(10,8,3,3); }),
  genSprite(16,16,x=>{ x.fillStyle='#27ae60'; x.beginPath(); x.arc(8,10,8,0,Math.PI*2); x.fill(); x.fillStyle='#fff'; x.fillRect(4,6,3,3); x.fillRect(10,6,3,3); })
];
sprites.bridge = genSprite(32,8,x=>{ x.fillStyle='#8b5e3c'; x.fillRect(0,0,32,8); x.fillStyle='#a06b3c'; for(let i=0;i<32;i+=4){ x.fillRect(i,2,2,4); } });
sprites.spike = genSprite(16,16,x=>{ x.fillStyle='#c0392b'; x.beginPath(); x.moveTo(8,0); x.lineTo(16,16); x.lineTo(0,16); x.closePath(); x.fill(); });
sprites.checkpoint = [
  genSprite(16,16,x=>{ x.fillStyle='#f1c40f'; x.beginPath(); x.arc(8,8,6,0,Math.PI*2); x.fill(); x.fillStyle='#fff'; x.font='10px sans-serif'; x.textAlign='center'; x.fillText('✦',8,12); }),
  genSprite(16,16,x=>{ x.fillStyle='#f39c12'; x.beginPath(); x.arc(8,8,7,0,Math.PI*2); x.fill(); x.fillStyle='#fff'; x.font='10px sans-serif'; x.textAlign='center'; x.fillText('✦',8,12); })
];
sprites.bgFar = genSprite(320,180,x=>{ x.fillStyle='#0f3460'; x.fillRect(0,0,320,180); x.fillStyle='#16213e'; for(let i=0;i<20;i++){ x.fillRect(Math.random()*320,Math.random()*180,2,2); } });
sprites.bgMid = genSprite(320,180,x=>{ x.fillStyle='transparent'; x.fillStyle='#1a1a2e'; for(let i=0;i<15;i++){ const w=20+Math.random()*40; x.fillRect(Math.random()*320,Math.random()*180,w,8); } });
sprites.bgNear = genSprite(320,180,x=>{ x.fillStyle='transparent'; x.fillStyle='#2c3e50'; for(let i=0;i<10;i++){ x.fillRect(Math.random()*320,Math.random()*180,30,16); } });

// --- Level Data ---
const levels = [
  {
    w: 80, h: 45,
    tiles: [], // 0 empty, 1 ground, 2 wall, 3 spike
    entities: []
  }
];
// Generate a simple level
function generateLevel(idx){
  const lvl = levels[idx];
  lvl.tiles = Array(lvl.w*lvl.h).fill(0);
  // ground floor
  for(let x=0;x<lvl.w;x++) lvl.tiles[x + (lvl.h-3)*lvl.w] = 1;
  // platforms
  const plats = [
    {x:10,y:30,w:5},{x:20,y:25,w:4},{x:30,y:20,w:6},{x:45,y:28,w:4},{x:55,y:22,w:5},{x:70,y:30,w:8}
  ];
  plats.forEach(p=>{ for(let i=0;i<p.w;i++) lvl.tiles[(p.x+i)+p.y*lvl.w]=1; });
  // spikes
  [25,40,60].forEach(x=> lvl.tiles[x+ (lvl.h-4)*lvl.w]=3);
  // checkpoints
  lvl.entities = [
    {type:'checkpoint',x:5*TILE,y: (lvl.h-4)*TILE},
    {type:'checkpoint',x:35*TILE,y:19*TILE},
    {type:'checkpoint',x:75*TILE,y:29*TILE}
  ];
  // slimes
  lvl.entities.push({type:'slime',x:15*TILE,y:(lvl.h-4)*TILE,dir:1,patrol:5*TILE});
  lvl.entities.push({type:'slime',x:50*TILE,y:21*TILE,dir:-1,patrol:4*TILE});
  return lvl;
}

// --- Game State ---
let state = 'menu'; // menu, playing, paused, gameover, complete
let currentLevel = 0;
let player = null;
let bridges = [];
let particles = [];
let camera = {x:0,y:0};
let keys = {};
let touch = {left:false,right:false,jump:false,build:false};
let lastTime = 0;
let gameTime = 0;
let highScore = parseFloat(localStorage.getItem('bridgeBuilderHighScore')) || 0;
let bp = BP_MAX;
let lastBuildTime = 0;
let dashCooldown = 0;
let lastDir = 1;
let invincible = 0;
let checkpoints = [];
let currentCheckpoint = null;

// --- Input ---
window.addEventListener('keydown',e=>{ keys[e.code]=true; if(e.code==='Escape') togglePause(); });
window.addEventListener('keyup',e=> keys[e.code]=false);
// Touch controls
const leftBtn = document.createElement('div'); leftBtn.className='touch-btn left'; leftBtn.textContent='←';
const rightBtn = document.createElement('div'); rightBtn.className='touch-btn right'; rightBtn.textContent='→';
const jumpBtn = document.createElement('div'); jumpBtn.className='touch-btn jump'; jumpBtn.textContent='↑';
[leftBtn,rightBtn,jumpBtn].forEach(b=>{ b.style.cssText='position:absolute;bottom:20px;width:60px;height:60px;background:rgba(44,62,80,.8);color:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;touch-action:none;z-index:10'; document.body.appendChild(b); });
leftBtn.style.left='20px'; rightBtn.style.left='90px'; jumpBtn.style.right='20px';
['touchstart','touchend'].forEach(ev=>{
  leftBtn.addEventListener(ev,e=>{e.preventDefault(); touch.left=ev==='touchstart';});
  rightBtn.addEventListener(ev,e=>{e.preventDefault(); touch.right=ev==='touchstart';});
  jumpBtn.addEventListener(ev,e=>{e.preventDefault(); touch.jump=ev==='touchstart';});
});
document.getElementById('build-btn').addEventListener('touchstart',e=>{e.preventDefault(); touch.build=true;});
document.getElementById('build-btn').addEventListener('touchend',e=>{e.preventDefault(); touch.build=false;});
window.addEventListener('keydown',e=>{ if(e.code==='KeyB') touch.build=true; });
window.addEventListener('keyup',e=>{ if(e.code==='KeyB') touch.build=false; });

// --- UI Buttons ---
document.querySelectorAll('[data-action]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const a=btn.dataset.action;
    if(a==='resume') togglePause();
    else if(a==='restart') startLevel(currentLevel);
    else if(a==='settings') showScreen('settings-menu');
    else if(a==='quit') showScreen('loading'); setTimeout(()=>location.reload(),100);
    else if(a==='back') showScreen('pause-menu');
    else if(a==='menu') showScreen('loading'); setTimeout(()=>location.reload(),100);
    else if(a==='next'){ currentLevel++; if(currentLevel>=levels.length) currentLevel=0; startLevel(currentLevel); }
  });
});
document.getElementById('sound-toggle').addEventListener('change',e=>{ soundEnabled=e.target.checked; localStorage.setItem('sound',soundEnabled); });
document.getElementById('subtitles-toggle').addEventListener('change',e=>{ localStorage.setItem('subtitles',e.target.checked); });
document.getElementById('difficulty').addEventListener('change',e=>{ localStorage.setItem('difficulty',e.target.value); });

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}
function togglePause(){ if(state==='playing'){ state='paused'; showScreen('pause-menu'); } else if(state==='paused'){ state='playing'; showScreen('loading'); setTimeout(()=>showScreen(''),0); } }

// --- Player Class ---
class Player{
  constructor(x,y){
    this.x=x; this.y=y; this.w=12; this.h=16;
    this.vx=0; this.vy=0;
    this.grounded=false; this.wallSlide=false; this.wallDir=0;
    this.health=3; this.maxHealth=3;
    this.animFrame=0; this.animTimer=0; this.facing=1;
    this.crouching=false;
  }
  getRect(){ return {x:this.x,y:this.y,w:this.w,h:this.crouching?this.h/2:this.h}; }
  update(dt,level){
    // Input
    let inputX = 0;
    if(keys['ArrowLeft']||keys['KeyA']||touch.left) inputX=-1;
    if(keys['ArrowRight']||keys['KeyD']||touch.right) inputX=1;
    const jumpPressed = keys['Space']||keys['KeyW']||keys['ArrowUp']||touch.jump;
    const buildPressed = touch.build;
    const dashPressed = keys['ShiftLeft']||keys['ShiftRight'];
    
    // Horizontal movement
    const accel = this.grounded ? ACCEL : AIR_ACCEL;
    if(inputX!==0){
      this.vx += inputX * accel;
      this.facing = inputX;
      lastDir = inputX;
    }else{
      this.vx *= this.grounded ? DECEL : 0.95;
    }
    this.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, this.vx));
    
    // Dash
    if(dashPressed && dashCooldown<=0 && Math.abs(this.vx)>0.5 && bp>=5){
      this.vx = lastDir * DASH_SPEED;
      dashCooldown = DASH_COOLDOWN;
      bp -= 5;
      sfxDash();
      for(let i=0;i<8;i++) particles.push(new Particle(this.x+this.w/2,this.y+this.h/2,'#e94560',Math.random()*6-3,Math.random()*6-3,0.3));
    }
    if(dashCooldown>0) dashCooldown-=dt;
    
    // Jump
    if(jumpPressed && (this.grounded || this.wallSlide)){
      if(this.wallSlide){
        this.vx = -this.wallDir * MAX_SPEED * WALL_JUMP_MULT;
        this.vy = JUMP_VEL * WALL_JUMP_MULT;
        this.wallSlide=false;
      }else{
        this.vy = JUMP_VEL;
      }
      this.grounded=false;
      sfxJump();
      for(let i=0;i<6;i++) particles.push(new Particle(this.x+this.w/2,this.y+this.h,'#fff',Math.random()*4-2,Math.random()*-3-1,0.4));
    }
    
    // Crouch
    this.crouching = keys['ShiftLeft']||keys['ShiftRight'];
    
    // Gravity
    this.vy += GRAVITY;
    this.vy = Math.min(this.vy, 15);
    
    // Move X
    this.x += this.vx;
    this.collideX(level);
    // Move Y
    this.y += this.vy;
    this.grounded=false;
    this.wallSlide=false;
    this.collideY(level);
    
    // Bridge building
    if(buildPressed && Date.now()-lastBuildTime>300) tryBuildBridge(this,level);
    
    // BP regen
    if(bp<BP_MAX && Date.now()-lastBuildTime>1000) bp = Math.min(BP_MAX, bp + BP_REGEN);
    
    // Invincibility
    if(invincible>0) invincible-=dt;
    
    // Animation
    if(this.grounded && Math.abs(this.vx)>0.5) this.animTimer+=dt;
    else this.animTimer=0;
    this.animFrame = Math.floor(this.animTimer/100)%2;
    
    // Camera follow
    camera.x = Math.max(0, Math.min(level.w*TILE - canvas.width, this.x - canvas.width/2));
    camera.y = Math.max(0, Math.min(level.h*TILE - canvas.height, this.y - canvas.height/2));
  }
  collideX(level){
    const r=this.getRect();
    const tx1=Math.floor(r.x/TILE), tx2=Math.floor((r.x+r.w-1)/TILE);
    const ty1=Math.floor(r.y/TILE), ty2=Math.floor((r.y+r.h-1)/TILE);
    for(let ty=ty1;ty<=ty2;ty++){
      for(let tx=tx1;tx<=tx2;tx++){
        const tid = level.tiles[tx+ty*level.w];
        if(tid===1||tid===2){
          const tileX=tx*TILE, tileY=ty*TILE;
          if(this.vx>0){ this.x=tileX-r.w; this.vx=0; if(!this.grounded) this.wallSlide=true, this.wallDir=1; }
          else if(this.vx<0){ this.x=tileX+TILE; this.vx=0; if(!this.grounded) this.wallSlide=true, this.wallDir=-1; }
        }
      }
    }
    // Bridge collision
    bridges.forEach(b=>{ if(b.active && this.vx!==0 && rectsOverlap(r, b.getRect())){ if(this.vx>0) this.x=b.x-r.w; else this.x=b.x+b.w; this.vx=0; } });
  }
  collideY(level){
    const r=this.getRect();
    const tx1=Math.floor(r.x/TILE), tx2=Math.floor((r.x+r.w-1)/TILE);
    const ty1=Math.floor(r.y/TILE), ty2=Math.floor((r.y+r.h-1)/TILE);
    for(let ty=ty1;ty<=ty2;ty++){
      for(let tx=tx1;tx<=tx2;tx++){
        const tid = level.tiles[tx+ty*level.w];
        if(tid===1){
          const tileY=ty*TILE;
          if(this.vy>0){ this.y=tileY-r.h; this.vy=0; this.grounded=true; }
          else if(this.vy<0){ this.y=tileY+TILE; this.vy=0; }
        }else if(tid===3){
          this.hurt();
        }
      }
    }
    // Bridge collision (top only)
    bridges.forEach(b=>{
      if(b.active && this.vy>=0 && rectsOverlap(r, b.getRect())){
        const br=b.getRect();
        if(this.y+r.h <= br.y + 4 + this.vy){
          this.y=br.y-r.h; this.vy=0; this.grounded=true;
          // break if falling from high
          if(this.vy>0 && this.prevY && this.prevY < br.y - 6*TILE){ b.crack(); }
        }
      }
    });
    this.prevY = this.y;
    // Entity collision
    level.entities.forEach(e=>{
      if(e.type==='slime' && rectsOverlap(r,{x:e.x,y:e.y,w:16,h:16})){
        if(this.vy>0 && this.y+r.h < e.y+8){ e.dead=true; this.vy=JUMP_VEL*0.7; sfxJump(); }
        else this.hurt();
      }
      if(e.type==='checkpoint' && !e.activated && rectsOverlap(r,{x:e.x,y:e.y,w:16,h:16})){
        e.activated=true; activateCheckpoint(e);
      }
    });
  }
  hurt(){ if(invincible>0) return; this.health--; invincible=1800; sfxHurt(); for(let i=0;i<10;i++) particles.push(new Particle(this.x+this.w/2,this.y+this.h/2,'#e94560',Math.random()*8-4,Math.random()*8-4,0.5)); if(this.health<=0) die(); }
  draw(){
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    let img;
    if(!this.grounded) img = sprites.player.jump;
    else if(Math.abs(this.vx)>0.5) img = sprites.player.walk[this.animFrame];
    else img = sprites.player.idle;
    ctx.save();
    if(this.facing===-1){ ctx.scale(-1,1); ctx.drawImage(img, -sx-this.w, sy); }
    else ctx.drawImage(img, sx, sy);
    ctx.restore();
    if(invincible>0 && Math.floor(invincible/100)%2===0) ctx.globalAlpha=0.5;
  }
}

// --- Bridge Class ---
class Bridge{
  constructor(x,y,w){
    this.x=x; this.y=y; thisw=this.w=w; this.active=true; this.age=0; this.cracked=false; this.opacity=1; }
  getRect(){ return {x:this.x,y:this.y,w:this.w,h:8}; }
  update(dt){
    this.age += dt;
    if(this.age > BRIDGE_DURATION - BRIDGE_FADE){
      this.opacity = 1 - (this.age - (BRIDGE_DURATION - BRIDGE_FADE)) / BRIDGE_FADE;
    }
    if(this.age > BRIDGE_DURATION) this.active = false;
  }
  crack(){ this.cracked = true; sfxBridgeFade(); for(let i=0;i<12;i++) particles.push(new Particle(this.x+Math.random()*this.w,this.y,'#8b5e3c',Math.random()*4-2,Math.random()*-3-1,0.5)); }
  draw(){
    if(!this.active) return;
    ctx.save();
    ctx.globalAlpha = this.opacity;
    const tiles = Math.ceil(this.w / 32);
    for(let i=0;i<tiles;i++){
      ctx.drawImage(sprites.bridge, this.x - camera.x + i*32, this.y - camera.y);
    }
    if(this.cracked){
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.x - camera.x, this.y - camera.y);
      ctx.lineTo(this.x - camera.x + this.w, this.y - camera.y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// --- Particle Class ---
class Particle{
  constructor(x,y,c,vx,vy,life){
    this.x=x; this.y=y; this.color=c; this.vx=vx; this.vy=vy; this.life=life; this.maxLife=life; this.size=2+Math.random()*2;
  }
  update(dt){ this.x+=this.vx; this.y+=this.vy; this.vy+=0.2; this.life-=dt; }
  draw(){ if(this.life<=0) return; ctx.save(); ctx.globalAlpha=this.life/this.maxLife; ctx.fillStyle=this.color; ctx.fillRect(this.x-camera.x,this.y-camera.y,this.size,this.size); ctx.restore(); }
}

// --- Bridge Building ---
function tryBuildBridge(player, level){
  const px = player.x + player.w/2;
  const py = player.y + player.h/2;
  const dir = player.facing;
  let span = BRIDGE_MIN_SPAN;
  // Raycast to find gap
  for(let d=BRIDGE_MIN_SPAN; d<=BRIDGE_MAX_SPAN; d+=TILE){
    const checkX = px + dir * d;
    const checkY = py;
    const tx = Math.floor(checkX/TILE);
    const ty = Math.floor(checkY/TILE);
    if(tx>=0 && tx<level.w && ty>=0 && ty<level.h && level.tiles[tx+ty*level.w]===1){
      span = d;
      break;
    }
  }
  const cost = BP_COST_BASE + Math.floor(span/TILE) * BP_COST_INC;
  if(bp < cost) return;
  bp -= cost;
  lastBuildTime = Date.now();
  sfxBuild();
  const bx = px + dir * (player.w/2);
  const by = py - 4;
  bridges.push(new Bridge(bx, by, span));
  for(let i=0;i<15;i++) particles.push(new Particle(bx+Math.random()*span,by,'#f39c12',Math.random()*4-2,Math.random()*-3-1,0.4));
}

// --- Checkpoints ---
function activateCheckpoint(cp){
  currentCheckpoint = cp;
  checkpoints.forEach(c=>c.activated=false);
  cp.activated=true;
  sfxCheckpoint();
  for(let i=0;i<20;i++) particles.push(new Particle(cp.x+8,cp.y+8,'#f1c40f',Math.random()*8-4,Math.random()*8-4,0.6));
}

// --- Level Start ---
function startLevel(idx){
  generateLevel(idx);
  const lvl = levels[idx];
  const spawn = lvl.entities.find(e=>e.type==='checkpoint');
  player = new Player(spawn ? spawn.x : 50, spawn ? spawn.y - 20 : 300);
  bridges = [];
  particles = [];
  bp = BP_MAX;
  dashCooldown = 0;
  invincible = 0;
  gameTime = 0;
  checkpoints = lvl.entities.filter(e=>e.type==='checkpoint');
  currentCheckpoint = checkpoints[0];
  state = 'playing';
  showScreen('');
  document.getElementById('loading').classList.add('hidden');
}

// --- Death ---
function die(){
  if(currentCheckpoint){
    player.x = currentCheckpoint.x;
    player.y = currentCheckpoint.y - 20;
    player.vx = 0;
    player.vy = 0;
    player.health = player.maxHealth;
    invincible = 3000;
    bridges = [];
    bp = BP_MAX;
  }else{
    gameOver();
  }
}
function gameOver(){
  state = 'gameover';
  document.getElementById('final-time').textContent = formatTime(gameTime);
  document.getElementById('high-score').textContent = formatTime(highScore);
  showScreen('game-over');
}

// --- Level Complete ---
function checkLevelComplete(){
  const lvl = levels[currentLevel];
  const exitX = lvl.w * TILE - 50;
  if(player.x > exitX){
    state = 'complete';
    if(gameTime < highScore || highScore===0){
      highScore = gameTime;
      localStorage.setItem('bridgeBuilderHighScore', highScore);
    }
    document.getElementById('complete-time').textContent = formatTime(gameTime);
    showScreen('level-complete');
  }
}

// --- Helpers ---
function rectsOverlap(a,b){ return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
function formatTime(ms){ const m=Math.floor(ms/60000); const s=Math.floor((ms%60000)/1000); const cs=Math.floor((ms%1000)/10); return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}.${cs.toString().padStart(2,'0')}`; }

// --- Main Loop ---
function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize);
resize();

function loop(time){
  const dt = time - lastTime;
  lastTime = time;
  
  if(state === 'playing'){
    gameTime += dt;
    const lvl = levels[currentLevel];
    player.update(dt, lvl);
    bridges.forEach(b=>b.update(dt));
    bridges = bridges.filter(b=>b.active);
    particles.forEach(p=>p.update(dt));
    particles = particles.filter(p=>p.life>0);
    lvl.entities.forEach(e=>{ if(e.type==='slime' && !e.dead) updateSlime(e, lvl); });
    lvl.entities = lvl.entities.filter(e=>!e.dead);
    checkLevelComplete();
  }
  
  draw(lvl);
  requestAnimationFrame(loop);
}

function updateSlime(slime, level){
  slime.x += slime.dir * 0.5;
  slime.patrol -= 0.5;
  if(slime.patrol <= 0){ slime.dir *= -1; slime.patrol = 4*TILE; }
  // Wall check
  const tx = Math.floor((slime.x + (slime.dir>0?16:0))/TILE);
  const ty = Math.floor((slime.y+16)/TILE);
  if(tx>=0 && tx<level.w && ty>=0 && ty<level.h && level.tiles[tx+ty*level.w]===1){
    slime.dir *= -1;
  }
  // Edge check
  const edgeTx = Math.floor((slime.x + (slime.dir>0?16:0))/TILE);
  const edgeTy = Math.floor((slime.y+17)/TILE);
  if(edgeTx>=0 && edgeTx<level.w && edgeTy>=0 && edgeTy<level.h && level.tiles[edgeTx+edgeTy*level.w]===0){
    slime.dir *= -1;
  }
}

function draw(level){
  // Background parallax
  ctx.drawImage(sprites.bgFar, -camera.x*0.1 % 320, -camera.y*0.1 % 180);
  ctx.drawImage(sprites.bgFar, -camera.x*0.1 % 320 + 320, -camera.y*0.1 % 180);
  ctx.drawImage(sprites.bgMid, -camera.x*0.3 % 320, -camera.y*0.3 % 180);
  ctx.drawImage(sprites.bgMid, -camera.x*0.3 % 320 + 320, -camera.y*0.3 % 180);
  ctx.drawImage(sprites.bgNear, -camera.x*0.6 % 320, -camera.y*0.6 % 180);
  ctx.drawImage(sprites.bgNear, -camera.x*0.6 % 320 + 320, -camera.y*0.6 % 180);
  
  // Tiles
  const startX = Math.floor(camera.x/TILE);
  const endX = Math.min(level.w, Math.ceil((camera.x+canvas.width)/TILE));
  const startY = Math.floor(camera.y/TILE);
  const endY = Math.min(level.h, Math.ceil((camera.y+canvas.height)/TILE));
  for(let ty=startY; ty<endY; ty++){
    for(let tx=startX; tx<endX; tx++){
      const tid = level.tiles[tx+ty*level.w];
      if(tid===1){
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(tx*TILE-camera.x, ty*TILE-camera.y, TILE, TILE);
        ctx.fillStyle = '#34495e';
        ctx.fillRect(tx*TILE-camera.x, ty*TILE-camera.y, TILE, 2);
      }else if(tid===3){
        ctx.drawImage(sprites.spike, tx*TILE-camera.x, ty*TILE-camera.y);
      }
    }
  }
  
  // Bridges
  bridges.forEach(b=>b.draw());
  
  // Entities
  level.entities.forEach(e=>{
    if(e.type==='slime'){
      const frame = Math.floor(Date.now()/200)%2;
      ctx.drawImage(sprites.slime[frame], e.x-camera.x, e.y-camera.y);
    }else if(e.type==='checkpoint'){
      const frame = e.activated ? 1 : Math.floor(Date.now()/500)%2;
      ctx.drawImage(sprites.checkpoint[frame], e.x-camera.x, e.y-camera.y);
    }
  });
  
  // Particles
  particles.forEach(p=>p.draw());
  
  // Player
  player.draw();
  
  // HUD updates
  document.querySelector('.health .fill').style.width = (player.health/player.maxHealth)*100 + '%';
  document.getElementById('bp-value').textContent = Math.floor(bp);
  document.querySelector('.bp .fill').style.width = (bp/BP_MAX)*100 + '%';
  document.getElementById('timer').textContent = formatTime(gameTime);
  
  // Minimap
  const mm = document.getElementById('minimap');
  const mmCtx = mm.getContext('2d');
  if(!mmCtx) return;
  mm.width = mm.clientWidth;
  mm.height = mm.clientHeight;
  mmCtx.imageSmoothingEnabled = false;
  const scaleX = mm.width / (level.w*TILE);
  const scaleY = mm.height / (level.h*TILE);
  mmCtx.fillStyle = '#0f3460';
  mmCtx.fillRect(0,0,mm.width,mm.height);
  mmCtx.fillStyle = '#2c3e50';
  for(let ty=0; ty<level.h; ty++){
    for(let tx=0; tx<level.w; tx++){
      if(level.tiles[tx+ty*level.w]===1){
        mmCtx.fillRect(tx*TILE*scaleX, ty*TILE*scaleY, Math.max(1,TILE*scaleX), Math.max(1,TILE*scaleY));
      }
    }
  }
  mmCtx.fillStyle = '#e94560';
  mmCtx.fillRect((player.x-camera.x)*scaleX, (player.y-camera.y)*scaleY, 4,4);
  bridges.forEach(b=>{ if(b.active){ mmCtx.fillStyle = '#8b5e3c'; mmCtx.fillRect((b.x-camera.x)*scaleX, (b.y-camera.y)*scaleY, b.w*scaleX, 2); } });
}

// Start
showScreen('loading');
setTimeout(()=> startLevel(0), 500);
requestAnimationFrame(loop);