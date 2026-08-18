const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
function resize(){canvas.width=window.innerWidth*0.9; canvas.height=window.innerHeight*0.9;}
window.addEventListener('resize',resize);resize();
const HUD=document.getElementById('hud');
const PALETTE={bg:'#111',track:'#222',car:'#0f0',gear:'#ff0',text:'#fff'};
document.body.style.background=PALETTE.bg;
const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
function playTone(freq,dur){const osc=audioCtx.createOscillator();osc.frequency.value=freq;osc.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+dur/1000);}
const keys={};window.addEventListener('keydown',e=>keys[e.key]=true);
window.addEventListener('keyup',e=>keys[e.key]=false);
const car={x:100,y:100,angle:0,speed:0,turn:0.04,acc:0.3,brk:0.4,radius:20};
const gears=[];
function spawnGear(){gears.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,radius:15,collected:false});}
for(let i=0;i<20;i++)spawnGear();
let startTime=0,running=true;
function loop(){if(!running)return;
ctx.clearRect(0,0,canvas.width,canvas.height);
ctx.fillStyle=PALETTE.track;
ctx.fillRect(0,0,canvas.width,canvas.height);
ctx.strokeStyle='#555';
ctx.strokeRect(20,20,canvas.width-40,canvas.height-40);
if(keys['ArrowUp']||keys['w']) car.speed+=car.acc;
if(keys['ArrowDown']||keys['s']) car.speed-=car.brk;
if(keys['ArrowLeft']||keys['a']) car.angle-=car.turn;
if(keys['ArrowRight']||keys['d']) car.angle+=car.turn;
car.angle=car.angle%(2*Math.PI);
car.speed=Math.min(car.speed,4+(car.speedBonus||0));
car.x+=Math.cos(car.angle)*car.speed;
car.y+=Math.sin(car.angle)*car.speed;
if(car.x<30||car.x>canvas.width-30||car.y<30||car.y>canvas.height-30){car.x=Math.max(30,Math.min(canvas.width-30,car.x));car.y=Math.max(30,Math.min(canvas.height-30,car.y));}
if(car.speed<0)car.speed=0;
gears.forEach(g=>{if(!g.collected&&Math.hypot(g.x-car.x,g.y-car.y)<g.radius+car.radius){g.collected=true;car.speedBonus=(car.speedBonus||0)+0.5;playTone(440,100);}});
gears = gears.filter(g=>!g.collected);
if(car.speedBonus){car.speedBonus-=0.01; if(car.speedBonus<0)car.speedBonus=0;}
car.speed=Math.min(car.speed,4+car.speedBonus);
ctx.fillStyle=PALETTE.car;
ctx.save();
ctx.translate(car.x,car.y);
ctx.rotate(car.angle);
ctx.fillRect(-20,-10,40,20);
ctx.restore();
gears.forEach(g=>{if(g.collected)return;ctx.fillStyle=PALETTE.gear;ctx.beginPath();ctx.arc(g.x,g.y,g.radius,0,Math.PI*2);ctx.fill();});
if(!startTime)startTime=performance.now();
const elapsed=(performance.now()-startTime)/1000;
const ms=Math.floor((elapsed*100)%100);
const sec=Math.floor(elapsed)%60;
const min=Math.floor(elapsed/60);
HUD.textContent=`Lap: ${min}:${String(sec).padStart(2,'0')}:${String(ms).padStart(2,'0')} Speed: ${Math.round(car.speed)} Gears: ${gears.filter(g=>!g.collected).length}`;
requestAnimationFrame(loop);}
loop();