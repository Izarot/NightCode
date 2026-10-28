const canvas=document.getElementById('game');const ctx=canvas.getContext('2d');let W=canvas.width=window.innerWidth;let H=canvas.height=window.innerHeight;window.addEventListener('resize',()=>{W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight});

// Core state
const player={x:W/2,y:H/2,vx:0,vy:0,hp:3,ink:1000,maxInk:1000,aimX:0,aimY:0,fire:false,fireT:0,weapon:0,weapons:['ballpoint','fountain','roller','highlighter'],dash:false,dashT:0,dashCD:0};
const trails=[];const enemies=[];const particles=[];const bullets=[];const keys={};
let score=0,wave=1,combo=0,comboT=0,gameTime=0,highScore=0;

// Load high score
const hs=localStorage.getItem('afterimage_hs_v1');if(hs)highScore=parseInt(hs);

// Input
window.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyR'&&player.hp<=0)resetGame()});
window.addEventListener('keyup',e=>{keys[e.code]=false});
window.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();player.aimX=e.clientX-r.left;player.aimY=e.clientY-r.top});
window.addEventListener('mousedown',e=>{if(e.button===0)player.fire=true});
window.addEventListener('mouseup',e=>{if(e.button===0)player.fire=false});
window.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('mousedown',e=>{if(e.button===2)startDash()});

function resetGame(){player.hp=3;player.ink=1000;score=0;wave=1;combo=0;enemies.length=0;trails.length=0;bullets.length=0;particles.length=0;gameTime=0}

function startDash(){if(player.dashCD<=0&&!player.dash){player.dash=true;player.dashT=0.18;player.dashCD=1.2}}

// Audio
const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
function playSound(type,freq=440,dur=0.1){const o=audioCtx.createOscillator();const g=audioCtx.createGain();o.connect(g);g.connect(audioCtx.destination);o.frequency.value=freq;o.type='square';g.gain.setValueAtTime(0.1,0);g.gain.exponentialRampToValueAtTime(0.001,dur);o.start();o.stop(audioCtx.currentTime+dur)}

// Trail segment
function addTrail(x,y,vx,vy,wp){const age=0,maxAge=wp==='fountain'?4:wp==='roller'?6:wp==='highlighter'?10:8,th=wp==='fountain'?14:wp==='roller'?4:wp==='highlighter'?10:8;trails.push({x,y,px:x-vx*0.016,py:y-vy*0.016,age,age0:age,maxAge,th,th0:th,damage:wp==='fountain'?1.5:1,active:true,wp})}

// Bullet
function fire(){if(!player.fire)return;if(player.fireT>0){player.fireT-=1/60;return}player.fireT=1/12;const cost=player.weapon===0?4:player.weapon===1?15:player.weapon===2?0:40;if(player.ink<cost)return;player.ink-=cost;const dx=player.aimX-player.x,dy=player.aimY-player.y;const len=Math.hypot(dx,dy)||1;const spd=600;const vx=dx/len*spd,vy=dy/len*spd;const wp=player.weapons[player.weapon];if(wp==='fountain'){for(let i=-2;i<=2;i++){const a=(i*20)*Math.PI/180;const s=140;const bx=player.x+Math.cos(a)*s,by=player.y+Math.sin(a)*s;bullets.push({x:bx,y:by,vx:Math.cos(a)*spd*0.7,vy:Math.sin(a)*spd*0.7,life:0.6,wp})}}else if(wp==='roller'){const b={x:player.x,y:player.y,vx,vy,life:2,wp:'roller',beam:true};bullets.push(b)}else if(wp==='highlighter'){const a=Math.atan2(dy,dx);bullets.push({x:player.x,y:player.y,vx:Math.cos(a)*200,vy:Math.sin(a)*200,life:1.5,wp:'highlighter',gravity:300})}else{bullets.push({x:player.x,y:player.y,vx,vy,life:1.5,wp})}}}

// Enemy
function spawnEnemy(t){const e={x:0,y:0,vx:0,vy:0,hp:1,maxHp:1,type:t,life:0,wp:'ballpoint'};switch(t){case 0:e.hp=1;e.maxHp=1;e.speed=80;break;case 1:e.hp=1;e.maxHp=1;e.speed=140;break;case 2;e.hp=2;e.maxHp=2;e.speed=100;break;case 3;e.hp=5;e.maxHp=5;e.speed=50;break;case 4;e.hp=3;e.maxHp=3;e.speed=90;break;case 5;e.hp=1;e.maxHp=1;e.speed=200;break;case 6;e.hp=10;e.maxHp=10;e.speed=70;break}switch(t){case 0:case 1:case 2:case 3:case 4:case 5:e.x=Math.random()<0.5?0:W;e.y=Math.random()*H;break;case 6:e.x=Math.random()<0.5?0:W;e.y=Math.random()*H;break}enemies.push(e)}function updateEnemies(dt){for(const e of enemies){const dx=player.x-e.x,dy=player.y-e.y;const dist=Math.hypot(dx,dy)||1;const a=Math.atan2(dy,dx);let spd=e.speed||80;if(e.type===2)spd*=0.8;e.vx=Math.cos(a)*spd*0.3;e.vy=Math.sin(a)*spd*0.3;e.x+=e.vx;e.y+=e.vy;e.life+=dt}}

// Collision
function capsuleVsCapsule(x1,y1,x2,y2,r1,x3,y3,x4,y4,r2){const d1x=x2-x1,d1y=y2-y1;const d2x=x4-x3,d2y=y4-y3;const dx=x1-x3,dy=y1-y3;const a=d1x*d1x+d1y*d1y;b=d1x*d2x+d1y*d2y;c=d2x*d2x+d2y*d2y;e=d2x*dx+d2y*dy;f=d1x*dx+d1y*dy;const k=c*a-b*b;let s,t;if(k<1e-6){s=0;t=e/c;t=Math.max(0,Math.min(1,t))}else{s=(b*e-c*f)/(k);t=(a*e-b*f)/(k);s=Math.max(0,Math.min(1,s));t=Math.max(0,Math.min(1,t))}const px=x1+s*d1x,py=y1+s*d1y;const qx=x3+t*d2x,qy=y3+t*d2y;const dx2=px-qx,dy2=py-qy;return dx2*dx2+dy2*dy2<=r1*r2}function trailHit(e){for(let i=trails.length-1;i>=0;i--){const t=trails[i];if(!t.active)continue;if(capsuleVsCapsule(t.px,t.py,t.x,t.y,t.th/2,e.x,e.y,e.x,e.y,15)){if(t.wp==='tank')continue;return i}}}function updateTrails(dt){for(let i=trails.length-1;i>=0;i--){const t=trails[i];t.age+=dt;if(t.age>t.maxAge*0.75&&t.age<t.maxAge){t.th=t.th0*(1-(t.age-t.maxAge*0.75)/(t.maxAge*0.25));t.damage*=0.5}if(t.age>=t.maxAge)trails.splice(i,1);if(trails.length>2500)trails.shift()}}

// Main loop
function loop(){const dt=1/60;gameTime+=dt;player.fireT-=dt;if(player.dash)player.dashT-=dt;if(player.dashT<=0)player.dash=false;if(player.dashCD>0)player.dashCD-=dt;if(player.ink<player.maxInk)player.ink+=40*dt;if(player.ink>player.maxInk)player.ink=player.maxInk;if(keys['KeyA']||keys['ArrowLeft'])player.vx-=4800*dt;if(keys['KeyD']||keys['ArrowRight'])player.vx+=4800*dt;if(keys['KeyW']||keys['ArrowUp'])player.vy-=4800*dt;if(keys['KeyS']||keys['ArrowDown'])player.vy+=4800*dt;if(!keys['KeyA']&&!keys['ArrowLeft']&&!keys['KeyD']&&!keys['ArrowRight'])player.vx*=0.9;if(!keys['KeyW']&&!keys['ArrowUp']&&!keys['KeyS']&&!keys['ArrowDown'])player.vy*=0.9;const sp=320;if(Math.abs(player.vx)>sp)player.vx=sp*Math.sign(player.vx);if(Math.abs(player.vy)>sp)player.vy=sp*Math.sign(player.vy);player.x+=player.vx*dt;player.y+=player.vy*dt;player.x=Math.max(0,Math.min(W,player.x));player.y=Math.max(0,Math.min(H,player.y));fire();for(const b of bullets){b.life-=dt;if(b.wp==='highlighter')b.vy+=b.gravity*dt;if(b.beam){const dx=b.vx,dy=b.vy;addTrail(player.x,player.y,dx,dy,b.wp)}else{addTrail(b.x,b.y,b.vx,b.vy,b.wp);b.x+=b.vx*dt;b.y+=b.vy*dt}if(b.life<=0){const idx=bullets.indexOf(b);bullets.splice(idx,1)}}updateTrails(dt);updateEnemies(dt);for(const e of enemies){const ti=trailHit(e);if(ti!==undefined){e.hp-=1*dt*10;if(e.hp<=0){enemies.splice(enemies.indexOf(e),1);score+=100*combo;combo+=0.1;comboT=2;particles.push({x:e.x,y:e.y,c:'#00FFFF',n:10});playSound('hit',200+e.type*50,0.1);if(score>highScore){highScore=score;localStorage.setItem('afterimage_hs_v1',highScore.toString())}}}}if(comboT>0)comboT-=dt;if(comboT<=0)combo*=0.98;if(player.dashCD<=0&&keys['ShiftLeft']&&!player.dash)startDash();if(player.dash){player.x+=player.vx*dt*2;player.y+=player.vy*dt*2;const idx=trails.findIndex(t=>capsuleVsCapsule(t.px,t.py,t.x,t.y,t.th/2,player.x,player.y,player.x,player.y,15));if(idx>=0)trails[idx].active=false}render();requestAnimationFrame(loop)}

function render(){ctx.fillStyle='#0A0A12';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#1A1A2E';ctx.lineWidth=1;for(let x=0;x<W;x+=16)for(let y=0;y<H;y+=16){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}// Trails
for(const t of trails){const age=t.age/t.maxAge;const alpha=1-age;const c=t.wp==='fountain'?'#FF00FF':t.wp==='roller'?'#FFFF00':t.wp==='highlighter'?'#00FF88':'#00FFFF';ctx.strokeStyle=c;ctx.globalAlpha=alpha;ctx.lineWidth=t.th;ctx.beginPath();ctx.moveTo(t.px,t.py);ctx.lineTo(t.x,t.y);ctx.stroke()}ctx.globalAlpha=1;for(const b of bullets){ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.arc(b.x,b.y,3,0,Math.PI*2);ctx.fill()}for(const e of enemies){const c=e.type===6?'#FF6600':'#FF3366';ctx.fillStyle=c;ctx.beginPath();ctx.arc(e.x,e.y,15,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#2A2A3E';ctx.lineWidth=2;ctx.stroke()}// Player
ctx.fillStyle=player.dash?'#00FFFF':'#FFFFFF';ctx.beginPath();ctx.arc(player.x,player.y,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#00FFFF';ctx.lineWidth=2;ctx.stroke()// Particles
for(const p of particles){p.n--;ctx.fillStyle=p.c;ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;// HUD
ctx.fillStyle='#FFFFFF';ctx.font='16px monospace';ctx.fillText('WAVE: '+wave,10,20);ctx.fillText('SCORE: '+score,10,40);ctx.fillText('x'+combo.toFixed(1)+' COMBO',W-100,20);ctx.fillStyle='#00FFFF';ctx.font='14px monospace';ctx.fillText('INK: '+Math.floor(player.ink),10,H-20);ctx.fillStyle='#FF3366';for(let i=0;i<player.hp;i++){ctx.beginPath();ctx.arc(20+i*20,H-50,6,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#FFFFFF';ctx.font='16px monospace';ctx.fillText('HIGH SCORE: '+highScore,10,H-80);if(player.hp<=0){ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#FFFFFF';ctx.font='32px monospace';ctx.textAlign='center';ctx.fillText('GAME OVER',W/2,H/2-40);ctx.font='20px monospace';ctx.fillText('SCORE: '+score,W/2,H/2);ctx.fillText('HIGH SCORE: '+highScore,W/2,H/2+30);ctx.fillText('Press R to Restart',W/2,H/2+70);ctx.textAlign='left'}}

resetGame();loop()
