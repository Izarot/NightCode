const CVS_W=800, CVS_H=800, HALF_W=CVS_W/2, HALF_H=CVS_H/2;
const canvas=document.getElementById('game'), ctx=canvas.getContext('2d');
let scale=1, offsetX=0, offsetY=0;
function resize(){scale=Math.min(window.innerWidth/CVS_W, window.innerHeight/CVS_H);canvas.width=CVS_W*scale;canvas.height=CVS_H*scale;offsetX=(window.innerWidth-CVS_W*scale)/2;offsetY=(window.innerHeight-CVS_H*scale)/2;canvas.style.width=`${CVS_W*scale}px`;canvas.style.height=`${CVS_H*scale}px`;}
window.addEventListener('resize',resize);resize();

const AudioCtx=window.AudioContext||window.webkitAudioContext;const actx=new AudioCtx();
function beep(freq,type,time,vol=0.1){if(!actx)return;const o=actx.createOscillator(),g=actx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(actx.destination);o.start();o.stop(actx.currentTime+time);}
function sfxShoot(){beep(440,'square',0.05,0.05);beep(880,'square',0.03,0.03);}
function sfxHit(){beep(200,'sawtooth',0.1,0.1);}
function sfxRotate(){beep(100,'sine',0.3,0.2);}
function sfxPowerup(){beep(600,'triangle',0.1,0.1);beep(1200,'triangle',0.1,0.1);}

const keys={}, mouse={x:0,y:0,down:false};
window.addEventListener('keydown',e=>keys[e.code]=true);
window.addEventListener('keyup',e=>keys[e.code]=false);
canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();mouse.x=(e.clientX-r.left)/scale;mouse.y=(e.clientY-r.top)/scale;});
canvas.addEventListener('mousedown',()=>mouse.down=true);
canvas.addEventListener('mouseup',()=>mouse.down=false);
canvas.addEventListener('touchmove',e=>{e.preventDefault();const t=e.touches[0],r=canvas.getBoundingClientRect();mouse.x=(t.clientX-r.left)/scale;mouse.y=(t.clientY-r.top)/scale;},{passive:false});
canvas.addEventListener('touchstart',e=>{e.preventDefault();mouse.down=true;});
canvas.addEventListener('touchend',()=>mouse.down=false);

const COL={bg:'#050508',grid:'#0a1a2a',edge:'#00ffff',player:'#00ffff',bullet:'#ffff00',drone:'#ff6600',tank:'#ff0044',hp:'#00ff44',rf:'#ffaa00',sh:'#ff00ff',particle:'#ffff88',text:'#ffffff',hudBg:'rgba(0,0,0,0.6)',hudBorder:'#00ffff'};

let highScore=parseInt(localStorage.getItem('cubeRotorHS'))||0;
let score=0, timeSurvived=0, gameOver=false;
let shake=0, shakeX=0, shakeY=0;

class Vec{constructor(x=0,y=0){this.x=x;this.y=y}add(v){this.x+=v.x;this.y+=v.y;return this}sub(v){this.x-=v.x;this.y-=v.y;return this}scale(s){this.x*=s;this.y*=s;return this}len(){return Math.hypot(this.x,this.y)}norm(){const l=this.len();if(l)return this.scale(1/l);return this}clone(){return new Vec(this.x,this.y)}rotate(a){const c=Math.cos(a),s=Math.sin(a);const x=this.x*c-this.y*s;const y=this.x*s+this.y*c;this.x=x;this.y=y;return this}static lerp(a,b,t){return new Vec(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t)}static fromAngle(a){return new Vec(Math.cos(a),Math.sin(a))}}

const ROT_CYCLE=8000, ROT_WARN=1500, ROT_DUR=500;
let rotAngle=0, rotTarget=0, rotTimer=ROT_CYCLE, rotState='idle', rotProgress=0;
const spawnAnchors=[new Vec(-HALF_W,-HALF_H),new Vec(HALF_W,-HALF_H),new Vec(HALF_W,HALF_H),new Vec(-HALF_W,HALF_H)];

const player={pos:new Vec(0,0),vel:new Vec(0,0),radius:12,hp:100,maxHp:100,speed:320,accel:1500,fric:0.85,fireRate:150,fireTimer:0,spread:false,spreadTimer:0,shield:0,shieldTimer:0,trail:[]};
const bullets=[], enemies=[], particles=[], powerups=[], notifications=[];

function spawnEnemy(){if(enemies.length>30)return;const side=Math.floor(Math.random()*4);const anchor=spawnAnchors[side].clone().rotate(rotAngle);const type=Math.random()<0.7?'drone':'tank';
enemies.push({pos:anchor,type,hp:type==='drone'?20:80,maxHp:type==='drone'?20:80,speed:type==='drone'?180:80,size:type==='drone'?10:18,angle:0,fireTimer:type==='tank'?1000:0,wobble:Math.random()*Math.PI*2});}
function spawnPowerup(x,y){const t=['hp','rf','sh'][Math.floor(Math.random()*3)];powerups.push({pos:new Vec(x,y),type,timer:10000,bob:Math.random()*Math.PI*2});}
function addParticles(x,y,col,count,speed){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2;particles.push({pos:new Vec(x,y),vel:Vec.fromAngle(a).scale(Math.random()*speed),life:0.5+Math.random()*0.5,col,size:2+Math.random()*3});}}
function addNotif(text,col='#0ff'){notifications.push({text,col,life:1,y:0});}

function worldToLocal(v){return v.clone().rotate(-rotAngle);}
function localToWorld(v){return v.clone().rotate(rotAngle);}
function clampPlayer(){const local=worldToLocal(player.pos);const m=HALF_W-player.radius;local.x=Math.max(-m,Math.min(m,local.x));local.y=Math.max(-m,Math.min(m,local.y));player.pos=localToWorld(local);}

function update(dt){
 if(gameOver)return;
 timeSurvived+=dt;
 rotTimer-=dt;
 if(rotTimer<=ROT_WARN && rotState==='idle'){rotState='warn';}
 if(rotTimer<=0 && rotState!=='rotating'){rotState='rotating';rotProgress=0;rotTarget=rotAngle+Math.PI/2;sfxRotate();shake=8;}
 if(rotState==='rotating'){rotProgress+=dt/ROT_DUR;if(rotProgress>=1){rotProgress=1;rotAngle=rotTarget;rotState='idle';rotTimer=ROT_CYCLE;}else{rotAngle=rotAngle+(rotTarget-rotAngle)*0.2;}}
 
 if(shake>0){shakeX=(Math.random()-0.5)*shake;shakeY=(Math.random()-0.5)*shake;shake*=0.9;if(shake<0.5)shake=0;}
 
 const input=new Vec(0,0);if(keys['KeyW']||keys['ArrowUp'])input.y-=1;if(keys['KeyS']||keys['ArrowDown'])input.y+=1;if(keys['KeyA']||keys['ArrowLeft'])input.x-=1;if(keys['KeyD']||keys['ArrowRight'])input.x+=1;
 if(input.len()>0){input.norm().scale(player.accel*dt);player.vel.add(input);}
 else{player.vel.scale(Math.pow(player.fric,dt*60));}
 if(player.vel.len()>player.speed)player.vel.norm().scale(player.speed);
 player.pos.add(player.vel.clone().scale(dt));
 clampPlayer();
 
 player.trail.unshift(player.pos.clone());if(player.trail.length>8)player.trail.pop();
 
 const aim=Vec.fromAngle(Math.atan2(mouse.y-HALF_H,mouse.x-HALF_W));
 player.fireTimer-=dt;
 if(mouse.down && player.fireTimer<=0){sfxShoot();const count=player.spread?3:1;for(let i=0;i<count;i++){const a=aim.rotate((i-1)*0.087);bullets.push({pos:player.pos.clone().add(a.clone().scale(player.radius+5)),vel:a.clone().scale(600),life:1.5,dmg:10});}player.fireTimer=player.fireRate;}
 
 if(player.spreadTimer>0){player.spreadTimer-=dt;if(player.spreadTimer<=0){player.spread=false;addNotif('RAPID FIRE ENDED',COL.rf);}}
 if(player.shieldTimer>0){player.shieldTimer-=dt;if(player.shieldTimer<=0){player.shield=0;addNotif('SHIELD LOST',COL.sh);}}
 
 for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.pos.add(b.vel.clone().scale(dt));b.life-=dt;const local=worldToLocal(b.pos);if(b.life<=0||Math.abs(local.x)>HALF_W||Math.abs(local.y)>HALF_H){bullets.splice(i,1);continue;}
 for(let j=enemies.length-1;j>=0;j--){const e=enemies[j];if(b.pos.clone().sub(e.pos).len()<e.size+4){e.hp-=b.dmg;addParticles(b.pos.x,b.pos.y,COL.particle,5,100);bullets.splice(i,1);if(e.hp<=0){score+=e.type==='drone'?50:200;addNotif(`+${e.type==='drone'?50:200}`,COL.text);sfxHit();addParticles(e.pos.x,e.pos.y,e.type==='drone'?COL.drone:COL.tank,15,200);if(Math.random()<0.3)spawnPowerup(e.pos.x,e.pos.y);enemies.splice(j,1);}break;}}}
 
 for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];const toPlayer=player.pos.clone().sub(e.pos);const dist=toPlayer.len();if(e.type==='drone'){if(dist>0){toPlayer.norm().scale(e.speed*dt);e.pos.add(toPlayer);}}else{e.wobble+=dt*3;const perp=new Vec(-toPlayer.y,toPlayer.x).norm().scale(Math.sin(e.wobble)*40*dt);const forward=toPlayer.clone().norm().scale(e.speed*dt);e.pos.add(forward).add(perp);e.fireTimer-=dt;if(e.fireTimer<=0 && dist<500){sfxShoot();bullets.push({pos:e.pos.clone(),vel:toPlayer.clone().norm().scale(400),life:2,dmg:15,enemy:true});e.fireTimer=2000;}}
 clampEnemy(e);
 if(dist<player.radius+e.size){if(player.shield>0){player.shield--;addParticles(player.pos.x,player.pos.y,COL.sh,10,150);}else{player.hp-=e.type==='drone'?10:25;shake=6;addParticles(player.pos.x,player.pos.y,COL.drone,10,150);if(player.hp<=0){gameOver=true;if(score>highScore){highScore=score;localStorage.setItem('cubeRotorHS',highScore);}}}}}
 
 for(let i=powerups.length-1;i>=0;i--){const p=powerups[i];p.timer-=dt;p.bob+=dt*5;p.pos.y+=Math.sin(p.bob)*0.5;if(player.pos.clone().sub(p.pos).len()<player.radius+12){sfxPowerup();if(p.type==='hp'){player.hp=Math.min(player.maxHp,player.hp+30);addNotif('HEALTH +30',COL.hp);}else if(p.type==='rf'){player.spread=true;player.spreadTimer=5000;player.fireRate=80;addNotif('RAPID FIRE!',COL.rf);}else{player.shield=3;player.shieldTimer=5000;addNotif('SHIELD ACTIVE',COL.sh);}powerups.splice(i,1);}else if(p.timer<=0){powerups.splice(i,1);}}
 
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.pos.add(p.vel.clone().scale(dt));p.life-=dt;p.vel.scale(0.98);if(p.life<=0)particles.splice(i,1);}
 for(let i=notifications.length-1;i>=0;i--){notifications[i].life-=dt;notifications[i].y-=dt*30;if(notifications[i].life<=0)notifications.splice(i,1);}
 
 if(Math.random()<0.01)spawnEnemy();
}
function clampEnemy(e){const local=worldToLocal(e.pos);const m=HALF_W-e.size;local.x=Math.max(-m,Math.min(m,local.x));local.y=Math.max(-m,Math.min(m,local.y));e.pos=localToWorld(local);}

function draw(){
 ctx.setTransform(scale,0,0,scale,offsetX+shakeX,offsetY+shakeY);
 ctx.clearRect(0,0,CVS_W,CVS_H);
 ctx.fillStyle=COL.bg;ctx.fillRect(0,0,CVS_W,CVS_H);
 
 ctx.save();ctx.translate(HALF_W,HALF_H);ctx.rotate(rotAngle);
 ctx.strokeStyle=COL.grid;ctx.lineWidth=1;ctx.globalAlpha=0.3;
 for(let i=-4;i<=4;i++){const p=i*100;ctx.beginPath();ctx.moveTo(p,-HALF_H);ctx.lineTo(p,HALF_H);ctx.stroke();ctx.beginPath();ctx.moveTo(-HALF_W,p);ctx.lineTo(HALF_W,p);ctx.stroke();}
 ctx.globalAlpha=1;
 ctx.strokeStyle=COL.edge;ctx.lineWidth=4;ctx.strokeRect(-HALF_W,-HALF_H,CVS_W,CVS_H);
 ctx.setLineDash([20,20]);ctx.lineWidth=1;ctx.strokeStyle=COL.edge;ctx.globalAlpha=0.5;ctx.beginPath();ctx.moveTo(0,-HALF_H);ctx.lineTo(0,HALF_H);ctx.moveTo(-HALF_W,0);ctx.lineTo(HALF_W,0);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
 ctx.restore();
 
 for(const p of particles){ctx.globalAlpha=p.life;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.pos.x,p.pos.y,p.size,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
 
 for(const b of bullets){ctx.fillStyle=b.enemy?COL.tank:COL.bullet;ctx.beginPath();ctx.arc(b.pos.x,b.pos.y,3,0,Math.PI*2);ctx.fill();}
 
 for(const p of powerups){ctx.save();ctx.translate(p.pos.x,p.pos.y);ctx.rotate(Date.now()/500);ctx.strokeStyle=p.type==='hp'?COL.hp:p.type==='rf'?COL.rf:COL.sh;ctx.lineWidth=3;ctx.beginPath();if(p.type==='hp'){ctx.moveTo(0,-10);ctx.lineTo(8,8);ctx.lineTo(-8,8);ctx.closePath();}else if(p.type==='rf'){ctx.rect(-8,-8,16,16);}else{ctx.moveTo(0,-10);for(let i=0;i<6;i++)ctx.lineTo(Math.sin(i*Math.PI/3)*10,-Math.cos(i*Math.PI/3)*10);ctx.closePath();}ctx.stroke();ctx.restore();}
 
 for(const e of enemies){ctx.save();ctx.translate(e.pos.x,e.pos.y);ctx.strokeStyle=e.type==='drone'?COL.drone:COL.tank;ctx.lineWidth=2;ctx.beginPath();if(e.type==='drone'){ctx.moveTo(0,-e.size);ctx.lineTo(e.size*0.8,e.size);ctx.lineTo(-e.size*0.8,e.size);ctx.closePath();}else{ctx.moveTo(0,-e.size);for(let i=0;i<6;i++)ctx.lineTo(Math.sin(i*Math.PI/3)*e.size,-Math.cos(i*Math.PI/3)*e.size);ctx.closePath();}ctx.stroke();ctx.fillStyle=e.type==='drone'?COL.drone:COL.tank;ctx.globalAlpha=0.1;ctx.fill();ctx.globalAlpha=1;if(e.hp<e.maxHp){ctx.fillStyle='#333';ctx.fillRect(-e.size,-e.size-10,e.size*2,4);ctx.fillStyle='#f44';ctx.fillRect(-e.size,-e.size-10,e.size*2*(e.hp/e.maxHp),4);}ctx.restore();}
 
 ctx.save();ctx.translate(player.pos.x,player.pos.y);
 for(let i=0;i<player.trail.length;i++){const t=player.trail[i];ctx.globalAlpha=0.1*(1-i/player.trail.length);ctx.fillStyle=COL.player;ctx.beginPath();ctx.arc(t.x-player.pos.x,t.y-player.pos.y,player.radius*(1-i/player.trail.length),0,Math.PI*2);ctx.fill();}
 ctx.globalAlpha=1;ctx.strokeStyle=COL.player;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,player.radius,0,Math.PI*2);ctx.stroke();
 if(player.shield>0){ctx.strokeStyle=COL.sh;ctx.lineWidth=2;ctx.globalAlpha=0.5+Math.sin(Date.now()/100)*0.3;ctx.beginPath();ctx.arc(0,0,player.radius+5,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 ctx.restore();
 
 drawHUD();
 if(gameOver)drawGameOver();
}

function drawHUD(){
 ctx.setTransform(scale,0,0,scale,offsetX,offsetY);
 ctx.font='14px JetBrains Mono';
 ctx.fillStyle=COL.text;
 ctx.fillText(`SCORE: ${score}`,20,30);
 ctx.fillText(`HIGH: ${highScore}`,20,50);
 ctx.fillText(`TIME: ${(timeSurvived/1000).toFixed(1)}s`,20,70);
 
 const hpW=200,hpH=16;ctx.fillStyle=COL.hudBg;ctx.fillRect(20,CVS_H-40,hpW,hpH);ctx.fillStyle=player.hp>25?COL.hp:'#ff0000';ctx.fillRect(20,CVS_H-40,hpW*Math.max(0,player.hp/player.maxHp),hpH);ctx.strokeStyle=COL.hudBorder;ctx.strokeRect(20,CVS_H-40,hpW,hpH);ctx.fillStyle=COL.text;ctx.fillText(`HP: ${Math.max(0,player.hp)}`,25,CVS_H-28);
 
 const cx=CVS_W/2, cy=40, r=18;
 const pct=rotState==='idle'?rotTimer/ROT_CYCLE:rotState==='warn'?rotTimer/ROT_WARN:1-rotProgress;
 ctx.strokeStyle=rotState==='warn'?'#f44':COL.edge;ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+Math.PI*2*pct);ctx.stroke();
 ctx.fillStyle=rotState==='warn'?'#f44':COL.edge;ctx.beginPath();ctx.arc(cx,cy,4,0,Math.PI*2);ctx.fill();
 if(rotState==='warn'){ctx.fillStyle='#f44';ctx.font='bold 12px JetBrains Mono';ctx.textAlign='center';ctx.fillText('ROTATION IMMINENT',cx,cy+r+20);ctx.textAlign='left';}
 
 ctx.fillStyle=COL.hudBg;ctx.fillRect(CVS_W-160,20,140,50);ctx.strokeStyle=COL.hudBorder;ctx.strokeRect(CVS_W-160,20,140,50);
 ctx.fillStyle=COL.text;ctx.fillText(`AMMO: ∞`,CVS_W-150,45);
 ctx.fillText(player.spread?'RAPID FIRE':player.shield?'SHIELD':'NORMAL',CVS_W-150,65);
 
 ctx.strokeStyle=COL.text;ctx.lineWidth=1;const mx=mouse.x, my=mouse.y;ctx.beginPath();ctx.arc(mx,my,15,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(mx-20,my);ctx.lineTo(mx-8,my);ctx.moveTo(mx+8,my);ctx.lineTo(mx+20,my);ctx.moveTo(mx,my-20);ctx.lineTo(mx,my-8);ctx.moveTo(mx,my+8);ctx.lineTo(mx,my+20);ctx.stroke();
 
 for(const n of notifications){ctx.globalAlpha=n.life;ctx.fillStyle=n.col;ctx.font='bold 16px JetBrains Mono';ctx.fillText(n.text,CVS_W-200+n.y,CVS_H/2);}ctx.globalAlpha=1;
}

function drawGameOver(){ctx.setTransform(scale,0,0,scale,offsetX,offsetY);ctx.fillStyle='rgba(0,0,0,0.8)';ctx.fillRect(0,0,CVS_W,CVS_H);ctx.fillStyle=COL.text;ctx.font='bold 48px JetBrains Mono';ctx.textAlign='center';ctx.fillText('GAME OVER',HALF_W,HALF_W-40);ctx.font='24px JetBrains Mono';ctx.fillText(`Score: ${score}`,HALF_W,HALF_W+20);ctx.fillText(`High Score: ${highScore}`,HALF_W,HALF_W+60);ctx.fillText(`Time: ${(timeSurvived/1000).toFixed(1)}s`,HALF_W,HALF_W+100);ctx.font='16px JetBrains Mono';ctx.fillStyle=COL.edge;ctx.fillText('Click or Tap to Restart',HALF_W,HALF_W+160);ctx.textAlign='left';}

function reset(){score=0;timeSurvived=0;gameOver=false;player.pos.set(0,0);player.vel.set(0,0);player.hp=100;player.spread=false;player.shield=0;player.fireRate=150;player.trail=[];bullets.length=0;enemies.length=0;particles.length=0;powerups.length=0;notifications.length=0;rotAngle=0;rotTarget=0;rotTimer=ROT_CYCLE;rotState='idle';shake=0;}
canvas.addEventListener('click',()=>{if(gameOver){reset();actx.resume();}});
canvas.addEventListener('touchstart',()=>{if(gameOver){reset();actx.resume();}});

let last=performance.now();
function loop(now){const dt=Math.min((now-last)/1000,0.1);last=now;update(dt);draw();requestAnimationFrame(loop);}
requestAnimationFrame(loop);