import {LevelGenerator} from './LevelGenerator.js';
import {TimeFreezeSystem} from './TimeFreezeSystem.js';
import {createEnemy,updateEnemy} from './EnemyAI.js';
import {draw} from './Renderer.js';
import {updateHUD} from './HUD.js';
const canvas=document.getElementById('game'); const ctx=canvas.getContext('2d');
const els={healthBar:document.getElementById('healthBar'),wave:document.getElementById('wave'),freezeFill:document.getElementById('freezeFill'),timer:document.getElementById('timer'),score:document.getElementById('score'),minimap:document.getElementById('minimap'),msg:document.getElementById('msg'),pauseMenu:document.getElementById('pauseMenu')};
let audio; function beep(f,d,type='square',v=0.08){try{if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)(); let o=audio.createOscillator(),g=audio.createGain(); o.type=type;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(audio.destination);o.start();g.gain.exponentialRampToValueAtTime(0.001,audio.currentTime+d);o.stop(audio.currentTime+d);}catch(e){}}
const gen=new LevelGenerator(); let level=gen.generate(21,15);
let player={x:60,y:60,vx:0,vy:0,r:16,hp:100}; let freeze=new TimeFreezeSystem(); let enemies=[]; let wave=1; let keys={}; let paused=false; let elapsed=0; let last=performance.now(); let coyote=0; let frozenParticles=[]; let joy={x:0,y:0}; let touchFreeze=false;
function spawnWave(w){enemies=[]; let types=['chaser','patroller','bomber']; for(let i=0;i<3+w;i++){let type=types[i%3]; let x=100+Math.random()*640,y=100+Math.random()*400; enemies.push(createEnemy(type,x,y));} els.msg.textContent='WAVE '+w+' - REACH THE EXIT!';}
spawnWave(1);
function isWallTile(tx,ty){return tx<0||ty<0||tx>=level.cols||ty>=level.rows||level.tiles[ty][tx]===1;}
function collideCircle(px,py,r){let cell=40; let minTx=Math.floor((px-r)/cell),maxTx=Math.floor((px+r)/cell),minTy=Math.floor((py-r)/cell),maxTy=Math.floor((py+r)/cell); for(let ty=minTy;ty<=maxTy;ty++)for(let tx=minTx;tx<=maxTx;tx++){if(isWallTile(tx,ty)){let rx=tx*cell,ry=ty*cell; let cx=Math.max(rx,Math.min(px,rx+cell)),cy=Math.max(ry,Math.min(py,ry+cell)); let dx=px-cx,dy=py-cy; if(dx*dx+dy*dy<r*r) return true;}} return false;}
function movePlayer(dt){let ax=0,ay=0; if(keys['arrowleft']||keys['a'])ax-=1; if(keys['arrowright']||keys['d'])ax+=1; if(keys['arrowup']||keys['w'])ay-=1; if(keys['arrowdown']||keys['s'])ay+=1; ax+=joy.x; ay+=joy.y; let len=Math.hypot(ax,ay); if(len>1){ax/=len;ay/=len;}
 if(ax||ay){player.vx+=ax*1200*dt; player.vy+=ay*1200*dt; coyote=0.1;} else {player.vx-=player.vx*10*dt; player.vy-=player.vy*10*dt; if(coyote>0)coyote-=dt;}
 let sp=Math.hypot(player.vx,player.vy); if(sp>240){player.vx=player.vx/sp*240;player.vy=player.vy/sp*240;}
 let nx=player.x+player.vx*dt; if(!collideCircle(nx,player.y,player.r))player.x=nx; else player.vx=0;
 let ny=player.y+player.vy*dt; if(!collideCircle(player.x,ny,player.r))player.y=ny; else player.vy=0;
 // crates
 level.crates.forEach(c=>{let d=Math.hypot(player.x-c.x,player.y-c.y); if(d<player.r+c.r){c.hp-=dt*3; if(c.hp<=0){c.dead=true; freeze.energy=Math.min(100,freeze.energy+20); beep(600,0.15,'square');} }}); level.crates=level.crates.filter(c=>!c.dead);
 level.anomalies.forEach(a=>{if(Math.hypot(player.x-a.x,player.y-a.y)<a.r) freeze.drain(20*dt);});
}
window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true; if(e.key===' '){e.preventDefault();} if(e.key.toLowerCase()==='p'||e.key==='Escape'){paused=!paused; els.pauseMenu.style.display=paused?'flex':'none';} if(e.key===' '&&!freeze.active)beep(880,0.1);}});
window.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
const joyEl=document.getElementById('joy'); const stick=document.getElementById('stick'); let joyId=null;
function joyMove(e){let r=joyEl.getBoundingClientRect(); let cx=r.left+r.width/2, cy=r.top+r.height/2; let dx=e.clientX-cx, dy=e.clientY-cy; let d=Math.hypot(dx,dy); let max=35; if(d>max){dx=dx/d*max; dy=dy/d*max;} joy.x=dx/max; joy.y=dy/max; stick.style.left=(31+dx)+'px'; stick.style.top=(31+dy)+'px';}
joyEl.addEventListener('touchstart',e=>{e.preventDefault(); joyId=e.changedTouches[0].identifier; joyMove(e.changedTouches[0]);},{passive:false});
joyEl.addEventListener('touchmove',e=>{e.preventDefault(); for(let t of e.changedTouches) if(t.identifier===joyId) joyMove(t);},{passive:false});
function joyEnd(e){for(let t of e.changedTouches) if(t.identifier===joyId){joyId=null; joy.x=0; joy.y=0; stick.style.left='31px'; stick.style.top='31px';}}
joyEl.addEventListener('touchend',joyEnd); joyEl.addEventListener('touchcancel',joyEnd);
const fBtn=document.getElementById('freezeBtn'); fBtn.addEventListener('touchstart',e=>{e.preventDefault(); touchFreeze=true;},{passive:false}); fBtn.addEventListener('touchend',e=>{e.preventDefault(); touchFreeze=false;},{passive:false}); fBtn.addEventListener('mousedown',()=>touchFreeze=true); fBtn.addEventListener('mouseup',()=>touchFreeze=false);
document.getElementById('resumeBtn').addEventListener('click',()=>{paused=false; els.pauseMenu.style.display='none';});
document.getElementById('restartBtn').addEventListener('click',()=>{paused=false; els.pauseMenu.style.display='none'; player.hp=100; player.x=60; player.y=60; player.vx=0; player.vy=0; level=gen.generate(21,15); spawnWave(wave);});
document.getElementById('quitBtn').addEventListener('click',()=>{paused=false; els.pauseMenu.style.display='none'; player.hp=100; elapsed=0; wave=1; level=gen.generate(21,15); player.x=60; player.y=60; spawnWave(1);});
function explode(e){e.dead=true; beep(80,0.4,'sawtooth',0.15); if(Math.hypot(player.x-e.x,player.y-e.y)<70) player.hp-=25;}
function loop(now){requestAnimationFrame(loop); let dt=Math.min(0.033,(now-last)/1000); last=now; if(paused) return; elapsed+=dt; let holding=keys[' ']||touchFreeze; let was=freeze.active; freeze.update(dt,holding); if(freeze.active&&!was) beep(1200,0.2,'sine'); if(!freeze.active&&was) beep(400,0.2,'sine'); movePlayer(dt);
 enemies.forEach(e=>{updateEnemy(e,player,dt,freeze.active,level.tiles,level.cols,level.rows,40); let d=Math.hypot(player.x-e.x,player.y-e.y); if(e.type==='bomber'&&e.active&&d<42){explode(e); return;} if(d<player.r+e.r&&e.hitCd<=0){player.hp-=15; e.hitCd=1; beep(150,0.2,'sawtooth',0.12);}});
 enemies=enemies.filter(e=>!e.dead);
 if(Math.hypot(player.x-level.exit.x,player.y-level.exit.y)<26){let best=parseFloat(localStorage.getItem('chronoMazeBestTime')||'9999'); if(elapsed<best) localStorage.setItem('chronoMazeBestTime',elapsed); let hs=parseInt(localStorage.getItem('chronoMazeHighScore')||'0'); if(wave>hs) localStorage.setItem('chronoMazeHighScore',wave); wave++; level=gen.generate(21,15); player.x=60; player.y=60; player.vx=0; player.vy=0; spawnWave(wave); beep(900,0.3,'sine');}
 if(player.hp<=0){player.hp=100; elapsed=0; wave=1; level=gen.generate(21,15); player.x=60; player.y=60; player.vx=0; player.vy=0; spawnWave(1); els.msg.textContent='GAME OVER - RESTARTED'; beep(100,0.5,'sawtooth');}
 frozenParticles=[]; if(freeze.active){for(let i=0;i<10;i++) frozenParticles.push({x:Math.random()*840,y:Math.random()*600});}
 draw(ctx,{level,player,enemies,freeze,frozenParticles}); updateHUD({player,wave,freeze,elapsed,level,enemies},els);}
requestAnimationFrame(loop);
