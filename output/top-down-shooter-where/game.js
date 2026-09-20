const CANVAS_WIDTH=800, CANVAS_HEIGHT=600;
let canvas=document.getElementById('gameCanvas'), ctx=canvas.getContext('2d');
let scale=1;
function resize(){ const w=window.innerWidth, h=window.innerHeight; const ratio=Math.min(w/CANVAS_WIDTH, h/CANVAS_HEIGHT); scale=ratio; canvas.width=CANVAS_WIDTH*scale; canvas.height=CANVAS_HEIGHT*scale; ctx.scale(scale,scale); }
window.addEventListener('resize',resize); resize();

// Input
const keys={}; const mouse={x:0,y:0,down:false};
window.addEventListener('keydown',e=>{keys[e.code]=true;});
window.addEventListener('keyup',e=>{keys[e.code]=false;});
canvas.addEventListener('mousemove',e=>{const rect=canvas.getBoundingClientRect(); mouse.x=(e.clientX-rect.left)/scale; mouse.y=(e.clientY-rect.top)/scale;});
canvas.addEventListener('mousedown',e=>{mouse.down=true;});
canvas.addEventListener('mouseup',e=>{mouse.down=false;});

// Audio
const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
function playSound(freq, dur, type='sine'){ const osc=audioCtx.createOscillator(); const gain=audioCtx.createGain(); osc.type=type; osc.frequency.value=freq; gain.gain.setValueAtTime(0,audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0.2,audioCtx.currentTime+0.01); gain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime+dur); }

// Game state
let player={x:CANVAS_WIDTH/2, y:CANVAS_HEIGHT/2, vx:0, vy:0, health:100, maxHealth:100, ammo:30, maxAmmo:30, ammoRegen:1, dashCooldown:0, dashDuration:0.5, dashSpeed:8, acc:0.3, maxSpeed:4.5, friction:0.9, size:24};
let projectiles=[]; let fields=[]; let enemies=[]; let particles=[];
let score=0; let startTime=Date.now(); let highScore=0;
let waveTimer=0; let wave=1; let enemiesPerWave=5;

// Load highScore
const saved=localStorage.getItem('slowBurnHighScore'); if(saved!==null) highScore=parseFloat(saved);

function spawnEnemy(){ const side=Math.floor(Math.random()*4); let x,y; if(side===0){x=-24; y=Math.random()*CANVAS_HEIGHT;} else if(side===1){x=CANVAS_WIDTH+24; y=Math.random()*CANVAS_HEIGHT;} else if(side===2){x=Math.random()*CANVAS_WIDTH; y=-24;} else {x=Math.random()*CANVAS_WIDTH; y=CANVAS_HEIGHT+24;} enemies.push({x,y,vx:0,vy:0,speed:1.5+wave*0.1,size:24,health:20}); }

function update(dt){ // player input
 let ax=0, ay=0; if(keys['KeyW']||keys['ArrowUp']) ay-=1; if(keys['KeyS']||keys['ArrowDown']) ay+=1; if(keys['KeyA']||keys['ArrowLeft']) ax-=1; if(keys['KeyD']||keys['ArrowRight']) ax+=1; const len=Math.hypot(ax,ay); if(len>0){ax/=len; ay/=len;}
 player.vx+=ax*player.acc*dt; player.vy+=ay*player.acc*dt;
 const speed=Math.hypot(player.vx,player.vy); if(speed>player.maxSpeed){ const factor=player.maxSpeed/speed; player.vx*=factor; player.vy*=factor; }
 if(!keys['KeyW']&&!keys['KeyS']&&!keys['KeyA']&&!keys['KeyD']&&!keys['ArrowUp']&&!keys['ArrowDown']&&!keys['ArrowLeft']&&!keys['ArrowRight']){ player.vx*=player.friction; player.vy*=player.friction; }
 // dash
 if((keys['ShiftLeft']||keys['ShiftRight'])&&player.dashCooldown<=0){ player.dashCooldown=3; player.dashTimer=player.dashDuration; playSound(400,0.1,'square'); }
 if(player.dashTimer>0){ player.dashTimer-=dt; const dashFactor=player.dashSpeed/Math.hypot(player.vx,player.vy||0.001); player.vx*=dashFactor; player.vy*=dashFactor; }
 if(player.dashCooldown>0) player.dashCooldown-=dt;
 // apply dash trail particles
 if(player.dashTimer>0){ particles.push({x:player.x, y:player.y, vx:-player.vx*0.5, vy:-player.vy*0.5, life:0.2, size:4}); }
 // move player
 player.x+=player.vx*dt; player.y+=player.vy*dt;
 player.x=Math.max(player.size/2, Math.min(CANVAS_WIDTH-player.size/2, player.x)); player.y=Math.max(player.size/2, Math.min(CANVAS_HEIGHT-player.size/2, player.y));
 // ammo regen
 if(player.ammo<player.maxAmmo){ player.ammoRegenTimer=(player.ammoRegenTimer||0)+dt; if(player.ammoRegenTimer>=1){ player.ammo++; player.ammoRegenTimer=0; } }
 // shooting
 if(mouse.down && player.ammo>0){ const dx=mouse.x-player.x, dy=mouse.y-player.y; const len=Math.hypot(dx,dy); const vx=dx/len*10, vy=dy/len*10; projectiles.push({x:player.x, y:player.y, vx, vy, life:3}); player.ammo--; playSound(800,0.05,'sine'); // create field
 fields.push({x:player.x, y:player.y, radius:48, start:Date.now()/1000, duration:5, fade:1}); if(fields.length>5) fields.shift(); }
 // update projectiles
 for(let i=projectiles.length-1;i>=0;i--){ const p=projectiles[i]; p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; if(p.life<=0||p.x<-24||p.x>CANVAS_WIDTH+24||p.y<-24||p.y>CANVAS_HEIGHT+24) projectiles.splice(i,1); }
 // update fields
 const now=Date.now()/1000; for(let i=fields.length-1;i>=0;i--){ const f=fields[i]; const age=now-f.start; if(age>f.duration){ fields.splice(i,1); continue; } }
 // update enemies
 for(let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; // chase player
 const dx=player.x-e.x, dy=player.y-e.y; const len=Math.hypot(dx,dy); if(len>0){ const nx=dx/len, ny=dy/len; e.vx+=nx*e.speed*dt; e.vy+=ny*e.speed*dt; }
 // field slowdown
 let slow=0; for(const f of fields){ const dx=e.x-f.x, dy=e.y-f.y; const dist=Math.hypot(dx,dy); if(dist<f.radius){ slow+=0.3; } }
 slow=Math.min(slow,0.5); e.vx*=(1-slow); e.vy*=(1-slow);
 e.x+=e.vx*dt; e.y+=e.vy*dt;
 // collision player
 if(Math.hypot(e.x-player.x, e.y-player.y)<(player.size+e.size)/2){ player.health-=10*dt; playSound(200,0.2,'sine'); if(player.health<=0) endGame(); }
 // collision projectiles
 for(let j=projectiles.length-1;j>=0;j--){ const p=projectiles[j]; if(Math.hypot(e.x-p.x, e.y-p.y)<(e.size+p.size)/2){ e.health-=10; projectiles.splice(j,1); if(e.health<=0){ score+=100; playSound(600,0.2,'triangle'); // explosion particles
 for(let k=0;k<8;k++){ const ang=Math.PI*2*k/8; particles.push({x:e.x, y:e.y, vx:Math.cos(ang)*2, vy:Math.sin(ang)*2, life:0.5, size:3}); }
 enemies.splice(i,1); break; } } }
 if(e.health<=0){ enemies.splice(i,1); } }
 // update particles
 for(let i=particles.length-1;i>=0;i--){ const p=particles[i]; p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; if(p.life<=0) particles.splice(i,1); }
 // wave spawning
 waveTimer+=dt; if(waveTimer>5 && enemies.length<enemiesPerWave*wave){ spawnEnemy(); waveTimer=0; }
 if(enemies.length===0 && waveTimer>2){ wave++; enemiesPerWave+=2; waveTimer=0; }
 // health regen
 if(player.health<player.maxHealth){ player.regenTimer=(player.regenTimer||0)+dt; if(player.regenTimer>=1){ player.health++; player.regenTimer=0; } }
}

function endGame(){ cancelAnimationFrame(loop); const survived=(Date.now()-startTime)/1000; document.getElementById('gameOver').style.display='flex'; document.getElementById('finalScore').textContent=score; document.getElementById('finalTime').textContent=survived.toFixed(1); if(survived>highScore){ highScore=survived; localStorage.setItem('slowBurnHighScore', highScore); } }

function restart(){ location.reload(); }
document.getElementById('restartBtn').addEventListener('click',restart);

function draw(){ ctx.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT); // starfield background
 ctx.fillStyle='#000'; ctx.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT); for(let i=0;i<100;i++){ const x=(i*137)%CANVAS_WIDTH; const y=(i*73)%CANVAS_HEIGHT; const brightness=Math.sin(Date.now()/1000+i)*0.5+0.5; ctx.fillStyle=`rgba(255,255,255,${brightness*0.2})`; ctx.fillRect(x,y,2,2); }
 // fields
 for(const f of fields){ const age=Date.now()/1000-f.start; const fade=Math.max(0,1-age); const radius=f.radius*fade; ctx.beginPath(); ctx.arc(f.x,f.y,radius,0,Math.PI*2); ctx.fillStyle=`rgba(0,200,255,${fade*0.3})`; ctx.fill(); }
 // player
 ctx.save(); ctx.translate(player.x,player.y); ctx.rotate(Math.atan2(player.vy,player.vx)+Math.PI/2); ctx.fillStyle='#0ff'; ctx.beginPath(); ctx.moveTo(-player.size/2,-player.size/4); ctx.lineTo(0,player.size/2); ctx.lineTo(player.size/2,-player.size/4); ctx.fill(); ctx.restore();
 // dash trail particles
 for(const p of particles){ ctx.fillStyle=`rgba(255,255,255,${p.life/0.2})`; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); }
 // projectiles
 for(const p of projectiles){ ctx.fillStyle='#0ff'; ctx.beginPath(); ctx.arc(p.x,p.y,2,0,Math.PI*2); ctx.fill(); }
 // enemies
 for(const e of enemies){ ctx.fillStyle='#f44'; ctx.fillRect(e.x-e.size/2, e.y-e.size/2, e.size, e.size); // aura if slowed
 const slowed=fields.some(f=>Math.hypot(e.x-f.x,e.y-f.y)<f.radius); if(slowed){ ctx.strokeStyle='#00f'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(e.x,e.y,e.size/2+2,0,Math.PI*2); ctx.stroke(); } }
 // HUD (unscaled)
 ctx.restore(); const hudScale=1/scale; ctx.save(); ctx.scale(hudScale,hudScale); // health bar
 const healthWidth=150*player.health/player.maxHealth; document.getElementById('healthFill').style.width=`${healthWidth}px`; document.getElementById('ammoCount').textContent=player.ammo; // dash cooldown
 const dashEl=document.getElementById('dashCooldown'); if(player.dashCooldown>0){ dashEl.classList.remove('ready'); dashEl.style.background=`conic-gradient(#555 ${player.dashCooldown/3*360deg}, transparent 0)`; }else{ dashEl.classList.add('ready'); dashEl.style.background=''; }
 // fields count
 document.getElementById('fieldsNum').textContent=fields.length; // score
 document.getElementById('scoreVal').textContent=score; // timer
 const survived=(Date.now()-startTime)/1000; document.getElementById('timerVal').textContent=`${Math.floor(survived)}s`; // high score
 document.getElementById('highScoreVal').textContent=`${Math.floor(highScore)}s`; ctx.restore(); }

function loop(){ const now=performance.now(); dt=Math.min((now-lastTime)/1000,0.05); lastTime=now; update(dt); draw(); requestAnimationFrame(loop); }
let lastTime=performance.now(); requestAnimationFrame(loop);
