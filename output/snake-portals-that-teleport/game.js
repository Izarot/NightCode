const CVS=document.getElementById('game'),CTX=CVS.getContext('2d');
const VW=400,VH=400,CS=20,GRID=VW/CS;
const COL={bg1:'#0a0a20',bg2:'#1a1a40',snakeH:'#00f5ff',snakeT:'#00aaff',food:'#ff00c8',portalA:'#00ffff',portalB:'#ff00ff',grid:'rgba(0,0,0,0.1)',text:'#fff',hi:'#888',score:'#00ff00',lvl:'#00f5ff',time:'#ff00c8',mult:'#ffaa00'};
const DIRS={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};
let highScore=+localStorage.getItem('ps_hiscore')||0,highContrast=false,reducedMotion=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
let state='MENU',snake=[],food=null,portals=[],particles=[],dir=[1,0],nextDir=[1,0],score=0,level=1,mult=1,lastMove=0,moveInterval=200,gameTime=0,startTime=0,animId=0,lastTs=0,accum=0;
const audioCtx=new (window.AudioContext||webkitAudioContext)();
function beep(freq,type,dur,vol=0.1){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);o.stop(audioCtx.currentTime+dur)}
function resize(){const r=Math.min(window.innerWidth/VW,window.innerHeight/VH)*0.95;CVS.width=VW;CVS.height=VH;CVS.style.width=`${VW*r}px`;CVS.style.height=`${VH*r}px`}
function randCell(exclude=[]){let c;do{c={x:Math.floor(Math.random()*GRID),y:Math.floor(Math.random()*GRID)}}while(exclude.some(e=>e.x===c.x&&e.y===c.y));return c}
function init(){snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];dir=[1,0];nextDir=[1,0];score=0;level=1;mult=1;moveInterval=200;gameTime=0;startTime=performance.now();particles=[];portals=[];for(let i=0;i<2;i++){const p1=randCell(snake),p2=randCell([...snake,p1]);portals.push({a:p1,b:p2,color:i%2?COL.portalA:COL.portalB,phase:Math.random()*Math.PI*2})}spawnFood();updateHUD()}
function spawnFood(){const t=Math.random()<0.15&&portals.length?portals[Math.floor(Math.random()*portals.length)].a:null;food={...randCell([...snake,...portals.flatMap(p=>[p.a,p.b])]),pulse:0,special:!!t};
if(t){food.x=t.x;food.y=t.y}}
function updateHUD(){document.getElementById('scoreEl').textContent=`SCORE: ${score}`;document.getElementById('hiScoreEl').textContent=`HI: ${highScore}`;document.getElementById('levelEl').textContent=`LVL: ${level}`;document.getElementById('multEl').textContent=`×${mult.toFixed(1)}`;document.getElementById('timerEl').textContent=`TIME: ${gameTime.toFixed(2)}s`}
function wrap(v,max){return(v%max+max)%max}
function checkPortal(head){for(const p of portals){if(head.x===p.a.x&&head.y===p.a.y)return{p,from:'a',to:p.b};if(head.x===p.b.x&&head.y===p.b.y)return{p,from:'b',to:p.a}}return null}
function addParticles(x,y,color,count=8){for(let i=0;i<count;i++){const ang=Math.random()*Math.PI*2,spd=1+Math.random()*2;particles.push({x:x*CS+CS/2,y:y*CS+CS/2,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,life:1,color,size:2+Math.random()*3})}}
function update(dt){gameTime=(performance.now()-startTime)/1000;if(state!=='PLAYING')return;accum+=dt;while(accum>=moveInterval/1000){accum-=moveInterval/1000;step()}
particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=dt*3;p.size*=0.98});particles=particles.filter(p=>p.life>0)}
function step(){dir=nextDir;const head={x:snake[0].x+dir[0],y:snake[0].y+dir[1]};
if(head.x<0||head.x>=GRID||head.y<0||head.y>=GRID){gameOver();return}
for(let i=1;i<snake.length;i++)if(head.x===snake[i].x&&head.y===snake[i].y){gameOver();return}
snake.unshift(head);
const portalHit=checkPortal(head);
if(portalHit){head.x=portalHit.to.x;head.y=portalHit.to.y;mult=Math.max(0.1,mult-0.1);beep(440,'sine',0.1,0.05);beep(880,'square',0.05,0.03);addParticles(portalHit.from==='a'?portalHit.p.a:portalHit.p.b,portalHit.p.color,12);addParticles(portalHit.to,portalHit.p.color,12)}
let ate=false;
if(head.x===food.x&&head.y===food.y){ate=true;score+=Math.round(10*mult);if(score>highScore){highScore=score;localStorage.setItem('ps_hiscore',highScore)}beep(food.special?660:520,'triangle',0.1,0.1);addParticles(food,food.special?COL.portalB:COL.food,food.special?20:10);if(food.special)mult+=0.3;spawnFood();if(score>0&&score%50===0){level++;moveInterval=Math.max(50,moveInterval-15)}}
if(!ate)snake.pop();
updateHUD()}
function gameOver(){state='GAME_OVER';beep(220,'sawtooth',0.3,0.15);document.getElementById('overlayTitle').textContent='GAME OVER';document.getElementById('overlayText').innerHTML=`FINAL SCORE: ${score}<br>TIME: ${gameTime.toFixed(2)}s`;document.getElementById('startBtn').textContent='RESTART';document.getElementById('overlay').classList.add('active')}
function render(){const g=CTX.createLinearGradient(0,0,VW,VH);g.addColorStop(0,highContrast?'#000':COL.bg1);g.addColorStop(1,highContrast?'#111':COL.bg2);CTX.fillStyle=g;CTX.fillRect(0,0,VW,VH);
if(!highContrast){CTX.strokeStyle=COL.grid;CTX.lineWidth=0.5;for(let i=0;i<=GRID;i++){CTX.beginPath();CTX.moveTo(i*CS,0);CTX.lineTo(i*CS,VH);CTX.stroke();CTX.beginPath();CTX.moveTo(0,i*CS);CTX.lineTo(VW,i*CS);CTX.stroke()}}
portals.forEach(p=>{const drawPortal=(pos,col)=>{const cx=pos.x*CS+CS/2,cy=pos.y*CS+CS/2;CTX.save();CTX.translate(cx,cy);const t=performance.now()/500+p.phase;for(let r=CS/2;r>2;r-=3){const a=0.15*(r/(CS/2));CTX.strokeStyle=col;CTX.globalAlpha=a;CTX.lineWidth=2;CTX.beginPath();CTX.arc(Math.sin(t)*2,Math.cos(t)*2,r,0,Math.PI*2);CTX.stroke()}CTX.globalAlpha=0.3;CTX.fillStyle=col;CTX.beginPath();CTX.arc(0,0,CS/2-2,0,Math.PI*2);CTX.fill();CTX.restore()};drawPortal(p.a,p.color);drawPortal(p.b,p.color)});
CTX.fillStyle=food.special?COL.portalB:COL.food;food.pulse+=0.15;const fs=CS/2+Math.sin(food.pulse)*2;CTX.shadowColor=food.special?COL.portalB:COL.food;CTX.shadowBlur=10;CTX.beginPath();CTX.arc(food.x*CS+CS/2,food.y*CS+CS/2,fs,0,Math.PI*2);CTX.fill();CTX.shadowBlur=0;
snake.forEach((seg,i)=>{const t=i/(snake.length-1)||0;const c=lerpColor(COL.snakeH,COL.snakeT,t);CTX.fillStyle=highContrast?'#0f0':c;const rx=seg.x*CS+2,ry=seg.y*CS+2,rw=CS-4,rh=CS-4;roundRect(CTX,rx,ry,rw,rh,4);if(i===0){CTX.fillStyle=highContrast?'#000':'#0a0a20';const ex=dir[0]===1?rx+rw-6:dir[0]===-1?rx+2:rx+rw/2-2;const ey=dir[1]===1?ry+rh-6:dir[1]===-1?ry+2:ry+rh/2-2;CTX.beginPath();CTX.arc(ex,ey,2,0,Math.PI*2);CTX.fill();CTX.beginPath();CTX.arc(ex+4,ey,2,0,Math.PI*2);CTX.fill()}});
particles.forEach(p=>{CTX.globalAlpha=p.life;CTX.fillStyle=p.color;CTX.beginPath();CTX.arc(p.x,p.y,p.size,0,Math.PI*2);CTX.fill()});CTX.globalAlpha=1}
function lerpColor(a,b,t){const ca=parseInt(a.slice(1),16),cb=parseInt(b.slice(1),16);const r=(ca>>16)+(cb>>16)-(ca>>16))*t|0,g=((ca>>8&255)+(cb>>8&255)-(ca>>8&255))*t|0,bc=(ca&255)+(cb&255)-(ca&255))*t|0;return`#${(r<<16|g<<8|bc).toString(16).padStart(6,'0')}`}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.fill()}
function loop(ts){if(!lastTs)lastTs=ts;const dt=Math.min((ts-lastTs)/1000,0.1);lastTs=ts;update(dt);render();animId=requestAnimationFrame(loop)}
function start(){if(state==='PLAYING')return;init();state='PLAYING';document.getElementById('overlay').classList.remove('active');lastTs=0;accum=0;animId=requestAnimationFrame(loop)}
window.addEventListener('keydown',e=>{if(state==='MENU'||state==='GAME_OVER'){start();return}const d=DIRS[e.key];if(d&&!(d[0]===-dir[0]&&d[1]===-dir[1]))nextDir=d});
window.addEventListener('touchstart',e=>{if(state==='MENU'||state==='GAME_OVER'){start();return}const t=e.changedTouches[0];const rect=CVS.getBoundingClientRect();const x=t.clientX-rect.left,y=t.clientY-rect.top;if(x<rect.width/2&&y<rect.height/2)nextDir=[0,-1];else if(x>rect.width/2&&y<rect.height/2)nextDir=[0,1];else if(x<rect.width/2)nextDir=[-1,0];else nextDir=[1,0]}, {passive:true});
document.querySelectorAll('.touch-btn').forEach(b=>{b.addEventListener('touchstart',e=>{e.preventDefault();const d=b.dataset.dir.split(',').map(Number);if(!(d[0]===-dir[0]&&d[1]===-dir[1]))nextDir=d},{passive:false})});
document.getElementById('startBtn').addEventListener('click',start);
document.getElementById('highContrastBtn').addEventListener('click',()=>{highContrast=!highContrast;document.getElementById('highContrastBtn').textContent=highContrast?'Normal Colors':'High Contrast'});
resize();window.addEventListener('resize',resize);
init();document.getElementById('overlay').classList.add('active');