const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
let width=1000,height=1000;
function resize(){width=canvas.clientWidth;height=canvas.clientHeight;canvas.width=width;canvas.height=height;}
window.addEventListener('resize',resize);resize();

const keys={};
window.addEventListener('keydown',e=>keys[e.key]=true);
window.addEventListener('keyup',e=>keys[e.key]=false);

const station={x:500,y:500,vx:0,vy:0,ax:0,ay:0,health:1000,energy:0,maxHealth:1000,maxEnergy:1000};
const turrets=Array.from({length:8},(_,i)=>({angle:0,fireRate:1,cooldown:0}));
const asteroids=[];
let lastTime=performance.now();
let wave=1,waveTimer=60000,spawnInterval=2000;
let score=0,highScore=localStorage.getItem('highScore')||0;
const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
function playLaser(){const osc=audioCtx.createOscillator();osc.frequency.value=600;osc.type='sine';const gain=audioCtx.createGain();gain.gain.value=0.1;osc.connect(gain).connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+0.1);}
function playImpact(){const osc=audioCtx.createOscillator();osc.frequency.value=200;osc.type='square';const gain=audioCtx.createGain();gain.gain.value=0.2;osc.connect(gain).connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+0.2);}
function spawnAsteroid(){asteroids.push({x:Math.random()*1000,y:Math.random()*1000,dx:(Math.random()-0.5)*2,dy:(Math.random()-0.5)*2,hp:100});}
function update(dt){
station.ax=0;station.ay=0;
if(keys['w']||keys['ArrowUp']){station.ay=-200;}
if(keys['s']||keys['ArrowDown']){station.ay=200;}
if(keys['a']||keys['ArrowLeft']){station.ax=-200;}
if(keys['d']||keys['ArrowRight']){station.ax=200;}
station.vx+=station.ax*dt;station.vy+=station.ay*dt;
const speed=Math.hypot(station.vx,station.vy);
if(speed>500){station.vx*=500/speed;station.vy*=500/speed;}
station.vx*=Math.max(0,1-100*dt);station.vy*=Math.max(0,1-100*dt);
station.x+=station.vx*dt;station.y+=station.vy*dt;
if(station.x<0)station.x=0;if(station.x>1000)station.x=1000;
if(station.y<0)station.y=0;if(station.y>1000)station.y=1000;
station.energy=Math.min(station.maxEnergy,station.energy+100*dt);
for(const t of turrets){t.cooldown=Math.max(0,t.cooldown-dt);const dx=station.x-500,dy=station.y-500;t.angle=Math.atan2(dy,dx);}
for(const a of asteroids){a.x+=a.dx*dt;a.y+=a.dy*dt;}
}
function render(){
ctx.clearRect(0,0,1000,1000);
ctx.fillStyle='white';
ctx.beginPath();ctx.arc(station.x,station.y,20,0,Math.PI*2);ctx.fill();
for(const t of turrets){ctx.save();ctx.translate(station.x,station.y);ctx.rotate(t.angle);ctx.fillStyle='cyan';ctx.fillRect(0,-5,30,10);ctx.restore();}
for(const a of asteroids){ctx.fillStyle='gray';ctx.beginPath();ctx.arc(a.x,a.y,10,0,Math.PI*2);ctx.fill();}
const hud=document.getElementById('hud');
hud.innerHTML=`Health: ${station.health}/${station.maxHealth}<br>Energy: ${Math.floor(station.energy)}/${station.maxEnergy}<br>Wave: ${wave}<br>Score: ${score}<br>High Score: ${highScore}`;
const timer=document.getElementById('timer');
timer.innerHTML=`Time: ${(performance.now()/1000).toFixed(1)}s`;
}
function gameLoop(now){const dt=(now-lastTime)/1000;lastTime=now;update(dt);render();requestAnimationFrame(gameLoop);}
requestAnimationFrame(gameLoop);