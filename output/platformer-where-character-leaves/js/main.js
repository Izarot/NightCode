const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
let w=800,h=600,scale=1;
function resize(){const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;canvas.width=w;canvas.height=h;scale=Math.min(w/800,h/600);}
window.addEventListener('resize',resize);resize();
const state={level:1,clones:0,highscore:0,running:true,paused:false,time:0};
let player={x:100,y:400,vx:0,vy:0,w:32,h:48,onGround:false};
let cloneArr=[],particles=[];
const keys={},gravity=980,jumpVel=-420,runSpeed=280,maxF=600;
window.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyR')reset();if(e.code==='Escape')state.paused=!state.paused;});
window.addEventListener('keyup',e=>keys[e.code]=false);
function reset(){player={x:100,y:400,vx:0,vy:0,w:32,h:48,onGround:false};cloneArr=[];state.clones=0;}
function spawnClone(){if(cloneArr.length<50){cloneArr.push({x:player.x+player.w/2-16,y:player.y+player.h,w:32,h:48,age:0});state.clones++;spawnParticles(player.x+player.w/2,player.y+player.h);}}
function spawnParticles(x,y){for(let i=0;i<12;i++){const p={x,y,vx:(Math.random()-0.5)*100,vy:(Math.random()-0.5)*100,life:0.4,c:'#00D9FF'};particles.push(p);}}
function update(dt){if(state.paused)return;state.time+=dt;updatePlayer(dt);updateClones(dt);updateParticles(dt);}
function updatePlayer(dt){if(keys['KeyA']||keys['ArrowLeft'])player.vx=-runSpeed;else if(keys['KeyD']||keys['ArrowRight'])player.vx=runSpeed;else player.vx=0;
if((keys['KeyW']||keys['ArrowUp']||keys['Space'])&&player.onGround){player.vy=jumpVel;player.onGround=false;spawnClone();flash();}if(!player.onGround)player.vy+=gravity*dt;
if(player.vy>maxF)player.vy=maxF;
player.x+=player.vx*dt;player.y+=player.vy*dt;
player.onGround=false;
if(player.y+h>=h){player.y=h-h-48;player.vy=0;player.onGround=true;}
if(player.x<0)player.x=0;if(player.x+w>w)player.x=w-w;
}
let flashTime=0;
function flash(){flashTime=0.1;}
function updateClones(dt){cloneArr.forEach((c,i)=>{c.age+=dt;c.y+=player.vy*dt;if(c.age>50)c.splice(i,1);});}
function updateParticles(dt){particles.forEach((p,i)=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)p.splice(i,1);});}
function draw(){ctx.clearRect(0,0,w,h);
ctx.fillStyle='#2D3436';ctx.fillRect(0,h-40,w,40);
ctx.fillStyle='#FF6B6B';ctx.fillRect(player.x*scale,player.y*scale,player.w*scale,player.h*scale);
ctx.fillStyle='#00D9FF';cloneArr.forEach(c=>{ctx.globalAlpha=0.8;ctx.fillRect(c.x*scale,c.y*scale,c.w*scale,c.h*scale);});
ctx.fillStyle='#00D9FF';particles.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillRect(p.x*scale,p.y*scale,4,4);});
ctx.globalAlpha=1;
drawHUD();}
function drawHUD(){ctx.font='16px monospace';ctx.fillStyle='#fff';ctx.textAlign='left';ctx.fillText('Level '+state.level,w-100,20);ctx.fillText('Clones: '+state.clones,w-100,40);ctx.fillText('Best: '+state.highscore,w-100,60);
const mins=Math.floor(state.time/60),secs=Math.floor(state.time%60);ctx.fillText(mins+':'+(secs<10?'0':'')+secs,w-100,80);}
function loop(timestamp){if(!state.last)state.last=timestamp;const dt=(timestamp-state.last)/1000;state.last=timestamp;
if(state.running){update(dt);draw();}
requestAnimationFrame(loop);}
function gameLoop(){requestAnimationFrame(loop);}
function init(){state.highscore=localStorage.getItem('echoHighscore')||0;gameLoop();}
init();