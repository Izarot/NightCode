const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let w = window.innerWidth, h = window.innerHeight;
canvas.width = w; canvas.height = h;
window.addEventListener('resize',()=>{w=window.innerWidth;h=window.innerHeight;canvas.width=w;canvas.height=h;});

const PALETTE = {bg:'#0a0a0a',player:'#00ffcc',projectile:'#ff6b6b',enemy:'#785ce9',shield:'#00ffcc'};
const KEYS = {};
let mouse = {x:0,y:0,down:false};
let score = 0, wave = 1, highScore = localStorage.getItem('hs')||0;
let lastTime = 0, accTime = 0;
let player = {x:w/2,y:h/2,vx:0,vy:0,r:15,spd:0,rot:0,health:100,shield:{active:false,time:0,cooldown:0,duration:3,damage:0,maxDmg:120,absorb:3},fireCdt:0,speedBoost:false};
let projectiles=[], enemies=[], particles=[], powerUps=[];
let shieldDeployCdt = 0;
let audioCtx = new (window.AudioContext||window.webkitAudioContext)();
let soundEnabled = true;
function beep(freq, dur){
  if(!soundEnabled) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination); o.frequency.value = freq; g.gain.setValueAtTime(0.3, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+dur); o.start(); o.stop(audioCtx.currentTime+dur);
}
function spawnEnemy(type){const e = {x:Math.random()*w,y:Math.random()*h,vx:0,vy:0,r:12,spd:1.5,type,health:50,damage:15,fireCdt:0,dodge:0,state:'idle',timer:0};enemies.push(e);}
function spawnWave(n){for(let i=0;i<n;i++)spawnEnemy(['ranged','melee','turret'][Math.floor(Math.random()*3)]);}
function update(dt){
  if(player.shield.active){player.shield.time-=dt;if(player.shield.time<=0){player.shield.active=false;player.shield.cooldown=8;}}
  if(player.shield.cooldown>0)player.shield.cooldown-=dt;
  player.fireCdt-=dt;
  shieldDeployCdt-=dt;
  player.vx *= 0.85; player.vy *= 0.85;
  if(KEYS['w']||KEYS['ArrowUp']) player.vy -= 0.8;
  if(KEYS['s']||KEYS['ArrowDown']) player.vy += 0.8;
  if(KEYS['a']||KEYS['ArrowLeft']) player.vx -= 0.8;
  if(KEYS['d']||KEYS['ArrowRight']) player.vx += 0.8;
  const spd = Math.sqrt(player.vx*player.vx+player.vy*player.vy);
  if(spd>5) {player.vx = player.vx/spd*5; player.vy = player.vy/spd*5;}
  player.x += player.vx; player.y += player.vy;
  if(player.shield.active)player.vx*=0.5,player.vy*=0.5;
  player.x = (player.x+w)%w; player.y = (player.y+h)%h;
  player.rot += (Math.atan2(mouse.y-player.y+canvas.height/2,mouse.x-player.x+canvas.width/2)-player.rot)*0.15;
  projectiles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=dt;});
  projectiles = projectiles.filter(p=>p.life>0);
  enemies.forEach(e=>{e.x+=e.vx;e.y+=e.vy;e.life-=0.01;if(e.life<=0)e.x=Math.random()*w,e.y=Math.random()*h;});
  particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=dt;p.opacity-=dt*0.5;});
  particles = particles.filter(p=>p.life>0&&p.opacity>0);
  powerUps.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=dt;});
  powerUps = powerUps.filter(p=>p.life>0);
  if(mouse.down&&player.fireCdt<=0&&!player.shield.active){fire();player.fireCdt=0.3;}
  if(KEYS['f']&&shieldDeployCdt<=0&&!player.shield.active){deployShield();shieldDeployCdt=8;}
  checkCollisions();
  score = Math.floor(accTime*10+enemies.length*10);
  if(score>highScore){highScore=score;localStorage.setItem('hs',highScore);}
}
function fire(){const p={x:player.x,y:player.y,vx:Math.cos(player.rot)*15,vy:Math.sin(player.rot)*15,r:4,life:2,trail:[]};projectiles.push(p);beep(800,0.05);}
function deployShield(){player.shield.active=true;player.shield.time=3;player.shield.damage=0;beep(400,0.1);}
function checkCollisions(){
  projectiles.forEach(p=>{if(player.shield.active&&dist(p.x,p.y,player.x,player.y)<40){p.life=0;player.shield.damage+=10;spawnParticle(p.x,p.y,'spark');if(player.shield.damage>=120){player.shield.active=false;player.shield.cooldown=8;}}
  else enemies.forEach(e=>{if(dist(p.x,p.y,e.x,e.y)<e.r+p.r){p.life=0;e.health-=15;spawnParticle(p.x,p.y,'hit');}});
});
  enemies.forEach(e=>{if(dist(e.x,e.y,player.x,player.y)<e.r+player.r){player.health-=15;spawnParticle(e.x,e.y,'hit');e.x=Math.random()*w;e.y=Math.random()*h;}});
}
function spawnParticle(x,y,type){
  for(let i=0;i<5;i++)particles.push({x:x+(Math.random()-0.5)*20,y:y+(Math.random()-0.5)*20,vx:(Math.random()-0.5)*5,vy:(Math.random()-0.5)*5,life:0.8,opacity:1, hue:Math.floor(Math.random()*360)});
}
function dist(x1,y1,x2,y2){return Math.sqrt((x2-x1)**2+(y2-y1)**2);}
function render(){
  ctx.fillStyle = PALETTE.bg; ctx.fillRect(0,0,w,h);
  ctx.fillStyle = PALETTE.player; ctx.beginPath(); ctx.arc(player.x,player.y,player.r,0,Math.PI*2); ctx.fill();
  if(player.shield.active){ctx.strokeStyle = PALETTE.shield; ctx.beginPath(); ctx.arc(player.x,player.y,40,0,Math.PI*2); ctx.stroke();}
  projectiles.forEach(p=>{ctx.fillStyle = PALETTE.projectile; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();});
  enemies.forEach(e=>{ctx.fillStyle = PALETTE.enemy; ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill();});
  particles.forEach(p=>{ctx.fillStyle = `hsl(${p.hue},100%,50%)`; ctx.globalAlpha=p.opacity; ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1;});
  renderHUD();
}
function renderHUD(){
  const hp = document.querySelector('#health-bar div');
  hp.style.width = (player.health/100)*200 + 'px';
  const arc = document.getElementById('shield-arc');
  if(player.shield.active){arc.style.strokeDashoffset = 283*(1-player.shield.time/3);}
  else if(player.shield.cooldown>0){arc.style.strokeDashoffset = 283*(player.shield.cooldown/8);}
  document.getElementById('score').textContent = score;
  document.getElementById('wave-label').textContent = 'Wave '+wave;
}
function gameLoop(ts){
  const dt = 1/60;
  accTime += dt;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
window.addEventListener('keydown',e=>{KEYS[e.key.toLowerCase()]=true;if(!tooltip.style.display=='none'){document.getElementById('tooltip').style.display='none';}});
window.addEventListener('keyup',e=>{KEYS[e.key.toLowerCase()]=false;});
canvas.addEventListener('mousemove',e=>{const rect=canvas.getBoundingClientRect();mouse.x=((e.clientX-rect.left)/rect.width)*w;mouse.y=((e.clientY-rect.top)/rect.height)*h;});
canvas.addEventListener('click',()=>{mouse.down=true;});
canvas.addEventListener('mouseup',()=>{mouse.down=false;});
const pauseBtn = document.getElementById('pause-menu');
const pause = {active:false};
function togglePause(){pause.active=!pause.active;pauseBtn.style.display=pause.active?'flex':'none';if(pause.active)audioCtx.suspend();else audioCtx.resume();}
window.addEventListener('keydown',e=>{if(e.key==='Escape')togglePause();});
document.getElementById('resume-btn').addEventListener('click',togglePause);
document.getElementById('restart-btn').addEventListener('click',()=>{location.reload();});
document.getElementById('quit-btn').addEventListener('click',()=>{window.close();});
let tooltipShown=false;
window.addEventListener('keydown',e=>{if(!tooltipShown&&(e.key==='w'||e.key==='a'||e.key==='s'||e.key==='d'||e.key==='f'||e.key==='ArrowUp'||e.key==='ArrowDown'||e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key===' '||e.key==='Enter'||mouse.down){document.getElementById('tooltip').style.display='block';tooltipShown=true;}});
setInterval(()=>{let m = Math.floor(accTime/60);let s = Math.floor(accTime%60);document.getElementById('timer').textContent = m.toString().padStart(2,'0')+':'+s.toString().padStart(2,'0');},1000);
spawnWave(3);
