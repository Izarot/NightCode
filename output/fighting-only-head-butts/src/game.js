// Main game module
const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
let width=1920,height=1080;
function resize(){const r=Math.min(window.innerWidth/1920,window.innerHeight/1080);canvas.style.width=1920*r+'px';canvas.style.height=1080*r+'px';canvas.width=1920;canvas.height=1080;}window.addEventListener('resize',resize);resize();

// Audio
const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
function playSound(freq,dur,type='sine'){const o=audioCtx.createOscillator();const g=audioCtx.createGain();o.type=type;o.frequency.value=freq;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.setValueAtTime(0.3,0);g.gain.exponentialRampToValueAtTime(0.001,dur);o.stop(audioCtx.currentTime+dur);}function sfxImpact(){playSound(80,'0.1','square');playSound(120,'0.15','triangle');}
function sfxDash(){playSound(200,'0.1','sawtooth');}
function sfxWindup(){playSound(150,'0.2','sine');}

// Input
const keys={};
window.addEventListener('keydown',e=>{keys[e.code]=true;});
window.addEventListener('keyup',e=>{keys[e.code]=false;});

// Players
const p1=new Player(1,400,500,'#ff3b3b');
const p2=new Player(2,1520,500,'#00d4ff');
const ui=new UI();
let particles=[];
let screenShake=0;
let hitStop=0;
let roundState='PLAYING';
let winner='';

function getInput(p){return{left:keys[p.id===1?'ArrowLeft':'KeyA']||keys[p.id===1?'KeyA':'ArrowLeft'],right:keys[p.id===1?'ArrowRight':'KeyD']||keys[p.id===1?'KeyD':'ArrowRight'],attack:keys[p.id===1?'Space':'KeyJ']||keys[p.id===1?'KeyJ':'Space'],dash:keys[p.id===1?'ShiftLeft':'KeyK']||keys[p.id===1?'KeyK':'ShiftLeft']};}

function checkCollision(a,b){
  const d=dist(a,b);
  if(d<a.radius+b.radius){
    const nx=(b.x-a.x)/d;const ny=(b.y-a.y)/d;
    const rvx=a.vx-b.vx;rvy=a.vy-b.vy;
    const velAlongNormal=rvx*nx+rvy*ny;
    if(velAlongNormal<0){
      const e=0.7;
      let j=-(1+e)*velAlongNormal/(1/a.radius+1/b.radius);
      const impulseX=nx*j;const impulseY=ny*j;
      a.vx-=impulseX/a.radius;a.vy-=impulseY/a.radius;
      b.vx+=impulseX/b.radius;b.vy+=impulseY/b.radius;
      return {nx,ny,vel:velAlongNormal,d};
    }
  }
  return null;
}

function createParticles(x,y){for(let i=0;i<15;i++){particles.push({x,y,vx:(Math.random()-0.5)*0.6,vy:(Math.random()-0.5)*0.6,life:30});}}

function gameLoop(){
  if(hitStop>0){hitStop--;requestAnimationFrame(gameLoop);return;}
  ctx.clearRect(0,0,width,height);
  const input1=getInput(p1);const input2=getInput(p2);
  p1.update(input1);p2.update(input2);
  // Headbutt hitbox
  if(p1.windup>0&&p1.windup<10){p1.hitbox={x:p1.x+p1.facing*30,y:p1.y,vx:p1.vx,vy:p1.vy,radius:18};}
  if(p2.windup>0&&p2.windup<10){p2.hitbox={x:p2.x+p2.facing*30,y:p2.y,vx:p2.vx,vy:p2.vy,radius:18};}
  // Check headbutt collisions
  if(p1.hitbox&&dist(p1.hitbox,p2)<p1.hitbox.radius+p2.radius-4){
    const impact=vecMag({x:p1.vx,y:p1.vy});
    if(impact>PHYSICS.IMPACT_THRESHOLD){sfxImpact();createParticles(p2.x,p2.y);screenShake=10;hitStop=3;p2.health-=impact*3;p2.daze+=impact*2;p2.stunTimer=PHYSICS.STUN_DURATION;p1.combo++;p1.lastHitTime=180;ui.updateHighScore(p1.combo);}
  }
  if(p2.hitbox&&dist(p2.hitbox,p1)<p2.hitbox.radius+p1.radius-4){
    const impact=vecMag({x:p2.vx,y:p2.vy});
    if(impact>PHYSICS.IMPACT_THRESHOLD){sfxImpact();createParticles(p1.x,p1.y);screenShake=10;hitStop=3;p1.health-=impact*3;p1.daze+=impact*2;p1.stunTimer=PHYSICS.STUN_DURATION;p2.combo++;p2.lastHitTime=180;ui.updateHighScore(p2.combo);}
  }
  // Body collision
  const col=checkCollision(p1,p2);
  if(col){sfxImpact();createParticles((p1.x+p2.x)/2,(p1.y+p2.y)/2);}
  // Particles
  for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.life--;if(p.life<=0)particles.splice(i,1);}
  // Screen shake
  if(screenShake>0){ctx.save();ctx.translate((Math.random()-0.5)*screenShake,(Math.random()-0.5)*screenShake);screenShake--;}
  // Draw
  p1.draw(ctx,0);p2.draw(ctx,0);
  // Particles
  for(const p of particles){ctx.fillStyle='#ffea00';ctx.fillRect(p.x,p.y,3,3);}
  if(screenShake>0)ctx.restore();
  ui.update();
  ui.draw(ctx,p1,p2);
  // Win check
  if(p1.health<=0||p2.health<=0){const winner=p1.health<=0?'Player 2':'Player 1';ui.setRound(winner+' K.O.!');roundState='ENDED';}
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
