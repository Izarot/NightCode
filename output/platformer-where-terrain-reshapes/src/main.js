import {Player} from './player.js';
import {Terrain} from './terrain.js';
import {Sound,clamp} from './utils.js';
import {updateHUD} from './ui.js';
const canvas=document.getElementById('game');const ctx=canvas.getContext('2d');
function resize(){canvas.width=1600;canvas.height=900;}
window.addEventListener('resize',resize);resize();
const terrain=new Terrain();const player=new Player();const sound=new Sound();
const keys={left:false,right:false,jump:false,boost:false};
let cam=0,frame=0,running=false,paused=false,startTime=0,elapsed=0,cpIndex=0,resTimer=0,resonance=false,particles=[],highScore=parseFloat(localStorage.getItem('terraform_highscore'))||0,goalX=20500,checkpoints=[2000,5000,8000,11000,14000,17000,20000],boostPads=[1200,3500,6500,9500,12500,15500,18500],spikes=[2800,5800,8800,11800,14800,17800];
let last=performance.now();
window.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')keys.left=true;if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')keys.right=true;if(e.key==='ArrowUp'||e.key==='w'||e.key==='W'||e.key===' ')keys.jump=true;if(e.key==='Shift')keys.boost=true;if(e.key==='Escape')togglePause();if(e.key==='r'||e.key==='R')resetGame();});
window.addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A')keys.left=false;if(e.key==='ArrowRight'||e.key==='d'||e.key==='D')keys.right=false;if(e.key==='ArrowUp'||e.key==='w'||e.key==='W'||e.key===' ')keys.jump=false;if(e.key==='Shift')keys.boost=false;});
function bindBtn(id,key){const el=document.getElementById(id);el.addEventListener('touchstart',e=>{e.preventDefault();keys[key]=true;},{passive:false});el.addEventListener('touchend',()=>keys[key]=false);el.addEventListener('mousedown',()=>keys[key]=true);el.addEventListener('mouseup',()=>keys[key]=false);}
bindBtn('btnL','left');bindBtn('btnR','right');bindBtn('btnJ','jump');bindBtn('btnB','boost');
const joy=document.getElementById('joy'),knob=document.getElementById('joyKnob');joy.addEventListener('touchmove',e=>{const r=joy.getBoundingClientRect(),t=e.touches[0];const dx=t.clientX-(r.left+55);knob.style.left=(31+clamp(dx,-30,30))+'px';keys.left=dx<-10;keys.right=dx>10;},{passive:true});joy.addEventListener('touchend',()=>{keys.left=keys.right=false;knob.style.left='31px';});
function togglePause(){if(!running)return;paused=!paused;document.getElementById('overlay').style.display=paused?'flex':'none';document.getElementById('pauseMenu').style.display=paused?'block':'none';}
window.resumeGame=()=>{paused=false;document.getElementById('overlay').style.display='none';};
window.resetGame=()=>{player.reset(80);cam=0;cpIndex=0;elapsed=0;startTime=performance.now();resTimer=0;resonance=false;particles=[];paused=false;document.getElementById('overlay').style.display='none';running=true;};
document.getElementById('startBtn').addEventListener('click',()=>{sound.init();resetGame();});
function die(msg){sound.die();document.getElementById('msg').textContent=msg;setTimeout(()=>{document.getElementById('msg').textContent='';resetGame();},900);}
function loop(now){requestAnimationFrame(loop);const dt=Math.min(0.033,(now-last)/1000);last=now;if(!running||paused){draw();return;}frame++;elapsed=now-startTime;
const jumped=player.update(keys,terrain,dt,keys.boost);if(jumped)sound.jump();
terrain.update(player,frame);
for(const b of boostPads)if(Math.abs(player.x-b)<40&&player.onGround){player.speed+=1.5;sound.boost();}
for(const s of spikes)if(Math.abs(player.x+16-s)<22&&Math.abs(player.y+48-terrain.groundAt(s))<30)die('💥 SPIKED!');
if(player.y>950)die('🕳 VOID!');
if(Math.abs(player.speed)>=12){resTimer=0;}
if(Math.abs(player.speed)>=6&&Math.abs(player.speed)<=10&&player.onGround){resTimer+=dt;if(resTimer>=8&&!resonance){resonance=true;document.getElementById('msg').textContent='✨ RESONANCE! x2 ✨';setTimeout(()=>document.getElementById('msg').textContent='',1500);}}else if(!resonance)resTimer=Math.max(0,resTimer-dt);
if(cpIndex<checkpoints.length&&player.x>checkpoints[cpIndex]){cpIndex++;player.speed=0;sound.cp();document.getElementById('msg').textContent='🚩 Checkpoint '+cpIndex+'!';setTimeout(()=>document.getElementById('msg').textContent='',1200);}
if(player.x>=goalX){running=false;sound.win();const t=elapsed;if(!highScore||t<highScore){highScore=t;localStorage.setItem('terraform_highscore',t);}document.getElementById('msg').textContent='🏆 FINISH! Time: '+(t/1000).toFixed(1)+'s Best: '+(highScore/1000).toFixed(1)+'s';document.getElementById('overlay').style.display='flex';document.getElementById('startBtn').textContent='▶ RUN AGAIN';}
if(Math.abs(player.speed)>8&&particles.length<120)for(let i=0;i<Math.abs(player.speed);i++)particles.push({x:player.x,y:player.y+48,vx:-player.speed*0.3,vy:-Math.random()*2,life:0.4,size:2+Math.random()*4});
particles=particles.filter(p=>p.life>0);for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.life-=dt;}
cam+=(player.x-300-cam)*0.08;if(cam<0)cam=0;
const zone=Math.min(10,1+Math.floor(player.x/2200));updateHUD(player,zone,resonance,cpIndex,elapsed,highScore);draw();}
function draw(){ctx.clearRect(0,0,1600,900);const g=ctx.createLinearGradient(0,0,0,900);g.addColorStop(0,'#0f0529');g.addColorStop(0.6,'#2b0a4a');g.addColorStop(1,'#ff2ea6');ctx.fillStyle=g;ctx.fillRect(0,0,1600,900);ctx.fillStyle='#ffe600';for(let i=0;i<40;i++)ctx.fillRect((i*97-cam*0.2)%1600,40+(i*53)%200,3,3);
ctx.fillStyle='#00e5ff';for(const b of boostPads){const sx=b-cam;if(sx>-50&&sx<1650){ctx.fillRect(sx,terrain.groundAt(b)-8,60,8);ctx.fillStyle='#fff';ctx.font='bold 20px Arial';ctx.fillText('⚡',sx+18,terrain.groundAt(b)-12);ctx.fillStyle='#00e5ff';}}
ctx.fillStyle='#ff004c';for(const s of spikes){const sx=s-cam;if(sx>-50&&sx<1650){const gy=terrain.groundAt(s);for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(sx+i*14,gy);ctx.lineTo(sx+i*14+7,gy-22);ctx.lineTo(sx+i*14+14,gy);ctx.fill();}}}
ctx.font='bold 36px Arial';for(const c of checkpoints){const sx=c-cam;if(sx>-50&&sx<1650){ctx.fillStyle='#ffe600';ctx.fillRect(sx,terrain.groundAt(c)-70,4,70);ctx.fillText('🚩',sx-8,terrain.groundAt(c)-70);}}
ctx.fillStyle='#ffe600';ctx.font='bold 48px Arial';ctx.fillText('🏁',goalX-cam,terrain.groundAt(goalX)-20);
terrain.draw(ctx,cam,player);
for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/0.4);ctx.fillStyle='#ffe600';ctx.fillRect(p.x-cam,p.y,p.size,p.size);}ctx.globalAlpha=1;
player.draw(ctx,cam);
ctx.fillStyle='rgba(0,0,0,0.35)';ctx.fillRect(0,860,1600,40);ctx.fillStyle='#fff';ctx.font='16px Arial';ctx.fillText('TERRAFORM | Speed shapes terrain | Keep 6-10 for Resonance | Goal: '+goalX+'m',20,885);}
requestAnimationFrame(loop);
