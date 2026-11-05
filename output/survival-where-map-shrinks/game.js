const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
let W,H,DPR;function resize(){DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0)}addEventListener('resize',resize);resize();
// Audio
let AC;function beep(f,d=0.08,type='square',v=0.12){try{AC=AC||new (AudioContext||webkitAudioContext)();let o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(AC.destination);o.start();g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+d);o.stop(AC.currentTime+d)}catch(e){}}
const sfx={shoot:()=>beep(880,.06,'square',.08),hit:()=>beep(180,.1,'sawtooth',.15),pickup:()=>beep(1320,.08,'sine',.12),dash:()=>beep(440,.12,'sine',.1),build:()=>beep(660,.15,'triangle',.12),hurt:()=>beep(90,.2,'sawtooth',.2),boss:()=>beep(55,.4,'sawtooth',.2)};
// High score
let high=+(localStorage.getItem('voidTetherHighScore')||0);document.getElementById('highScore').textContent=high.toFixed(1);
// State
let running=false,elapsed=0,shrinkElapsed=0,pauseShrink=0,bossTimer=90,shake=0,chroma=0;
let player,enemies=[],bullets=[],particles=[],dmgNums=[],turrets=[],hexes=[],boss=null;
let cam={x:0,y:0,zoom:1},keys={},mouse={x:W/2,y:H/2,down:false},joy={x:0,y:0};
const INITIAL=900;
function hexGrid(){hexes=[];let s=38;for(let q=-28;q<=28;q++)for(let r=-28;r<=28;r++){let x=s*1.5*q,y=s*Math.sqrt(3)*(r+q/2);if(Math.hypot(x,y)<INITIAL-20)hexes.push({x,y,q,r,hp:1,type:Math.random()<.4?'scrap':Math.random()<.5?'bio':'alloy',taken:false})}}
function reset(){elapsed=0;shrinkElapsed=0;pauseShrink=0;bossTimer=90;enemies=[];bullets=[];particles=[];dmgNums=[];turrets=[];boss=null;hexGrid();player={x:250,y:0,vx:0,vy:0,hp:1200,maxHp:1200,dashCd:0,dashTime:0,dashDur:.15,turretDmg:20,resist:0,angle:0,inv:0};cam={x:0,y:0,zoom:1};running=true;document.getElementById('overlay').style.display='none';showMsg('SURVIVE THE TETHER!')}
function safeRadius(){let mult=Math.pow(2,Math.floor(elapsed/90));let eff=shrinkElapsed*(1-player.resist*0.05);return Math.max(60,INITIAL*Math.pow(0.985,eff*mult))}
function showMsg(t){let m=document.getElementById('msg');m.textContent=t;setTimeout(()=>m.textContent='',2200)}
function spawnEnemy(isBoss=false){let R=safeRadius();let a=Math.random()*Math.PI*2;let d=isBoss?R*0.7:R*0.95;enemies.push({x:Math.cos(a)*d,y:Math.sin(a)*d,vx:0,vy:0,hp:isBoss?2500:120,maxHp:isBoss?2500:120,boss:isBoss,r:isBoss?42:20,dmg:isBoss?60:18,hitCd:0})}
function addDmg(x,y,txt,color='#ff2ec4'){dmgNums.push({x,y,txt,color,life:1,vy:-60})}
function burst(x,y,color,n=14){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*300,vy:(Math.random()-.5)*300,life:1,color,size:2+Math.random()*4})}
// Input
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key===' ') {e.preventDefault();doDash()} if(e.key.toLowerCase()==='e')harvest(); if(e.key.toLowerCase()==='b')buildTurret()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
canvas.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY});
canvas.addEventListener('mousedown',()=>mouse.down=true);addEventListener('mouseup',()=>mouse.down=false);
canvas.addEventListener('touchstart',e=>{e.preventDefault()},{passive:false});
function doDash(){if(!running||player.dashCd>0)return;player.dashTime=player.dashDur;player.dashCd=2;player.vx*=2.5;player.vy*=2.5;sfx.dash();burst(player.x,player.y,'#00f5ff',10)}
function harvest(){if(!running)return;let best=null,bd=70;hexes.forEach(h=>{if(h.taken)return;let d=Math.hypot(h.x-player.x,h.y-player.y);if(d<bd){bd=d;best=h}});if(best){best.taken=true;if(best.type==='scrap')res.scrap+=5;else if(best.type==='bio')res.bio+=5;else res.alloy+=3;sfx.pickup();burst(best.x,best.y,'#b6ff00',12);addDmg(best.x,best.y,'+'+best.type,'#b6ff00')}else showMsg('No hex in range')}
let res={scrap:50,bio:20,alloy:10};
function buildTurret(){if(!running)return;if(res.scrap<30){showMsg('Need 30 scrap');return}let best=null,bd=90;hexes.forEach(h=>{let d=Math.hypot(h.x-player.x,h.y-player.y);if(d<bd){bd=d;best=h}});if(!best){showMsg('Move near a hex');return}res.scrap-=30;turrets.push({x:best.x,y:best.y,hp:300,maxHp:300,cd:0});sfx.build();showMsg('Turret built!')}
document.getElementById('btnDash').onclick=doDash;document.getElementById('btnBuild').onclick=buildTurret;document.getElementById('btnHarvest').onclick=harvest;
document.getElementById('btnShoot').onclick=()=>{mouse.down=true;setTimeout(()=>mouse.down=false,120)};
document.getElementById('startBtn').onclick=()=>{res={scrap:50,bio:20,alloy:10};reset()};
document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{let u=b.dataset.up;if(u==='dash'&&res.bio>=10){res.bio-=10;player.dashDur+=.05;showMsg('Dash duration up')}else if(u==='hp'&&res.alloy>=10){res.alloy-=10;player.maxHp+=200;player.hp+=200;showMsg('Max HP up')}else if(u==='turret'&&res.scrap>=15){res.scrap-=15;player.turretDmg+=10;showMsg('Turret dmg up')}else if(u==='resist'&&res.bio>=20){res.bio-=20;player.resist++;showMsg('Shrink resist up')}else showMsg('Not enough materials')});
// Joystick
let joyEl=document.getElementById('joystick'),stick=document.getElementById('stick');
joyEl.addEventListener('touchmove',e=>{let t=e.touches[0],r=joyEl.getBoundingClientRect();let dx=t.clientX-(r.left+55),dy=t.clientY-(r.top+55);let m=Math.hypot(dx,dy)||1;joy.x=Math.max(-1,Math.min(1,dx/40));joy.y=Math.max(-1,Math.min(1,dy/40));stick.style.transform=`translate(${joy.x*30}px,${joy.y*30}px)`},{passive:true});
joyEl.addEventListener('touchend',()=>{joy.x=joy.y=0;stick.style.transform='' });
let last=performance.now(),spawnT=0,shootCd=0;
function update(dt){if(!running)return;elapsed+=dt;if(pauseShrink>0)pauseShrink-=dt;else shrinkElapsed+=dt;
 bossTimer-=dt;if(bossTimer<=0){bossTimer=90;spawnEnemy(true);sfx.boss();showMsg('⚠ BOSS HULK! Shrink doubled!')}
 spawnT-=dt;if(spawnT<=0){spawnT=Math.max(.6,2.2-elapsed/120);spawnEnemy(false)}
 // player movement
 let ix=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0)+joy.x;
 let iy=(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0)+joy.y;
 let m=Math.hypot(ix,iy);if(m>1){ix/=m;iy/=m}
 const ACC=2400,MAX=320;
 player.vx+=ix*ACC*dt;player.vy+=iy*ACC*dt;
 // gravity well toward center
 let pd=Math.hypot(player.x,player.y)||1;player.vx-=player.x/pd*90*dt;player.vy-=player.y/pd*90*dt;
 let fr=Math.pow(0.88,dt*60);player.vx*=fr;player.vy*=fr;
 let sp=Math.hypot(player.vx,player.vy);if(sp>MAX* (player.dashTime>0?2.5:1)){player.vx=player.vx/sp*MAX*(player.dashTime>0?2.5:1);player.vy=player.vy/sp*MAX*(player.dashTime>0?2.5:1)}
 player.x+=player.vx*dt;player.y+=player.vy*dt;
 if(player.dashCd>0)player.dashCd-=dt;if(player.dashTime>0)player.dashTime-=dt;if(player.inv>0)player.inv-=dt;
 player.angle=Math.atan2(mouse.y-H/2,mouse.x-W/2);
 // void death
 if(Math.hypot(player.x,player.y)>safeRadius()){gameOver('Consumed by the Void');return}
 // shooting
 shootCd-=dt;if(mouse.down&&shootCd<=0){shootCd=.18;let wx=cam.x+(mouse.x-W/2)/cam.zoom,wy=cam.y+(mouse.y-H/2)/cam.zoom;let a=Math.atan2(wy-player.y,wx-player.x);bullets.push({x:player.x,y:player.y,vx:Math.cos(a)*520,vy:Math.sin(a)*520,life:1.2});sfx.shoot()}
 // bullets with gravity curve
 bullets.forEach(b=>{let d=Math.hypot(b.x,b.y)||1;b.vx-=b.x/d*60*dt;b.vy-=b.y/d*60*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;enemies.forEach(e=>{if(Math.hypot(b.x-e.x,b.y-e.y)<e.r+4){e.hp-=35;b.life=0;sfx.hit();burst(e.x,e.y,'#ff2ec4',8);addDmg(e.x,e.y,'35')}})});bullets=bullets.filter(b=>b.life>0);
 // enemies
 enemies.forEach(e=>{let a=Math.atan2(player.y-e.y,player.x-e.x);e.vx+=Math.cos(a)*600*dt;e.vy+=Math.sin(a)*600*dt;let s=Math.hypot(e.vx,e.vy),mx=e.boss?140:180;if(s>mx){e.vx=e.vx/s*mx;e.vy=e.vy/s*mx}e.x+=e.vx*dt;e.y+=e.vy*dt;e.hitCd-=dt;
  if(Math.hypot(e.x-player.x,e.y-player.y)<e.r+16&&e.hitCd<=0){e.hitCd=.6;player.hp-=e.dmg;player.inv=.3;chroma=1;shake=8;sfx.hurt();burst(player.x,player.y,'#ff2e63',12);addDmg(player.x,player.y,'-'+e.dmg,'#ff2e63')}
  // turrets damage boss only? turrets target enemies
  turrets.forEach(t=>{if(e.boss&&Math.hypot(e.x-t.x,e.y-t.y)<e.r+10){t.hp-=20}});
 });
 enemies.forEach(e=>{if(e.hp<=0){burst(e.x,e.y,e.boss?'#ffb300':'#ff2ec4',e.boss?40:16);res.scrap+=e.boss?50:8;res.bio+=e.boss?20:3;if(e.boss){pauseShrink=15;boss=null;showMsg('BOSS DOWN! Shrink paused 15s');sfx.build()}addDmg(e.x,e.y,'+scrap','#b6ff00')}});
 enemies=enemies.filter(e=>e.hp>0);boss=enemies.find(e=>e.boss)||null;
 // turrets shoot
 turrets.forEach(t=>{t.cd-=dt;let target=enemies[0],bd=9999;enemies.forEach(e=>{let d=Math.hypot(e.x-t.x,e.y-t.y);if(d<bd){bd=d;target=e}});if(target&&bd<320&&t.cd<=0){t.cd=.5;target.hp-=player.turretDmg;addDmg(target.x,target.y,player.turretDmg,'#00f5ff');burst(target.x,target.y,'#00f5ff',4)}});
 turrets=turrets.filter(t=>t.hp>0);
 // particles swirl into black hole
 if(Math.random()<.6){let a=Math.random()*Math.PI*2,d=80+Math.random()*200;particles.push({x:Math.cos(a)*d,y:Math.sin(a)*d,vx:-Math.cos(a)*80-Math.sin(a)*60,vy:-Math.sin(a)*80+Math.cos(a)*60,life:1,color:Math.random()<.5?'#00f5ff':'#ff2ec4',size:2})}
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt*1.2});particles=particles.filter(p=>p.life>0);
 dmgNums.forEach(d=>{d.y+=d.vy*dt;d.life-=dt});dmgNums=dmgNums.filter(d=>d.life>0);
 if(player.hp<=0)gameOver('Killed by Hulks');
 // camera
 cam.x+=(player.x-cam.x)*0.1;cam.y+=(player.y-cam.y)*0.1;
 let targetZoom=Math.min(1.2,Math.max(.45,Math.min(W,H)/ (safeRadius()*1.4)));
 cam.zoom+=(targetZoom-cam.zoom)*0.05;
 if(shake>0)shake-=dt*20;if(chroma>0)chroma-=dt*2;
 updateHUD();
}
function fmt(t){let m=Math.floor(t/60),s=t%60;return String(m).padStart(2,'0')+':'+s.toFixed(1).padStart(4,'0')}
function updateHUD(){document.getElementById('timer').textContent='⏱ '+fmt(elapsed);
 document.getElementById('scrap').textContent=res.scrap;document.getElementById('bio').textContent=res.bio;document.getElementById('alloy').textContent=res.alloy;
 document.getElementById('hpFill').style.width=Math.max(0,player.hp/player.maxHp*100)+'%';document.getElementById('hpText').textContent=Math.ceil(player.hp)+'/'+player.maxHp;
 document.getElementById('dashInfo').textContent=player.dashCd<=0?'DASH READY':'DASH '+player.dashCd.toFixed(1);
 let pct=safeRadius()/INITIAL*100;let arc=document.getElementById('tetherArc');arc.style.strokeDashoffset=188*(1-pct/100);arc.style.stroke=pct>50?'#00f5ff':pct>25?'#ffb300':'#ff2e63';document.getElementById('tetherPct').textContent=pct.toFixed(0)+'%';
 document.getElementById('turretCount').textContent=turrets.length;document.getElementById('turretList').innerHTML=turrets.map(t=>`<div>🗼 <span style="display:inline-block;width:60px;height:6px;background:#222"><span style="display:block;height:100%;width:${t.hp/t.maxHp*100}%;background:#b6ff00"></span></span></div>`).join('');
 document.getElementById('vignette').style.boxShadow=`inset 0 0 ${80+(100-pct)}px ${20+(100-pct)/2}px rgba(0,0,0,.9)`;
 document.getElementById('lowVignette').style.borderColor=player.hp/player.maxHp<.3?`rgba(255,0,60,${.5+Math.sin(elapsed*6)*.3})`:'transparent';
 let bb=document.getElementById('bossBar');if(boss){bb.classList.remove('hidden');document.getElementById('bossFill').style.width=boss.hp/boss.maxHp*100+'%'}else bb.classList.add('hidden');
}
function gameOver(reason){running=false;let score=elapsed;if(score>high){high=score;localStorage.setItem('voidTetherHighScore',high)}document.getElementById('highScore').textContent=high.toFixed(1);document.getElementById('finalScore').innerHTML=`${reason}<br>Survived <b>${fmt(score)}</b> • High Score: ${high.toFixed(1)}s`;document.getElementById('overlay').style.display='flex';document.getElementById('startBtn').textContent='↻ RUN AGAIN';sfx.hurt()}
function draw(){ctx.fillStyle='#0a0018';ctx.fillRect(0,0,W,H);
 let sx=(Math.random()-.5)*shake,sy=(Math.random()-.5)*shake;
 ctx.save();ctx.translate(W/2+sx,H/2+sy);ctx.scale(cam.zoom,cam.zoom);ctx.translate(-cam.x,-cam.y);
 let R=safeRadius();
 // hexes
 hexes.forEach(h=>{if(h.taken)return;let d=Math.hypot(h.x,h.y);ctx.beginPath();for(let i=0;i<6;i++){let a=Math.PI/3*i+Math.PI/6;let x=h.x+Math.cos(a)*30,y=h.y+Math.sin(a)*30;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fillStyle=d>R?'#000':h.type==='scrap'?'rgba(255,179,0,.25)':h.type==='bio'?'rgba(182,255,0,.25)':'rgba(0,245,255,.25)';ctx.fill();ctx.strokeStyle=d>R?'#111':'#7b2fff';ctx.stroke()});
 // safe zone border pulsing
 ctx.beginPath();ctx.arc(0,0,R,0,Math.PI*2);ctx.strokeStyle=`rgba(0,245,255,${.6+Math.sin(elapsed*3)*.3})`;ctx.lineWidth=4;ctx.shadowColor='#00f5ff';ctx.shadowBlur=20;ctx.stroke();ctx.shadowBlur=0;
 // void outside
 ctx.beginPath();ctx.arc(0,0,R,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,0)';
 // black hole accretion disk particles
 for(let i=0;i<60;i++){let a=elapsed*1.5+i/60*Math.PI*2;let d=55+Math.sin(i)*8;let x=Math.cos(a)*d,y=Math.sin(a)*d*0.35;ctx.fillStyle=i<30?'#00f5ff':'#ff2e63';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill()}
 ctx.beginPath();ctx.arc(0,0,42,0,Math.PI*2);ctx.fillStyle='#000';ctx.fill();ctx.strokeStyle='#7b2fff';ctx.lineWidth=3;ctx.stroke();
 // particles
 particles.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size)});ctx.globalAlpha=1;
 // turrets
 turrets.forEach(t=>{ctx.fillStyle='#b6ff00';ctx.fillRect(t.x-10,t.y-10,20,20);ctx.fillStyle='#0a0018';ctx.fillRect(t.x-4,t.y-4,8,8)});
 // enemies
 enemies.forEach(e=>{ctx.fillStyle=e.boss?'#ffb300':'#ff2ec4';ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(e.x,e.y,e.r*.5,0,Math.PI*2);ctx.fill();if(e.boss){ctx.fillStyle='#fff';ctx.font='12px monospace';ctx.fillText('BOSS',e.x-15,e.y-50)}});
 // bullets
 ctx.fillStyle='#00f5ff';bullets.forEach(b=>{ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill()});
 // player
 if(player){ctx.save();ctx.translate(player.x,player.y);
ctx.rotate(player.angle);ctx.fillStyle='#00f5ff';ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-12,12);ctx.lineTo(-6,0);ctx.lineTo(-12,-12);ctx.closePath();ctx.fill();ctx.restore();
if(player.inv>0&&Math.floor(elapsed*10)%2===0){ctx.strokeStyle='#fff';ctx.beginPath();ctx.arc(player.x,player.y,20,0,Math.PI*2);ctx.stroke()}
}
dmgNums.forEach(d=>{ctx.globalAlpha=d.life;ctx.fillStyle=d.color;ctx.font='bold 14px monospace';ctx.fillText(d.txt,d.x,d.y)});ctx.globalAlpha=1;
ctx.restore();
if(chroma>0){ctx.fillStyle=`rgba(255,0,80,${chroma*0.15})`;ctx.fillRect(0,0,W,H)}
}
function loop(now){let dt=Math.min(0.033,(now-last)/1000);last=now;update(dt);draw();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
