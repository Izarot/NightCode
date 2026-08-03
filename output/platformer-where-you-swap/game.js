const canvas=document.getElementById('game');const ctx=canvas.getContext('2d');const scoreEl=document.getElementById('score');const highEl=document.getElementById('highscore');const timerEl=document.getElementById('timer');const overlay=document.getElementById('overlay');const overlayText=document.getElementById('overlay-text');const startBtn=document.getElementById('start-btn');const pauseOverlay=document.getElementById('pause-overlay');
let W=0,H=0,DPR=1;
function resize(){DPR=Math.min(window.devicePixelRatio||1,2);const rect=canvas.parentElement.getBoundingClientRect();W=rect.width;H=rect.height;canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.scale(DPR,DPR)}
window.addEventListener('resize',resize);resize();
const COLORS={bg:'#0a0a12',player:'#00ffff',playerGlow:'#00ffff',enemy:'#ff0066',enemyGlow:'#ff0066',orb:'#ffff00',orbGlow:'#ffff00',trail:'#00ffff',grid:'#00ffff22',text:'#00ffff',timer:'#ff00ff'};
const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
function beep(freq,type,dur,vol,start=0){if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator();const g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(audioCtx.destination);o.start(audioCtx.currentTime+start);o.stop(audioCtx.currentTime+start+dur)}
function sfxCollect(){beep(880,'sine',0.1,0.15);beep(1320,'sine',0.1,0.1,0.05)}
function sfxHit(){beep(150,'sawtooth',0.3,0.2);beep(80,'square',0.4,0.15,0.05)}
function sfxStart(){beep(440,'triangle',0.1,0.1);beep(660,'triangle',0.1,0.1,0.1);beep(880,'triangle',0.15,0.15,0.2)}
function sfxLevel(){beep(523,'sine',0.08,0.1);beep(659,'sine',0.08,0.1,0.08);beep(784,'sine',0.08,0.1,0.16);beep(1047,'sine',0.2,0.15,0.24)}
let highScore=parseInt(localStorage.getItem('neonDriftHigh')||'0');highEl.textContent=highScore;
let state='menu',score=0,time=0,lastTime=0,spawnTimer=0,difficulty=1;
const player={x:0,y:0,w:44,h:44,targetX:0,vx:0,speed:0.45,trail:[],shield:0,invuln:0};
const enemies=[];const orbs=[];const particles=[];const stars=[];
for(let i=0;i<60;i++)stars.push({x:Math.random()*W,y:Math.random()*H,s:Math.random()*1.5+0.5,speed:Math.random()*0.3+0.05,opacity:Math.random()});
function reset(){score=0;time=0;difficulty=1;enemies.length=0;orbs.length=0;particles.length=0;player.x=W/2-player.w/2;player.y=H-100;player.targetX=player.x;player.vx=0;player.trail=[];player.shield=0;player.invuln=0;spawnTimer=0;scoreEl.textContent=0;timerEl.textContent='0.00s'}
function spawnEnemy(){const size=30+Math.random()*20;const x=Math.random()*(W-size);const speed=2.5+difficulty*0.8+Math.random()*1.5;const type=Math.random()<0.3?'zigzag':'straight';enemies.push({x,y:-size,w:size,h:size,speed,type,phase:Math.random()*Math.PI*2,hue:300+Math.random()*60})}
function spawnOrb(){const size=22;const x=Math.random()*(W-size);orbs.push({x,y:-size,w:size,h:size,speed:3+Math.random(),pulse:0})}
function addParticles(x,y,color,count){for(let i=0;i<count;i++)particles.push({x,y,vx:(Math.random()-0.5)*8,vy:(Math.random()-0.5)*8-2,life:1,decay:0.02+Math.random()*0.03,size:2+Math.random()*4,color})}
function update(dt){if(state!=='play')return;time+=dt;timerEl.textContent=time.toFixed(2)+'s';difficulty=1+Math.floor(time/15)*0.3;
player.vx+=(player.targetX-player.x)*player.speed;player.x+=player.vx;player.vx*=0.85;player.x=Math.max(0,Math.min(W-player.w,player.x));
player.trail.unshift({x:player.x+player.w/2,y:player.y+player.h/2,life:1});if(player.trail.length>20)player.trail.pop();player.trail.forEach(t=>t.life-=dt*3);player.trail=player.trail.filter(t=>t.life>0);
if(player.invuln>0)player.invuln-=dt;
spawnTimer+=dt;const spawnRate=Math.max(0.35,0.9-difficulty*0.15);if(spawnTimer>spawnRate){spawnEnemy();spawnTimer=0;if(Math.random()<0.4)spawnOrb()}
enemies.forEach(e=>{e.y+=e.speed*difficulty;if(e.type==='zigzag')e.x+=Math.sin(e.phase+time*8)*2.5});
enemies.forEach(e=>{if(e.y>H+50||e.x<-50||e.x>W+50)e.dead=true});enemies.forEach(e=>e.dead&&enemies.splice(enemies.indexOf(e),1));
orbs.forEach(o=>{o.y+=o.speed;o.pulse+=dt*10});orbs.forEach(o=>{if(o.y>H+50)o.dead=true});orbs.forEach(o=>o.dead&&orbs.splice(orbs.indexOf(o),1));
particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.3;p.life-=p.decay});particles.forEach(p=>p.life<=0&&particles.splice(particles.indexOf(p),1));
stars.forEach(s=>{s.y+=s.speed*difficulty*20;if(s.y>H){s.y=0;s.x=Math.random()*W}});
const px=player.x+player.w/2,py=player.y+player.h/2,pr=player.w*0.35;
enemies.forEach(e=>{const ex=e.x+e.w/2,ey=e.y+e.h/2,er=e.w*0.4;if(Math.hypot(px-ex,py-ey)<pr+er&&player.invuln<=0){sfxHit();player.invuln=1.5;addParticles(px,py,COLORS.enemy,25);state='over';overlayText.innerHTML=`CRASHED<br><span style='font-size:14px;font-weight:400'>Score: ${score} | Time: ${time.toFixed(2)}s</span>`;overlay.classList.remove('hidden');if(score>highScore){highScore=score;localStorage.setItem('neonDriftHigh',highScore);highEl.textContent=highScore}}})
orbs.forEach(o=>{const ox=o.x+o.w/2,oy=o.y+o.h/2,or=o.w*0.5;if(Math.hypot(px-ox,py-oy)<pr+or){sfxCollect();score+=10*Math.ceil(difficulty);scoreEl.textContent=score;addParticles(ox,oy,COLORS.orb,15);o.dead=true}})}
function draw(){ctx.fillStyle=COLORS.bg;ctx.fillRect(0,0,W,H);
ctx.strokeStyle=COLORS.grid;ctx.lineWidth=1;const gs=40;for(let x=0;x<W;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<H;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
stars.forEach(s=>{ctx.fillStyle=`rgba(255,255,255,${s.opacity*0.6})`;ctx.beginPath();ctx.arc(s.x,s.y,s.s,0,Math.PI*2);ctx.fill()});
particles.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);ctx.fill()});ctx.globalAlpha=1;
orbs.forEach(o=>{const ox=o.x+o.w/2,oy=o.y+o.h/2;const r=o.w/2*(1+Math.sin(o.pulse)*0.15);const grad=ctx.createRadialGradient(ox,oy,0,ox,oy,r);grad.addColorStop(0,COLORS.orb);grad.addColorStop(1,'transparent');ctx.fillStyle=grad;ctx.shadowColor=COLORS.orbGlow;ctx.shadowBlur=20;ctx.beginPath();ctx.arc(ox,oy,r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=COLORS.orb;ctx.lineWidth=2;ctx.beginPath();ctx.arc(ox,oy,r*0.6,0,Math.PI*2);ctx.stroke()});
enemies.forEach(e=>{const ex=e.x+e.w/2,ey=e.y+e.h/2;ctx.fillStyle=`hsl(${e.hue},100%,55%)`;ctx.shadowColor=`hsl(${e.hue},100%,55%)`;ctx.shadowBlur=15;ctx.beginPath();ctx.moveTo(ex,ey-e.h/2);ctx.lineTo(ex+e.w/2,ey);ctx.lineTo(ex,ey+e.h/2);ctx.lineTo(ex-e.w/2,ey);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke()});
player.trail.forEach((t,i)=>{const alpha=t.life*0.4;const size=(player.w/2)*(1-i/player.trail.length)*t.life;ctx.fillStyle=`rgba(0,255,255,${alpha})`;ctx.beginPath();ctx.arc(t.x,t.y,size,0,Math.PI*2);ctx.fill()});
ctx.fillStyle=player.invuln>0&&Math.floor(player.invuln*10)%2===0?'rgba(0,255,255,0.3)':COLORS.player;ctx.shadowColor=COLORS.playerGlow;ctx.shadowBlur=player.invuln>0?30:20;ctx.beginPath();ctx.moveTo(player.x+player.w/2,player.y);ctx.lineTo(player.x+player.w,player.y+player.h*0.7);ctx.lineTo(player.x+player.w*0.6,player.y+player.h);ctx.lineTo(player.x+player.w/2,player.y+player.h*0.85);ctx.lineTo(player.x+player.w*0.4,player.y+player.h);ctx.lineTo(player.x,player.y+player.h*0.7);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(player.x+player.w/2,player.y);ctx.lineTo(player.x+player.w,player.y+player.h*0.7);ctx.lineTo(player.x+player.w*0.6,player.y+player.h);ctx.lineTo(player.x+player.w/2,player.y+player.h*0.85);ctx.lineTo(player.x+player.w*0.4,player.y+player.h);ctx.lineTo(player.x,player.y+player.h*0.7);ctx.closePath();ctx.stroke()}
function loop(ts){if(!lastTime)lastTime=ts;const dt=Math.min((ts-lastTime)/1000,0.05);lastTime=ts;update(dt);draw();requestAnimationFrame(loop)}
requestAnimationFrame(loop);
function start(){reset();state='play';overlay.classList.add('hidden');pauseOverlay.classList.add('hidden');sfxStart();lastTime=performance.now()}
startBtn.addEventListener('click',start);
canvas.addEventListener('click',e=>{if(state==='menu'||state==='over')start();else if(state==='play'){state='pause';pauseOverlay.classList.remove('hidden')}else if(state==='pause'){state='play';pauseOverlay.classList.add('hidden');lastTime=performance.now()}});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&state==='play'){state='pause';pauseOverlay.classList.remove('hidden')}else if(e.key==='Escape'&&state==='pause'){state='play';pauseOverlay.classList.add('hidden');lastTime=performance.now()}else if((state==='menu'||state==='over')&&e.key==='Enter')start()});
let touchX=0;function handleMove(x){if(state==='play')player.targetX=x-player.w/2}
canvas.addEventListener('mousemove',e=>{const rect=canvas.getBoundingClientRect();handleMove(e.clientX-rect.left)});
canvas.addEventListener('touchmove',e=>{e.preventDefault();const rect=canvas.getBoundingClientRect();handleMove(e.touches[0].clientX-rect.left)},{passive:false});
canvas.addEventListener('touchstart',e=>{e.preventDefault();const rect=canvas.getBoundingClientRect();handleMove(e.touches[0].clientX-rect.left)},{passive:false});
window.addEventListener('blur',()=>{if(state==='play'){state='pause';pauseOverlay.classList.remove('hidden')}});