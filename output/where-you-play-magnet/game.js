// Junkyard Magnet Game
const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
let cw, ch;
function resize(){
  const vw=window.innerWidth, vh=window.innerHeight;
  const aspect=16/9;
  if(vw/vh>aspect){cw=vh*aspect; ch=vh;} else {cw=vw; ch=vw/aspect;}
  canvas.width=cw; canvas.height=ch;
}
window.addEventListener('resize',resize); resize();
// Input
const keys={};
window.addEventListener('keydown',e=>keys[e.key]=true);
window.addEventListener('keyup',e=>{keys[e.key]=false; if(e.key==='Shift') keys['Shift']=false;});
// Audio
const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
function playBeep(){
  const osc=audioCtx.createOscillator();
  osc.type='sine'; osc.frequency.setValueAtTime(440, audioCtx.currentTime);
  osc.connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime+0.1);
}
// Game Objects
class Vector{constructor(x=0,y=0){this.x=x;this.y=y;} add(v){this.x+=v.x; this.y+=v.y; return this;} mul(s){this.x*=s; this.y*=s; return this;} len(){return Math.hypot(this.x,this.y);} normalize(){const l=this.len(); if(l>0){this.x/=l; this.y/=l;} return this;}}
class Player{constructor(){this.pos=new Vector(cw/2,ch/2); this.vel=new Vector(); this.speed=200; this.acc=800; this.friction=0.95; this.energy=100; this.energyRegen=2; this.magnetRadius=250; this.magnetActive=false; this.magnetMode='pull';}
  update(dt){
    // Movement
    let dir=new Vector();
    if(keys['w']) dir.y-=1; if(keys['s']) dir.y+=1; if(keys['a']) dir.x-=1; if(keys['d']) dir.x+=1;
    if(dir.len()>0){dir.normalize(); this.vel.add(dir.mul(this.acc*dt)); if(this.vel.len()>this.speed) this.vel.normalize().mul(this.speed);} else {this.vel.mul(this.friction);}
    this.pos.add(this.vel.mul(dt));
    // Clamp to bounds
    this.pos.x=Math.max(0,cw*Math.min(1,this.pos.x/cw));
    this.pos.y=Math.max(0,ch*Math.min(1,this.pos.y/ch));
    // Energy
    if(this.magnetActive){this.energy-=5*dt; if(this.energy<0) this.energy=0;} else {this.energy+=this.energyRegen*dt; if(this.energy>100) this.energy=100;}
  }
  draw(){
    ctx.fillStyle='#0cf'; ctx.beginPath(); ctx.arc(this.pos.x,this.pos.y,20,0,Math.PI*2); ctx.fill();
    // Magnet aura
    if(this.magnetActive){
      const radius=this.magnetRadius;
      const grd=ctx.createRadialGradient(this.pos.x,this.pos.y,0,this.pos.x,this.pos.y,radius);
      grd.addColorStop(0,'rgba(0,200,255,0.3)'); grd.addColorStop(1,'rgba(0,200,255,0)');
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(this.pos.x,this.pos.y,radius,0,Math.PI*2); ctx.fill();
    }
  }
}
class Object{constructor(x,y){this.pos=new Vector(x,y); this.vel=new Vector(); this.radius=15; this.mass=1;}
  update(dt){this.pos.add(this.vel.mul(dt));}
  draw(){ctx.fillStyle='#888'; ctx.beginPath(); ctx.arc(this.pos.x,this.pos.y,this.radius,0,Math.PI*2); ctx.fill();}
}
const player=new Player();
const objects=[new Object(200,200),new Object(400,300),new Object(600,400)];
// Timer
let timeLeft=180; let lastTime=performance.now();
// High Score
let highScore=localStorage.getItem('junkyard_highscore')||0;
// Main Loop
function loop(now){
  const dt=(now-lastTime)/1000; lastTime=now; timeLeft=Math.max(0,timeLeft-dt);
  // Update
  player.update(dt);
  objects.forEach(o=>o.update(dt));
  // Magnet logic
  if(keys['e']||keys['r']){
    const active=keys['e'];
    if(!player.magnetActive){player.magnetActive=true; playBeep();}
    player.magnetMode=active?'pull':'push';
    const radius=player.magnetRadius;
    objects.forEach(o=>{
      const dir=new Vector(o.pos.x-player.pos.x,o.pos.y-player.pos.y);
      const dist=dir.len();
      if(dist<radius){
        const k=1500; const force=k/(dist*dist); const maxPull=300;
        let f=Math.min(force,maxPull);
        if(player.magnetMode==='push') f=-f;
        dir.normalize().mul(f*dt).add(o.vel);
        o.vel=dir;
      }
    });
  } else {player.magnetActive=false;}
  // Render
  ctx.clearRect(0,0,cw,ch);
  objects.forEach(o=>o.draw());
  player.draw();
  // UI
  // Energy bar
  ctx.fillStyle='#222'; ctx.fillRect(20,20,200,12);
  const energyWidth=200*(player.energy/100);
  let energyColor='#0f0'; if(player.energy<30) energyColor='#f00'; else if(player.energy<60) energyColor='#ff0';
  ctx.fillStyle=energyColor; ctx.fillRect(20,20,energyWidth,12);
  ctx.fillStyle='#fff'; ctx.font='10px monospace'; ctx.fillText(Math.round(player.energy)+'%',20,35);
  // Score
  const score=Math.floor((player.pos.x/2000+player.pos.y/1500)*1000); // dummy
  ctx.fillStyle='#fff'; ctx.font='20px monospace'; ctx.fillText('Score:'+score, cw-120, 30);
  // Timer
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cw/2,30,30,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle=timeLeft<10?'#f00':'#fff'; ctx.font='16px monospace'; ctx.fillText(Math.floor(timeLeft),cw/2-8,40);
  // High Score
  ctx.fillStyle='#fff'; ctx.font='12px monospace'; ctx.fillText('High:'+highScore,cw-120,50);
  if(timeLeft===0){
    // Game over
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,cw,ch);
    ctx.fillStyle='#fff'; ctx.font='30px monospace'; ctx.fillText('Game Over',cw/2-80, ch/2-20);
    if(score>highScore){highScore=score; localStorage.setItem('junkyard_highscore',highScore);}
    return;
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);