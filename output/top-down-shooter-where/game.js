// Afterimage Assault - compact single file
(function(){
'use strict';
var canvas=document.getElementById('game');
var ctx=canvas.getContext('2d');
var W=800,H=600;

// Responsive scaling
function resize(){
  var s=Math.min(window.innerWidth/W,window.innerHeight/H);
  canvas.style.width=(W*s)+'px';
  canvas.style.height=(H*s)+'px';
}
window.addEventListener('resize',resize);resize();

// Palette: vibrant magenta/cyan/lime
var COL={bg:'#050510',player:'#2effd5',bullet:'#7df9ff',after:'#2effd5',grunt:'#ff2e6e',drone:'#1a1a2e',droneEye:'#ff2e2e',boss:'#ff8c1a',orb:'#ffd23f',rapid:'#a3ff3f',shield:'#3fbfff',text:'#e0e0ff'};

// Audio
var AC=null;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}return AC;}
function beep(freq,dur,type,vol){var a=ac();if(!a)return;var o=a.createOscillator(),g=a.createGain();o.type=type||'square';o.frequency.value=freq;g.gain.value=vol||0.08;g.gain.exponentialRampToValueAtTime(0.001,a.currentTime+dur);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+dur);}
function sfxFire(){beep(880,0.08,'square',0.05);}
function sfxHit(){beep(120,0.15,'sawtooth',0.08);}
function sfxDash(){beep(220,0.2,'sine',0.1);beep(440,0.15,'triangle',0.06);}
function sfxBoom(){beep(80,0.4,'sawtooth',0.12);}
function sfxPick(){beep(660,0.1,'sine',0.08);beep(990,0.12,'sine',0.06);}

// Input
var keys={};
var mouse={x:W/2,y:H/2,down:false};
window.addEventListener('keydown',function(e){keys[e.key.toLowerCase()]=true;if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase()))e.preventDefault();});
window.addEventListener('keyup',function(e){keys[e.key.toLowerCase()]=false;});
canvas.addEventListener('mousemove',function(e){var r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)*(W/r.width);mouse.y=(e.clientY-r.top)*(H/r.height);});
canvas.addEventListener('mousedown',function(){mouse.down=true;ac();});
canvas.addEventListener('mouseup',function(){mouse.down=false;});
canvas.addEventListener('touchstart',function(e){e.preventDefault();mouse.down=true;var t=e.touches[0],r=canvas.getBoundingClientRect();mouse.x=(t.clientX-r.left)*(W/r.width);mouse.y=(t.clientY-r.top)*(H/r.height);ac();},{passive:false});
canvas.addEventListener('touchmove',function(e){e.preventDefault();var t=e.touches[0],r=canvas.getBoundingClientRect();mouse.x=(t.clientX-r.left)*(W/r.width);mouse.y=(t.clientY-r.top)*(H/r.height);},{passive:false});
canvas.addEventListener('touchend',function(e){e.preventDefault();mouse.down=false;},{passive:false});

// High score
var HS_KEY='afterimage_hs';
var highScore=parseInt(localStorage.getItem(HS_KEY)||'0',10);

// State
var state='menu';
var score=0;
var startTime=0;
var elapsed=0;
var player, bullets, afters, enemies, particles, pickups, stars;
var wave=0, waveTimer=0, waveActive=false, bossActive=false;
var spawnQueue=[];

// Stars (parallax)
function initStars(){stars=[];for(var i=0;i<120;i++){stars.push({x:Math.random()*W,y:Math.random()*H,z:Math.random()*3+0.3,s:Math.random()*1.5+0.3});}}

function reset(){
player={x:W/2,y:H/2,r:15,vx:0,vy:0,health:100,maxHealth:100,fireCd:0,dashCd:0,dashTime:0,over:0,rapid:0,shield:0,invuln:0,ammo:999};
bullets=[];afters=[];enemies=[];particles=[];pickups=[];
wave=0;waveTimer=0;waveActive=false;bossActive=false;spawnQueue=[];score=0;startTime=performance.now();
initStars();
}

// Collision helpers
function circleRect(cx,cy,cr,rx,ry,rw,rh){var nx=Math.max(rx,Math.min(cx,rx+rw)),ny=Math.max(ry,Math.min(cy,ry+rh));var dx=cx-nx,dy=cy-ny;return dx*dx+dy*dy<cr*cr;}
function rectRect(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}

// Spawn enemy
function spawnEnemy(type){
var side=Math.floor(Math.random()*4);
var x,y;
if(side===0){x=Math.random()*W;y=-30;}else if(side===1){x=W+30;y=Math.random()*H;}else if(side===2){x=Math.random()*W;y=H+30;}else{x=-30;y=Math.random()*H;}
var e={type:type,x:x,y:y,w:32,h:32,hp:60,maxhp:60,speed:150,fireCd:0,zigT:0,zigDir:1,angle:0};
if(type==='drone'){e.hp=20;e.maxhp=20;e.speed=200;e.w=20;e.h=20;}
if(type==='grunt'){e.hp=60;e.maxhp=60;e.speed=150;}
if(type==='boss'){e.hp=200;e.maxhp=200;e.w=80;e.h=80;e.speed=100;e.orbitR=180;e.orbitA=Math.random()*6.28;e.spawnCd=5;e.fireCd=2;}
enemies.push(e);
}

function startWave(n){
waveActive=true;spawnQueue=[];
if(n<5){
var count=4+n*2;
for(var i=0;i<count;i++)spawnQueue.push({type:Math.random()<0.6?'grunt':'drone',t:i*0.8});
}else{
spawnEnemy('boss');bossActive=true;
for(var i=0;i<4;i++)spawnQueue.push({type:'drone',t:i*1.5});
}
waveTimer=0;
}

function fireBullet(){
if(player.fireCd>0)return;
var rate=player.rapid>0?0.05:0.1;
player.fireCd=rate;
var dx=mouse.x-player.x,dy=mouse.y-player.y;var d=Math.hypot(dx,dy)||1;var sp=player.over>0?1000:500;
bullets.push({x:player.x,y:player.y,vx:dx/d*sp,vy:dy/d*sp,life:2,dmg:20,afterCd:0.2});
sfxFire();
}

function dash(){
if(player.dashCd>0)return;
var dx=0,dy=0;
if(keys['w']||keys['arrowup'])dy-=1;if(keys['s']||keys['arrowdown'])dy+=1;
if(keys['a']||keys['arrowleft'])dx-=1;if(keys['d']||keys['arrowright'])dx+=1;
if(dx===0&&dy===0){dx=mouse.x-player.x;dy=mouse.y-player.y;}
var d=Math.hypot(dx,dy)||1;
player.vx=dx/d*600;player.vy=dy/d*600;player.dashTime=0.5;player.dashCd=3;player.invuln=0.5;
sfxDash();
}

function addParticles(x,y,col,n){for(var i=0;i<n;i++){var a=Math.random()*6.28,sp=Math.random()*180+40;particles.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:0.6,col:col});}}

function update(dt){
if(state!=='play')return;
elapsed=(performance.now()-startTime)/1000;

// Player movement
var ax=0,ay=0;
if(keys['w']||keys['arrowup'])ay-=1;if(keys['s']||keys['arrowdown'])ay+=1;
if(keys['a']||keys['arrowleft'])ax-=1;if(keys['d']||keys['arrowright'])ax+=1;
var al=Math.hypot(ax,ay);if(al>0){ax/=al;ay/=al;}
var maxSp=300;
if(player.dashTime>0){maxSp=600;player.dashTime-=dt;}
var accel=player.dashTime>0?2000:1500;
player.vx+=ax*accel*dt;player.vy+=ay*accel*dt;
var fric=al>0?1:0.7;
player.vx*=Math.pow(fric,dt*10);player.vy*=Math.pow(fric,dt*10);
var sp=Math.hypot(player.vx,player.vy);
if(sp>maxSp){player.vx=player.vx/sp*maxSp;player.vy=player.vy/sp*maxSp;}
player.x+=player.vx*dt;player.y+=player.vy*dt;
player.x=Math.max(player.r,Math.min(W-player.r,player.x));player.y=Math.max(player.r,Math.min(H-player.r,player.y));

if(player.fireCd>0)player.fireCd-=dt;
if(player.dashCd>0)player.dashCd-=dt;
if(player.over>0)player.over-=dt;
if(player.rapid>0)player.rapid-=dt;
if(player.shield>0)player.shield-=dt;
if(player.invuln>0)player.invuln-=dt;
if(keys[' '])dash();
if(mouse.down)fireBullet();

// Bullets
for(var i=bullets.length-1;i>=0;i--){var b=bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;b.afterCd-=dt;
if(b.afterCd<=0&&afters.length<10){afters.push({x:b.x,y:b.y,vx:b.vx*0.75,vy:b.vy*0.75,life:player.over>0?5:3,maxlife:player.over>0?5:3,dmg:b.dmg*0.5});b.afterCd=0.2;}
if(b.life<=0||b.x<-20||b.x>W+20||b.y<-20||b.y>H+20)bullets.splice(i,1);
}

// Afterimages
for(var i=afters.length-1;i>=0;i--){var a=afters[i];a.x+=a.vx*dt;a.y+=a.vy*dt;a.life-=dt;a.vx*=Math.pow(0.75,dt);a.vy*=Math.pow(0.75,dt);
if(a.life<=0)afters.splice(i,1);
}

// Enemies
for(var i=enemies.length-1;i>=0;i--){var e=enemies[i];
if(e.type==='boss'){e.orbitA+=dt*1;e.x=W/2+Math.cos(e.orbitA)*e.orbitR;e.y=H/2+Math.sin(e.orbitA)*e.orbitR;e.spawnCd-=dt;e.fireCd-=dt;
if(e.spawnCd<=0){spawnEnemy('drone');spawnEnemy('drone');e.spawnCd=5;}
if(e.fireCd<=0){var dx=player.x-e.x,dy=player.y-e.y;var d=Math.hypot(dx,dy)||1;for(var k=-1;k<=1;k++){var ang=Math.atan2(dy,dx)+k*0.52;bullets.push({x:e.x,y:e.y,vx:Math.cos(ang)*300,vy:Math.sin(ang)*300,life:3,dmg:8,enemy:true,afterCd:99});}e.fireCd=2;}
}else if(e.type==='drone'){e.zigT-=dt;if(e.zigT<=0){e.zigDir*=-1;e.zigT=0.5;}var dx=player.x-e.x,dy=player.y-e.y;var d=Math.hypot(dx,dy)||1;e.x+=dx/d*e.speed*dt+e.zigDir*60*dt;e.y+=dy/d*e.speed*dt;}
else{var dx=player.x-e.x,dy=player.y-e.y;var d=Math.hypot(dx,dy)||1;e.x+=dx/d*e.speed*dt;e.y+=dy/d*e.speed*dt;e.fireCd-=dt;if(d<200&&e.fireCd<=0){bullets.push({x:e.x,y:e.y,vx:dx/d*250,vy:dy/d*250,life:2,dmg:8,enemy:true,afterCd:99});e.fireCd=1.5;}}
// Player collision
if(player.invuln<=0&&player.shield<=0&&circleRect(player.x,player.y,player.r,e.x-e.w/2,e.y-e.h/2,e.w,e.h)){player.health-=10;player.invuln=1;}
}

// Bullet vs enemy
for(var i=bullets.length-1;i>=0;i--){var b=bullets[i];if(b.enemy)continue;
for(var j=enemies.length-1;j>=0;j--){var e=enemies[j];if(rectRect({x:b.x-4,y:b.y-4,w:8,h:8},{x:e.x-e.w/2,y:e.y-e.h/2,w:e.w,h:e.h})){e.hp-=b.dmg;bullets.splice(i,1);sfxHit();if(e.hp<=0){score+=100;addParticles(e.x,e.y,e.type==='boss'?COL.boss:COL.grunt,20);sfxBoom();if(e.type==='drone'){for(var k=enemies.length-1;k>=0;k--){var e2=enemies[k];if(e2!==e&&Math.hypot(e2.x-e.x,e2.y-e.y)<80){e2.hp-=20;}}}
if(e.type==='boss'){score+=1000;bossActive=false;state='win';if(score>highScore){highScore=score;localStorage.setItem(HS_KEY,String(highScore));}}
enemies.splice(j,1);
// Drop chance
if(Math.random()<0.15){var r=Math.random();pickups.push({x:e.x,y:e.y,type:r<0.4?'over':r<0.7?'rapid':'shield',life:10});}
}break;}}}
// Enemy bullets vs player
for(var i=bullets.length-1;i>=0;i--){var b=bullets[i];if(!b.enemy)continue;if(player.invuln<=0&&player.shield<=0&&Math.hypot(b.x-player.x,b.y-player.y)<player.r+4){player.health-=8;player.invuln=0.5;bullets.splice(i,1);sfxHit();}}

// Afterimage vs enemy
for(var i=afters.length-1;i>=0;i--){var a=afters[i];for(var j=enemies.length-1;j>=0;j--){var e=enemies[j];if(rectRect({x:a.x-4,y:a.y-4,w:8,h:8},{x:e.x-e.w/2,y:e.y-e.h/2,w:e.w,h:e.h})){e.hp-=a.dmg;afters.splice(i,1);sfxHit();if(e.hp<=0){score+=100;addParticles(e.x,e.y,COL.grunt,15);sfxBoom();enemies.splice(j,1);}break;}}}

// Pickups
for(var i=pickups.length-1;i>=0;i--){var p=pickups[i];p.life-=dt;if(Math.hypot(p.x-player.x,p.y-player.y)<player.r+12){if(p.type==='over')player.over=10;if(p.type==='rapid')player.rapid=15;if(p.type==='shield')player.shield=30;sfxPick();pickups.splice(i,1);continue;}
if(p.life<=0)pickups.splice(i,1);}

// Particles
for(var i=particles.length-1;i>=0;i--){var p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vx*=0.95;p.vy*=0.95;if(p.life<=0)particles.splice(i,1);}

// Stars
for(var i=0;i<stars.length;i++){var s=stars[i];s.y+=s.z*30*dt;if(s.y>H){s.y=0;s.x=Math.random()*W;}}

// Waves
if(!waveActive&&!bossActive&&enemies.length===0){wave++;if(wave>5){if(score>highScore){highScore=score;localStorage.setItem(HS_KEY,String(highScore));}state='win';return;}startWave(wave);}
if(waveActive){waveTimer+=dt;while(spawnQueue.length&&spawnQueue[0].t<=waveTimer){spawnEnemy(spawnQueue[0].type);spawnQueue.shift();}if(spawnQueue.length===0)waveActive=false;}

// Death
if(player.health<=0){player.health=0;if(score>highScore){highScore=score;localStorage.setItem(HS_KEY,String(highScore));}state='lose';}
}

function drawShip(x,y,col){ctx.save();ctx.translate(x,y);var ang=Math.atan2(mouse.y-y,mouse.x-x);ctx.rotate(ang);ctx.fillStyle=col;ctx.shadowBlur=15;ctx.shadowColor=col;ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-10,-10);ctx.lineTo(-6,0);ctx.lineTo(-10,10);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.restore();}

function fmtTime(t){var m=Math.floor(t/60),s=Math.floor(t%60);return (m<10?'0':'')+m+':'+(s<10?'0':'')+s;}

function render(){
ctx.fillStyle=COL.bg;ctx.fillRect(0,0,W,H);
// Stars
for(var i=0;i<stars.length;i++){var s=stars[i];ctx.fillStyle='rgba(255,255,255,'+(0.3+s.z*0.2)+')';ctx.fillRect(s.x,s.y,s.s,s.s);}

if(state==='menu'){
ctx.fillStyle=COL.text;ctx.font='bold 48px Courier New';ctx.textAlign='center';ctx.fillText('AFTERIMAGE ASSAULT',W/2,H/2-40);
ctx.font='20px Courier New';ctx.fillStyle=COL.player;ctx.fillText('Click to Start',W/2,H/2+20);
ctx.fillStyle=COL.text;ctx.font='14px Courier New';ctx.fillText('WASD/Arrows: Move | Mouse: Aim | Click: Fire | Space: Dash',W/2,H/2+60);
ctx.fillText('High Score: '+highScore,W/2,H/2+90);
return;}

// Afterimages
for(var i=0;i<afters.length;i++){var a=afters[i];var op=a.life/a.maxlife*0.5;ctx.fillStyle='rgba(46,255,213,'+op+')';ctx.shadowBlur=10;ctx.shadowColor=COL.after;ctx.beginPath();ctx.arc(a.x,a.y,5,0,6.28);ctx.fill();ctx.shadowBlur=0;}

// Bullets
for(var i=0;i<bullets.length;i++){var b=bullets[i];ctx.fillStyle=b.enemy?'#ff5555':COL.bullet;ctx.shadowBlur=8;ctx.shadowColor=b.enemy?'#ff0000':COL.bullet;ctx.beginPath();ctx.arc(b.x,b.y,4,0,6.28);ctx.fill();ctx.shadowBlur=0;}

// Pickups
for(var i=0;i<pickups.length;i++){var p=pickups[i];var c=p.type==='over'?COL.orb:p.type==='rapid'?COL.rapid:COL.shield;ctx.fillStyle=c;ctx.shadowBlur=15;ctx.shadowColor=c;ctx.beginPath();ctx.arc(p.x,p.y,10,0,6.28);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#000';ctx.font='bold 12px Courier New';ctx.textAlign='center';ctx.fillText(p.type==='over'?'O':p.type==='rapid'?'R':'S',p.x,p.y+4);}

// Enemies
for(var i=0;i<enemies.length;i++){var e=enemies[i];if(e.type==='grunt'){ctx.fillStyle=COL.grunt;ctx.shadowBlur=10;ctx.shadowColor=COL.grunt;ctx.save();ctx.translate(e.x,e.y);ctx.beginPath();for(var k=0;k<6;k++){var a=k*1.047;ctx.lineTo(Math.cos(a)*16,Math.sin(a)*16);}ctx.closePath();ctx.fill();ctx.restore();ctx.shadowBlur=0;}
else if(e.type==='drone'){ctx.fillStyle=COL.drone;ctx.beginPath();ctx.arc(e.x,e.y,10,0,6.28);ctx.fill();ctx.fillStyle=COL.droneEye;ctx.beginPath();ctx.arc(e.x,e.y,4,0,6.28);ctx.fill();}
else{ctx.fillStyle=COL.boss;ctx.shadowBlur=20;ctx.shadowColor=COL.boss;ctx.beginPath();ctx.arc(e.x,e.y,35,0,6.28);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(e.x,e.y,12,0,6.28);ctx.fill();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(e.x,e.y,6,0,6.28);ctx.fill();}
// Health bar
if(e.hp<e.maxhp){ctx.fillStyle='#333';ctx.fillRect(e.x-e.w/2,e.y-e.h/2-8,e.w,4);ctx.fillStyle='#0f0';ctx.fillRect(e.x-e.w/2,e.y-e.h/2-8,e.w*(e.hp/e.maxhp),4);}
}

// Player
if(state==='play'||state==='lose'){var blink=player.invuln>0&&Math.floor(player.invuln*10)%2===0;if(!blink){drawShip(player.x,player.y,COL.player);if(player.dashTime>0){addParticles(player.x,player.y,COL.player,1);}}if(player.shield>0){ctx.strokeStyle=COL.shield;ctx.lineWidth=2;ctx.globalAlpha=0.5+Math.sin(performance.now()/100)*0.3;ctx.beginPath();ctx.arc(player.x,player.y,player.r+8,0,6.28);ctx.stroke();ctx.globalAlpha=1;}}

// Particles
for(var i=0;i<particles.length;i++){var p=particles[i];ctx.globalAlpha=Math.max(0,p.life/0.6);ctx.fillStyle=p.col;ctx.fillRect(p.x-2,p.y-2,4,4);ctx.globalAlpha=1;}

// HUD
ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(10,10,200,24);
for(var i=0;i<10;i++){ctx.fillStyle=i<Math.ceil(player.health/10)?COL.player:'#333';ctx.fillRect(12+i*19,12,17,20);}
ctx.fillStyle=COL.text;ctx.font='14px Courier New';ctx.textAlign='left';ctx.fillText('HP',12,48);

// Score/Timer top center
ctx.fillStyle=COL.text;ctx.textAlign='center';ctx.font='bold 18px Courier New';ctx.fillText('SCORE: '+score.toLocaleString()+' | TIME: '+fmtTime(elapsed),W/2,28);

// Speedrun timer top corner
ctx.fillStyle='#ffcc00';ctx.textAlign='right';ctx.font='bold 14px Courier New';ctx.fillText('⏱ '+fmtTime(elapsed),W-12,20);

// Ammo top right
ctx.fillStyle=COL.text;ctx.textAlign='right';ctx.font='14px Courier New';ctx.fillText('AMMO: ∞',W-12,42);

// Dash cd
ctx.fillStyle=COL.text;ctx.textAlign='left';ctx.fillText('DASH: '+(player.dashCd>0?player.dashCd.toFixed(1)+'s':'READY'),12,70);

// Overcharge indicator
if(player.over>0){ctx.fillStyle=COL.orb;ctx.textAlign='center';ctx.font='bold 20px Courier New';ctx.globalAlpha=0.5+Math.sin(performance.now()/100)*0.5;ctx.fillText('⚡ OVERCHARGE '+player.over.toFixed(1)+'s',W/2,55);ctx.globalAlpha=1;}
if(player.rapid>0){ctx.fillStyle=COL.rapid;ctx.textAlign='center';ctx.font='bold 14px Courier New';ctx.fillText('RAPID '+player.rapid.toFixed(1)+'s',W/2,75);}
if(player.shield>0){ctx.fillStyle=COL.shield;ctx.textAlign='center';ctx.font='bold 14px Courier New';ctx.fillText('SHIELD '+player.shield.toFixed(1)+'s',W/2,92);}

// Minimap
ctx.fillStyle='rgba(0,0,0,0.5)';ctx.beginPath();ctx.arc(W-50,H-50,40,0,6.28);ctx.fill();ctx.strokeStyle=COL.text;ctx.stroke();ctx.fillStyle=COL.player;ctx.beginPath();ctx.arc(W-50+(player.x/W-0.5)*70,H-50+(player.y/H-0.5)*70,3,0,6.28);ctx.fill();for(var i=0;i<enemies.length;i++){var e=enemies[i];ctx.fillStyle=e.type==='boss'?COL.boss:'#f44';ctx.fillRect(W-50+(e.x/W-0.5)*70-1,H-50+(e.y/H-0.5)*70-1,3,3);}

// Wave indicator
ctx.fillStyle=COL.text;ctx.textAlign='left';ctx.font='12px Courier New';ctx.fillText('WAVE '+Math.min(wave,5)+(bossActive?' (BOSS)':''),12,H-12);

if(state==='lose'){ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ff2e6e';ctx.font='bold 48px Courier New';ctx.textAlign='center';ctx.fillText('GAME OVER',W/2,H/2-20);ctx.fillStyle=COL.text;ctx.font='20px Courier New';ctx.fillText('Score: '+score+' | High: '+highScore,W/2,H/2+20);ctx.fillText('Click to Restart',W/2,H/2+60);}
if(state==='win'){ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);ctx.fillStyle=COL.player;ctx.font='bold 48px Courier New';ctx.textAlign='center';ctx.fillText('VICTORY!',W/2,H/2-20);ctx.fillStyle=COL.text;ctx.font='20px Courier New';ctx.fillText('Score: '+score+' | High: '+highScore,W/2,H/2+20);ctx.fillText('Time: '+fmtTime(elapsed)+' | Click to Restart',W/2,H/2+60);}
}

var last=performance.now();
function loop(t){var dt=Math.min(0.05,(t-last)/1000);last=t;update(dt);render();requestAnimationFrame(loop);}

canvas.addEventListener('click',function(){if(state==='menu'||state==='lose'||state==='win'){reset();state='play';}});

initStars();
requestAnimationFrame(loop);
})();