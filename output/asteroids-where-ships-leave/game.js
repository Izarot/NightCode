const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const LOGIC_W = 800, LOGIC_H = 600;
let scale = 1, offsetX = 0, offsetY = 0;

// ---------- CONFIG ----------
const CFG = {
  player: { radius: 12, rotSpeed: 3.2, thrustAcc: 240, revAcc: 160, maxFwd: 280, maxRev: 180, collectR: 18 },
  debris: { emitRate: 100, exhaustVel: 140, lifeMin: 0.7, lifeMax: 1.2, sizeMin: 2, sizeMax: 4, maxParticles: 400 },
  asteroid: { minR: 15, maxR: 70, splitCount: [2,3], baseSpeed: 40 },
  physics: { dt: 1/60, maxSubSteps: 4 },
  colors: {
    bg: '#0a0a12',
    ship: '#0ff',
    shipAccent: '#ff0',
    thruster: ['#ff8','#f80','#f40'],
    debris: ['#888','#a84','#c40'],
    asteroid: ['#666','#886','#a88'],
    projectile: '#0ff',
    hud: '#0ff',
    combo: ['#0f0','#ff0','#f80','#f00']
  }
};

// ---------- AUDIO ----------
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const actx = new AudioCtx();
const gainNode = actx.createGain(); gainNode.gain.value = 0.3; gainNode.connect(actx.destination);
function playTone(freq, dur, type='sine', vol=1, slide=0){ if(actx.state==='suspended') actx.resume(); const o=actx.createOscillator(), g=actx.createGain(); o.type=type; o.frequency.value=freq; if(slide) o.frequency.exponentialRampToValueAtTime(freq*slide, actx.currentTime+dur); g.gain.value=vol; g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime+dur); o.connect(g); g.connect(gainNode); o.start(); o.stop(actx.currentTime+dur); }
const SFX = {
  thrust: ()=>playTone(80, 0.1, 'sawtooth', 0.05),
  collect: (combo)=>playTone(440*Math.pow(1.059, Math.min(combo,12)), 0.1, 'triangle', 0.1),
  asteroidHit: ()=>playTone(120, 0.2, 'square', 0.15),
  asteroidDestroy: ()=>{ playTone(200, 0.1, 'square', 0.1); playTone(100, 0.3, 'sawtooth', 0.1); },
  playerHit: ()=>playTone(80, 0.3, 'sawtooth', 0.2),
  shoot: ()=>playTone(600, 0.05, 'square', 0.05, 0.5),
  upgrade: ()=>playTone(880, 0.2, 'triangle', 0.1)
};

// ---------- UTIL ----------
const rand = (a,b)=>Math.random()*(b-a)+a;
const randInt = (a,b)=>Math.floor(rand(a,b+1));
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const dist2 = (x1,y1,x2,y2)=>{ const dx=x2-x1, dy=y2-y1; return dx*dx+dy*dy; };
function wrap(v, max){ if(v<0) return v+max; if(v>=max) return v-max; return v; }
function formatTime(t){ const m=Math.floor(t/60)|0, s=(t%60).toFixed(2).padStart(5,'0'); return `${m.toString().padStart(2,'0')}:${s}`; }

// ---------- ENTITIES ----------
class Player {
  constructor(){
    this.x = LOGIC_W/2; this.y = LOGIC_H/2;
    this.vx = 0; this.vy = 0;
    this.angle = -Math.PI/2;
    this.radius = CFG.player.radius;
    this.hull = 100; this.maxHull = 100;
    this.cargo = 0;
    this.score = 0;
    this.combo = 1; this.comboTimer = 0;
    this.thrusting = false; this.revThrust = false;
    this.rotDir = 0;
    this.invuln = 0;
    this.shootCooldown = 0;
    this.upgrades = { thrust:0, shield:0, collect:0, fireRate:0, debrisRedux:0 };
  }
  update(dt, input){
    this.rotDir = (input.right?1:0) - (input.left?1:0);
    this.angle += this.rotDir * CFG.player.rotSpeed * dt;
    this.thrusting = input.up; this.revThrust = input.down;
    let acc = 0;
    if(this.thrusting) acc = CFG.player.thrustAcc * (1 + this.upgrades.thrust*0.15);
    else if(this.revThrust) acc = -CFG.player.revAcc;
    if(acc !== 0){
      this.vx += Math.cos(this.angle) * acc * dt;
      this.vy += Math.sin(this.angle) * acc * dt;
      if(this.thrusting && Math.random()<0.3) SFX.thrust();
    }
    const maxSpeed = this.thrusting ? CFG.player.maxFwd*(1+this.upgrades.thrust*0.1) : CFG.player.maxRev;
    const spd = Math.hypot(this.vx, this.vy);
    if(spd > maxSpeed){ this.vx = this.vx/spd*maxSpeed; this.vy = this.vy/spd*maxSpeed; }
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.x = wrap(this.x, LOGIC_W); this.y = wrap(this.y, LOGIC_H);
    if(this.invuln > 0) this.invuln -= dt;
    if(this.shootCooldown > 0) this.shootCooldown -= dt;
    if(this.comboTimer > 0){ this.comboTimer -= dt; if(this.comboTimer <= 0) this.combo = 1; }
    if(input.shoot && this.shootCooldown <= 0){ this.shoot(); this.shootCooldown = 0.15 / (1 + this.upgrades.fireRate*0.3); }
  }
  shoot(){ projectiles.push(new Projectile(this.x, this.y, this.angle, this.vx, this.vy)); SFX.shoot(); }
  getExhaustPos(){ return { x: this.x - Math.cos(this.angle)*this.radius*0.8, y: this.y - Math.sin(this.angle)*this.radius*0.8 }; }
  draw(ctx){
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
    if(this.invuln > 0 && Math.floor(this.invuln*10)%2) ctx.globalAlpha = 0.5;
    // ship body
    ctx.beginPath(); ctx.moveTo(this.radius*1.5, 0); ctx.lineTo(-this.radius, -this.radius); ctx.lineTo(-this.radius*0.5, 0); ctx.lineTo(-this.radius, this.radius); ctx.closePath();
    ctx.strokeStyle = CFG.colors.ship; ctx.lineWidth = 2; ctx.stroke();
    // cockpit
    ctx.beginPath(); ctx.arc(this.radius*0.3, 0, 3, 0, Math.PI*2); ctx.fillStyle = CFG.colors.shipAccent; ctx.fill();
    // thruster
    if(this.thrusting){
      const flicker = rand(-2,2);
      ctx.beginPath(); ctx.moveTo(-this.radius*0.5, -this.radius*0.3); ctx.lineTo(-this.radius*1.2+flicker, 0); ctx.lineTo(-this.radius*0.5, this.radius*0.3);
      const g = ctx.createLinearGradient(-this.radius,0,-this.radius*1.5,0);
      g.addColorStop(0, CFG.colors.thruster[0]); g.addColorStop(0.5, CFG.colors.thruster[1]); g.addColorStop(1, CFG.colors.thruster[2]);
      ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
  }
  takeDamage(dmg){ if(this.invuln>0) return false; this.hull -= dmg; this.invuln = 1.5; this.combo = 1; this.comboTimer = 0; SFX.playerHit(); screenShake = 8; return this.hull <= 0; }
  addScore(val){ this.score += Math.floor(val * this.combo); this.combo = Math.min(8, this.combo + 0.5); this.comboTimer = 2; SFX.collect(this.combo); }
  addCargo(val){ this.cargo += val; }
}

class Asteroid {
  constructor(x,y,radius,velX=0,velY=0){
    this.x=x; this.y=y; this.radius=radius;
    this.vx = velX || rand(-CFG.asteroid.baseSpeed, CFG.asteroid.baseSpeed);
    this.vy = velY || rand(-CFG.asteroid.baseSpeed, CFG.asteroid.baseSpeed);
    this.angle = rand(0, Math.PI*2);
    this.rotSpeed = rand(-0.5, 0.5);
    this.verts = []; const segs = randInt(7,12);
    for(let i=0;i<segs;i++){ const a = (i/segs)*Math.PI*2; const r = radius * rand(0.7,1.1); this.verts.push({x:Math.cos(a)*r, y:Math.sin(a)*r}); }
    this.color = CFG.colors.asteroid[randInt(0,2)];
    this.health = Math.ceil(radius/15);
  }
  update(dt){ this.x += this.vx*dt; this.y += this.vy*dt; this.angle += this.rotSpeed*dt; this.x = wrap(this.x, LOGIC_W); this.y = wrap(this.y, LOGIC_H); }
  draw(ctx){ ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.beginPath(); ctx.moveTo(this.verts[0].x, this.verts[0].y); for(let i=1;i<this.verts.length;i++) ctx.lineTo(this.verts[i].x, this.verts[i].y); ctx.closePath(); ctx.strokeStyle = this.color; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); }
  split(){ const arr=[]; if(this.radius <= CFG.asteroid.minR) return arr; const count = randInt(...CFG.asteroid.splitCount); for(let i=0;i<count;i++){ const nr = this.radius * rand(0.4,0.6); const ang = rand(0, Math.PI*2); const spd = CFG.asteroid.baseSpeed * (1 + (1 - nr/this.radius)); arr.push(new Asteroid(this.x, this.y, nr, Math.cos(ang)*spd, Math.sin(ang)*spd)); } return arr; }
}

class Debris {
  constructor(){ this.active=false; this.x=0; this.y=0; this.vx=0; this.vy=0; this.life=0; this.maxLife=1; this.size=2; this.angle=0; this.rotSpeed=0; this.type=0; }
  spawn(x,y,vx,vy,playerVelX,playerVelY,type){
    this.x=x; this.y=y; this.vx=vx+playerVelX*0.3; this.vy=vy+playerVelY*0.3;
    this.life = rand(CFG.debris.lifeMin, CFG.debris.lifeMax); this.maxLife = this.life;
    this.size = rand(CFG.debris.sizeMin, CFG.debris.sizeMax);
    this.angle = rand(0, Math.PI*2); this.rotSpeed = rand(-3,3);
    this.type = type || randInt(0,2); this.active = true;
  }
  update(dt){ if(!this.active) return; this.x += this.vx*dt; this.y += this.vy*dt; this.vx *= 0.995; this.vy *= 0.995; this.angle += this.rotSpeed*dt; this.life -= dt; if(this.life <= 0) this.active = false; this.x = wrap(this.x, LOGIC_W); this.y = wrap(this.y, LOGIC_H); }
  draw(ctx){ if(!this.active) return; const alpha = this.life/this.maxLife; ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.globalAlpha = alpha;
    const colors = CFG.colors.debris; ctx.fillStyle = colors[this.type];
    ctx.beginPath();
    if(this.type===0){ ctx.arc(0,0,this.size,0,Math.PI*2); }
    else if(this.type===1){ const s=this.size; ctx.moveTo(s,0); ctx.lineTo(-s,s*0.5); ctx.lineTo(-s,-s*0.5); }
    else{ const s=this.size; ctx.moveTo(0,-s); ctx.lineTo(s*0.8,s*0.5); ctx.lineTo(-s*0.8,s*0.5); }
    ctx.fill(); ctx.restore(); }
  collect(){ this.active = false; }
}

class Projectile {
  constructor(x,y,angle, pvx, pvy){ this.x=x; this.y=y; this.angle=angle; const spd=600; this.vx=Math.cos(angle)*spd+pvx; this.vy=Math.sin(angle)*spd+pvy; this.life=1.5; this.radius=3; }
  update(dt){ this.x+=this.vx*dt; this.y+=this.vy*dt; this.life-=dt; this.x=wrap(this.x, LOGIC_W); this.y=wrap(this.y, LOGIC_H); return this.life>0; }
  draw(ctx){ ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.fillStyle=CFG.colors.projectile; ctx.beginPath(); ctx.moveTo(this.radius,0); ctx.lineTo(-this.radius,-this.radius*0.5); ctx.lineTo(-this.radius,this.radius*0.5); ctx.closePath(); ctx.fill(); ctx.restore(); }
}

// ---------- PARTICLE POOL ----------
const debrisPool = [];
for(let i=0;i<CFG.debris.maxParticles;i++) debrisPool.push(new Debris());
function getDebris(){ return debrisPool.find(d=>!d.active) || debrisPool[0]; }
function spawnDebrisBurst(x,y,count,velMult=1){ for(let i=0;i<count;i++){ const d=getDebris(); const ang=rand(0,Math.PI*2); const spd=rand(50,150)*velMult; d.spawn(x,y,Math.cos(ang)*spd,Math.sin(ang)*spd,0,0,randInt(0,2)); } }

// ---------- GAME STATE ----------
let player = new Player();
let asteroids = [];
let projectiles = [];
let screenShake = 0;
let gameTime = 0;
let wave = 1;
let state = 'start'; // start, playing, paused, gameover
let lastTime = 0;
let accumulator = 0;
const keys = { up:false, down:false, left:false, right:false, shoot:false, pause:false };
const touchState = { left:false, right:false, up:false, down:false, shoot:false };
let highScore = parseInt(localStorage.getItem('astroTrailHS')) || 0;

// ---------- INPUT ----------
window.addEventListener('keydown', e=>{ switch(e.code){ case 'ArrowUp': case 'KeyW': keys.up=true; break; case 'ArrowDown': case 'KeyS': keys.down=true; break; case 'ArrowLeft': case 'KeyA': keys.left=true; break; case 'ArrowRight': case 'KeyD': keys.right=true; break; case 'Space': e.preventDefault(); keys.shoot=true; break; case 'Escape': keys.pause=true; break; } });
window.addEventListener('keyup', e=>{ switch(e.code){ case 'ArrowUp': case 'KeyW': keys.up=false; break; case 'ArrowDown': case 'KeyS': keys.down=false; break; case 'ArrowLeft': case 'KeyA': keys.left=false; break; case 'ArrowRight': case 'KeyD': keys.right=false; break; case 'Space': keys.shoot=false; break; case 'Escape': keys.pause=false; break; } });

// Touch controls
const touchZone = { left:{x:0,y:LOGIC_H/2,r:LOGIC_H/2}, right:{x:LOGIC_W,y:LOGIC_H/2,r:LOGIC_H/2} };
canvas.addEventListener('touchstart', e=>{ e.preventDefault(); handleTouch(e.touches); }, {passive:false});
canvas.addEventListener('touchmove', e=>{ e.preventDefault(); handleTouch(e.touches); }, {passive:false});
canvas.addEventListener('touchend', e=>{ e.preventDefault(); handleTouch(e.touches); }, {passive:false});
function handleTouch(touches){ touchState.left=touchState.right=touchState.up=touchState.down=touchState.shoot=false; for(const t of touches){ const x = (t.clientX - offsetX)/scale; const y = (t.clientY - offsetY)/scale; if(x < LOGIC_W/2){ touchState.left = true; if(y < LOGIC_H/2) touchState.up = true; else touchState.down = true; } else { touchState.right = true; touchState.shoot = true; } } }
function getInput(){ return { up: keys.up || touchState.up, down: keys.down || touchState.down, left: keys.left || touchState.left, right: keys.right || touchState.right, shoot: keys.shoot || touchState.shoot, pause: keys.pause } };

// ---------- COLLISION ----------
function circleCollide(x1,y1,r1, x2,y2,r2){ const dx=x2-x1, dy=y2-y1; const d2=dx*dx+dy*dy; const r=r1+r2; return d2 < r*r; }
function resolveOverlap(x1,y1,r1, x2,y2,r2){ const dx=x2-x1, dy=y2-y1; const d=Math.hypot(dx,dy); const overlap=r1+r2-d; if(overlap>0 && d>0){ return {x:dx/d*overlap*0.5, y:dy/d*overlap*0.5}; } return {x:0,y:0}; }

// ---------- GAME LOGIC ----------
function spawnWave(){ asteroids=[]; const count = 3 + wave*2; for(let i=0;i<count;i++){ let x,y; do{ x=rand(0,LOGIC_W); y=rand(0,LOGIC_H); } while(dist2(x,y,player.x,player.y) < 200*200); asteroids.push(new Asteroid(x,y,rand(30,70))); } }
function resetGame(){ player = new Player(); wave = 1; gameTime = 0; spawnWave(); state = 'playing'; }
function gameOver(){ state = 'gameover'; if(player.score > highScore){ highScore = player.score; localStorage.setItem('astroTrailHS', highScore); } document.getElementById('finalScore').textContent = player.score; document.getElementById('finalTime').textContent = formatTime(gameTime); document.getElementById('finalCargo').textContent = player.cargo; document.getElementById('gameOverScreen').style.display = 'flex'; }
function updateHUD(){ document.getElementById('scoreVal').textContent = player.score; document.getElementById('highScoreVal').textContent = highScore; document.getElementById('timerVal').textContent = formatTime(gameTime); document.getElementById('hullVal').textContent = Math.max(0, Math.ceil(player.hull)); document.getElementById('cargoVal').textContent = player.cargo; const comboEl = document.getElementById('hudCombo'); if(player.combo > 1){ comboEl.style.display = 'block'; document.getElementById('comboVal').textContent = player.combo.toFixed(1); comboEl.style.color = CFG.colors.combo[Math.min(3, Math.floor(player.combo/2))]; } else comboEl.style.display = 'none'; document.getElementById('waveVal').textContent = wave; document.getElementById('startHighScore').textContent = highScore; }

function update(dt){
  if(state !== 'playing') return;
  gameTime += dt;
  const input = getInput();
  if(input.pause){ state = 'paused'; document.getElementById('pauseScreen').style.display = 'flex'; keys.pause=false; return; }
  player.update(dt, input);
  // emit debris
  if(player.thrusting){
    const emitCount = CFG.debris.emitRate * dt * (1 - player.upgrades.debrisRedux*0.15);
    let acc = emitCount;
    while(acc >= 1){ const d = getDebris(); const ep = player.getExhaustPos(); const ang = player.angle + Math.PI; d.spawn(ep.x, ep.y, Math.cos(ang)*CFG.debris.exhaustVel, Math.sin(ang)*CFG.debris.exhaustVel, player.vx, player.vy); acc--; }
    if(Math.random() < acc){ const d = getDebris(); const ep = player.getExhaustPos(); const ang = player.angle + Math.PI; d.spawn(ep.x, ep.y, Math.cos(ang)*CFG.debris.exhaustVel, Math.sin(ang)*CFG.debris.exhaustVel, player.vx, player.vy); }
  }
  // update debris
  for(const d of debrisPool) d.update(dt);
  // update projectiles
  for(let i=projectiles.length-1;i>=0;i--){ if(!projectiles[i].update(dt)) projectiles.splice(i,1); }
  // update asteroids
  for(const a of asteroids) a.update(dt);
  // projectile vs asteroid
  for(let i=projectiles.length-1;i>=0;i--){ const p = projectiles[i]; for(let j=asteroids.length-1;j>=0;j--){ const a = asteroids[j]; if(circleCollide(p.x,p.y,p.radius, a.x,a.y,a.radius)){ a.health--; projectiles.splice(i,1); SFX.asteroidHit(); if(a.health <= 0){ SFX.asteroidDestroy(); spawnDebrisBurst(a.x,a.y,15,2); const split = a.split(); asteroids.splice(j,1); asteroids.push(...split); player.addScore(50 * (a.radius/20)); player.addCargo(1); } break; } } }
  // player vs asteroid
  for(const a of asteroids){ if(circleCollide(player.x,player.y,player.radius, a.x,a.y,a.radius)){ const res = resolveOverlap(player.x,player.y,player.radius, a.x,a.y,a.radius); player.x -= res.x; player.y -= res.y; a.x += res.x; a.y += res.y; if(player.takeDamage(15)){ gameOver(); return; } screenShake = 10; } }
  // player vs debris collection
  for(const d of debrisPool){ if(d.active && dist2(player.x,player.y,d.x,d.y) < (player.radius + CFG.player.collectR + player.upgrades.collect*5)**2){ const vals = [10, 25, 100]; const cargoVals = [1, 2, 5]; player.addScore(vals[d.type]); player.addCargo(cargoVals[d.type]); d.collect(); spawnDebrisBurst(d.x,d.y,3,0.5); } }
  // wave clear
  if(asteroids.length === 0){ wave++; spawnWave(); screenShake = 5; }
  // screen shake decay
  if(screenShake > 0) screenShake *= 0.9;
}

// ---------- RENDER ----------
const starconst starField = [];
for(let i=0;i<200;i++){ starField.push({ x: rand(0,LOGIC_W), y: rand(0,LOGIC_H), size: rand(0.5,2), speed: rand(10,50), brightness: rand(0.3,1) }); }
function render(){
  const shakeX = screenShake > 0.5 ? rand(-screenShake, screenShake) : 0;
  const shakeY = screenShake > 0.5 ? rand(-screenShake, screenShake) : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);
  ctx.fillStyle = CFG.colors.bg;
  ctx.fillRect(0,0,LOGIC_W,LOGIC_H);
  // stars
  for(const s of starField){
    ctx.globalAlpha = s.brightness;
    ctx.fillStyle = '#fff';
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }
  ctx.globalAlpha = 1;
  // debris
  for(const d of debrisPool) d.draw(ctx);
  // asteroids
  for(const a of asteroids) a.draw(ctx);
  // projectiles
  for(const p of projectiles) p.draw(ctx);
  // player
  player.draw(ctx);
  ctx.restore();
}

// ---------- MAIN LOOP ----------
function resize(){
  const w = window.innerWidth;
  const h = window.innerHeight;
  scale = Math.min(w/LOGIC_W, h/LOGIC_H);
  offsetX = (w - LOGIC_W*scale)/2;
  offsetY = (h - LOGIC_H*scale)/2;
  canvas.style.width = LOGIC_W*scale + 'px';
  canvas.style.height = LOGIC_H*scale + 'px';
}
window.addEventListener('resize', resize);
resize();

function loop(time){
  const dt = (time - lastTime)/1000;
  lastTime = time;
  accumulator += dt;
  while(accumulator >= CFG.physics.dt && CFG.physics.maxSubSteps-- > 0){
    update(CFG.physics.dt);
    accumulator -= CFG.physics.dt;
  }
  render();
  requestAnimationFrame(loop);
}

// ---------- UI EVENTS ----------
document.getElementById('startBtn').addEventListener('click', ()=>{
  document.getElementById('startScreen').style.display = 'none';
  resetGame();
});
document.getElementById('resumeBtn').addEventListener('click', ()=>{
  document.getElementById('pauseScreen').style.display = 'none';
  state = 'playing';
});
document.getElementById('quitBtn').addEventListener('click', ()=>{
  document.getElementById('pauseScreen').style.display = 'none';
  document.getElementById('startScreen').style.display = 'flex';
  state = 'start';
});
document.getElementById('restartBtn').addEventListener('click', ()=>{
  document.getElementById('gameOverScreen').style.display = 'none';
  resetGame();
});

// Prevent context menu on right click
canvas.addEventListener('contextmenu', e=>e.preventDefault());

// Start loop
requestAnimationFrame(loop);
