const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
let config={};
let ship={x:400,y:300,vx:0,vy:0,angle:0,fuel:100,score:0,shield:0};
let debris=[];
let fuelCans=[];
let particles=[];
let keys={up:false,down:false,left:false,right:false};
let gameRunning=true;

function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
window.addEventListener('resize',resize);resize();

function loadConfig(){try{config={shipSpeed:0.15,maxSpeed:8,friction:0.985,rotationSpeed:0.08,fuelConsumption:0.1,debrisCount:15,fuelCanCount:3,shieldDuration:5000};}catch(e){console.log('Using defaults');}}

function initGame(){loadConfig();debris=[];fuelCans=[];particles=[];
for(let i=0;i<(config.debrisCount||15);i++)debris.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:15+Math.random()*25,vx:(Math.random()-0.5)*2,vy:(Math.random()-0.5)*2,angle:Math.random()*Math.PI*2,spin:(Math.random()-0.5)*0.1});
for(let i=0;i<(config.fuelCanCount||3);i++)spawnFuelCan();}

function spawnFuelCan(){fuelCans.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:12,flash:0});}

function handleInput(){if(keys.up){ship.vx+=Math.cos(ship.angle)*config.shipSpeed;ship.vy+=Math.sin(ship.angle)*config.shipSpeed;ship.fuel-=config.fuelConsumption}
if(keys.down){ship.vx-=Math.cos(ship.angle)*config.shipSpeed*0.5;ship.vy-=Math.sin(ship.angle)*config.shipSpeed*0.5;ship.fuel-=config.fuelConsumption*0.5}
if(keys.left)ship.angle-=config.rotationSpeed;
if(keys.right)ship.angle+=config.rotationSpeed;
ship.fuel=Math.max(0,ship.fuel);
ship.vx*=config.friction;ship.vy*=config.friction;
let speed=Math.sqrt(ship.vx*ship.vx+ship.vy*ship.vy);
if(speed>config.maxSpeed){ship.vx=(ship.vx/speed)*config.maxSpeed;ship.vy=(ship.vy/speed)*config.maxSpeed}
ship.x+=ship.vx;ship.y+=ship.vy;
if(ship.x<0)ship.x=canvas.width;if(ship.x>canvas.width)ship.x=0;
if(ship.y<0)ship.y=canvas.height;if(ship.y>canvas.height)ship.y=0;}

function updateObjects(){debris.forEach(d=>{d.x+=d.vx;d.y+=d.vy;d.angle+=d.spin;
if(d.x<0)d.x=canvas.width;if(d.x>canvas.width)d.x=0;
if(d.y<0)d.y=canvas.height;if(d.y>canvas.height)d.y=0;});
fuelCans.forEach(f=>{f.flash=(f.flash+0.1)%(Math.PI*2)});
particles=particles.filter(p=>p.life>0);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=1});}

function checkCollisions(){for(let d of debris){let dx=ship.x-d.x,dy=ship.y-d.y,dist=Math.sqrt(dx*dx+dy*dy);
if(dist<d.r+10){if(ship.shield>0){ship.shield-=1000;debris=debris.filter(x=>x!==d);ship.score+=50;createExplosion(d.x,d.y,'#ff0');}
else{gameRunning=false;createExplosion(ship.x,ship.y,'#f00');}}}
for(let i=fuelCans.length-1;i>=0;i--){let f=fuelCans[i];let dx=ship.x-f.x,dy=ship.y-f.y,dist=Math.sqrt(dx*dx+dy*dy);
if(dist<f.r+10){fuelCans.splice(i,1);ship.fuel=Math.min(100,ship.fuel+20);ship.score+=100;createExplosion(f.x,f.y,'#0f0');setTimeout(spawnFuelCan,3000);}}}

function createExplosion(x,y,color){for(let i=0;i<15;i++){let angle=Math.random()*Math.PI*2,speed=Math.random()*4+1;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:30+Math.random()*20,color,size:3+Math.random()*4});}}

function draw(){ctx.fillStyle='#0a0a2a';ctx.fillRect(0,0,canvas.width,canvas.height);
ctx.strokeStyle='rgba(0,255,255,0.1)';for(let i=0;i<canvas.width;i+=50){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,canvas.height);ctx.stroke()}
for(let i=0;i<canvas.height;i+=50){ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(canvas.width,i);ctx.stroke()}
ctx.save();ctx.translate(ship.x,ship.y);ctx.rotate(ship.angle);
if(ship.shield>0){ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.strokeStyle=`rgba(0,200,255,${0.3+Math.sin(Date.now()*0.01)*0.2})`;ctx.lineWidth=3;ctx.stroke()}
ctx.fillStyle='#0ff';ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-10,8);ctx.lineTo(-6,0);ctx.lineTo(-10,-8);ctx.closePath();ctx.fill();
ctx.fillStyle='#f80';ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(-12,4);ctx.lineTo(-12,-4);ctx.closePath();ctx.fill();ctx.restore();
debris.forEach(d=>{ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.angle);
ctx.fillStyle='#666';ctx.beginPath();for(let i=0;i<5;i++){let a=(i/5)*Math.PI*2,r=d.r*(0.7+Math.random()*0.3);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.restore()});
fuelCans.forEach(f=>{ctx.save();ctx.translate(f.x,f.y);
ctx.fillStyle=`rgba(0,255,0,${0.6+Math.sin(f.flash)*0.3})`;ctx.fillRect(-f.r/2,-f.r/2,f.r,f.r);
ctx.fillStyle='#0f0';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('⛽',0,0);ctx.restore()});
particles.forEach(p=>{ctx.fillStyle=p.color;ctx.globalAlpha=p.life/50;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;
ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.textAlign='left';ctx.fillText(`Fuel: ${Math.round(ship.fuel)}%`,20,30);
ctx.fillText(`Score: ${ship.score}`,20,55);
if(ship.shield>0)ctx.fillText(`Shield: ${Math.round(ship.shield/1000)}s`,20,80);
if(!gameRunning){ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,canvas.width,canvas.height);
ctx.fillStyle='#f00';ctx.font='48px sans-serif';ctx.textAlign='center';ctx.fillText('GAME OVER',canvas.width/2,canvas.height/2-30);
ctx.font='24px sans-serif';ctx.fillStyle='#fff';ctx.fillText(`Final Score: ${ship.score}`,canvas.width/2,canvas.height/2+20);
ctx.font='18px sans-serif';ctx.fillText('Press R to Restart',canvas.width/2,canvas.height/2+60);}}

function gameLoop(){if(gameRunning){handleInput();updateObjects();checkCollisions();ship.score+=0.1}
draw();requestAnimationFrame(gameLoop)}

document.addEventListener('keydown',e=>{if(e.key==='w'||e.key==='W'||e.key==='ArrowUp')keys.up=true;
if(e.key==='s'||e.key==='S'||e.key==='ArrowDown')keys.down=true;
if(e.key==='a'||e.key==='A'||e.key==='ArrowLeft')keys.left=true;
if(e.key==='d'||e.key==='D'||e.key==='ArrowRight')keys.right=true;
if(e.key==='r'||e.key==='R'){ship={x:400,y:300,vx:0,vy:0,angle:0,fuel:100,score:0,shield:0};gameRunning=true;initGame()}});
document.addEventListener('keyup',e=>{if(e.key==='w'||e.key==='W'||e.key==='ArrowUp')keys.up=false;
if(e.key==='s'||e.key==='S'||e.key==='ArrowDown')keys.down=false;
if(e.key==='a'||e.key==='A'||e.key==='ArrowLeft')keys.left=false;
if(e.key==='d'||e.key==='D'||e.key==='ArrowRight')keys.right=false});

document.getElementById('btnThrust')?.addEventListener('touchstart',e=>{e.preventDefault();keys.up=true});
document.getElementById('btnThrust')?.addEventListener('touchend',e=>{e.preventDefault();keys.up=false});
document.getElementById('btnReverse')?.addEventListener('touchstart',e=>{e.preventDefault();keys.down=true});
document.getElementById('btnReverse')?.addEventListener('touchend',e=>{e.preventDefault();keys.down=false});
document.getElementById('btnShield')?.addEventListener('touchstart',e=>{e.preventDefault();if(ship.fuel>=20){ship.fuel-=20;ship.shield=5000}});

let joystickEl=document.getElementById('joystick');
if(joystickEl){let rect,centerX,centerY,active=false;
joystickEl.addEventListener('touchstart',e=>{rect=joystickEl.getBoundingClientRect();centerX=rect.left+rect.width/2;centerY=rect.top+rect.height/2;active=true});
document.addEventListener('touchmove',e=>{if(!active)return;let touch=e.touches[0];let dx=touch.clientX-centerX,dy=touch.clientY-centerY;let dist=Math.sqrt(dx*dx+dy*dy),maxDist=30;
if(dist>maxDist){dx=(dx/dist)*maxDist;dy=(dy/dist)*maxDist;dist=maxDist}document.getElementById('stick').style.transform=`translate(${dx}px,${dy}px)`;
keys.left=dx<-10;keys.right=dx>10;keys.up=dy<-10;keys.down=dy>10});
document.addEventListener('touchend',()=>{active=false;document.getElementById('stick').style.transform='translate(0,0)';keys.left=false;keys.right=false;keys.up=false;keys.down=false})}

initGame();gameLoop();