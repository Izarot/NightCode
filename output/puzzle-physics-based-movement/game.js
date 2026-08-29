(function(){
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
let w=canvas.width=window.innerWidth,h=canvas.height=window.innerHeight;
window.addEventListener('resize',()=>{w=canvas.width=window.innerWidth;h=canvas.height=window.innerHeight});

// Audio
const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
function playSound(freq,dur,type='sine'){
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=type;o.frequency.value=freq;o.connect(g);g.connect(audioCtx.destination);
  g.gain.setValueAtTime(0.001,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.15,audioCtx.currentTime+0.01);
  g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
  o.start();o.stop(audioCtx.currentTime+dur);
}

// Game state
let gravity=[0,1800],lastShift=0,cooldown=400,moves=0,highScore=localStorage.getItem('highScore')||0,time=0,running=true;
const player={x:100,y:h/2,r:24,vx:0,vy:0,material:'metal'};
const gravityDir=[0,1];
const levels=[
 {walls:[[0,h-60,w,60],[0,0,40,h],[w-40,0,40,h]],ice:[],sticky:[],exit:{x:w-100,y:h/2,r:30},start:{x:100,y:h/2}},
 {walls:[[0,h-120,w,60],[0,0,40,h],[w-40,0,40,h]],ice:[[w/2-50,h-120,100,20]],sticky:[],exit:{x:w-100,y:h/2,r:30},start:{x:100,y:h/2}}
];
let level=0,fragments=[];

function resetPlayer(){player.x=levels[level].start.x;player.y=levels[level].start.y;player.vx=0;player.vy=0;}
resetPlayer();

function getMaterial(x,y){const L=levels[level];
 for(const i of L.ice)if(x>=i.x&&x<=i.x+i.w&&y>=i.y&&y<=i.y+i.h)return'ice';
 for(const s of L.sticky)if(x>=s.x&&x<=s.x+s.w&&y>=s.y&&y<=s.y+s.h)return'sticky';
 return'metal';
}

function shiftGravity(dir){
 const now=performance.now();
 if(now-lastShift<cooldown)return;
 lastShift=now;moves++;
 if(dir==='up')gravity=[0,-1800];
 else if(dir==='down')gravity=[0,1800];
 else if(dir==='left')gravity=[-1800,0];
 else if(dir==='right')gravity=[1800,0];
 playSound(200,0.2,'square');
}

// Input
window.addEventListener('keydown',e=>{
 if(!running)return;
 if(e.key==='ArrowUp'||e.key==='w')shiftGravity('up');
 if(e.key==='ArrowDown'||e.key==='s')shiftGravity('down');
 if(e.key==='ArrowLeft'||e.key==='a')shiftGravity('left');
 if(e.key==='ArrowRight'||e.key==='d')shiftGravity('right');
 if(e.key===' ')shiftGravity('down');
});

// Touch buttons
const btnSize=60;
function createBtn(label,pos){
 const b=document.createElement('button');b.textContent=label;b.style.cssText=`position:fixed;${pos};width:${btnSize}px;height:${btnSize}px;font-size:20px;background:rgba(255,255,255,0.2);border:2px solid #ff00cc;border-radius:50%;color:#fff`;document.body.appendChild(b);
 b.addEventListener('touchstart',e=>{e.preventDefault();shiftGravity(label.toLowerCase());});
 return b;
}
createBtn('↑','top:60%;left:50%;transform:translateX(-50%)');
createBtn('↓','top:70%;left:50%;transform:translateX(-50%)');
createBtn('←','top:65%;left:30%');
createBtn('→','top:65%;right:30%');

// Physics
const fps=60,dt=1/60;
function update(){
 if(!running)return;
 const L=levels[level];
 // Apply gravity
 player.vx+=gravity[0]*dt;player.vy+=gravity[1]*dt;
 // Terminal velocity
 const spd=Math.hypot(player.vx,player.vy);
 if(spd>1200){const f=1200/spd;player.vx*=f;player.vy*=f;}
 // Air resistance
 player.vx*=0.999;player.vy*=0.999;
 // Move
 player.x+=player.vx*dt;player.y+=player.vy*dt;
 // Collisions
 for(const wall of L.walls){
  if(circleRect(player.x,player.y,player.r,wall.x,wall.y,wall.w,wall.h)){
   const n=closestNormal(player.x,player.y,wall.x,wall.y,wall.w,wall.h);
   const vdotn=player.vx*n.x+player.vy*n.y;
   if(vdotn<0){player.vx-=vdotn*n.x*(1+0.35);player.vy-=vdotn*n.y*(1+0.35);}
   const pen=player.r-distToRect(player.x,player.y,wall.x,wall.y,wall.w,wall.h);
   if(pen>0){player.x+=n.x*pen;player.y+=n.y*pen;}
  }
 }
 // Friction
 const mat=getMaterial(player.x,player.y);
 if(mat==='metal')player.vx*=0.98,player.vy*=0.98;
 else if(mat==='ice')player.vx*=0.998,player.vy*=0.998;
 else if(mat==='sticky')player.vx*=0.94,player.vy*=0.94;
 // Exit
 const ex=L.exit;if(Math.hypot(player.x-ex.x,player.y-ex.y)<player.r+ex.r){completeLevel();}
}

function circleRect(cx,cy,r,rx,ry,rw,rh){return cx>=rx-r&&cx<=rx+rw+r&&cy>=ry-r&&cy<=ry+rh+r&&((cx>=rx&&cx<=rx+rw)||(cy>=ry&&cy<=ry+rh)||(Math.hypot(cx-(rx+rw/2),cy-(ry+rh/2))<=r+Math.hypot(rw,rh)/2));}
function closestNormal(cx,cy,rx,ry,rw,rh){
 const dx=cx-(rx+rw/2),dy=cy-(ry+rh/2),adx=Math.abs(dx),ady=Math.abs(dy);
 if(adx>rw/2&&ady>rh/2)return{dx:dx/Math.hypot(dx,dy),dy:dy/Math.hypot(dx,dy)};
 if(adx>rw/2)return{dx:dx>0?1:-1,dy:0};return{dx:0,dy:dy>0?1:-1};
}
function distToRect(cx,cy,rx,ry,rw,rh){const dx=Math.max(rx-cx,0,Math.min(cx-rx-rw,0)),dy=Math.max(ry-cy,0,Math.min(cy-ry-rh,0));return Math.hypot(dx,dy);}

function completeLevel(){running=false;playSound(600,0.5,'sine');
 setTimeout(()=>{level++;if(level>=levels.length){alert('You Win! High Score: '+highScore);return;}
 resetPlayer();running=true;time=0;moves=0;},
 1000);
}

// Render
const trail=[];
function render(){
 ctx.clearRect(0,0,w,h);
 const L=levels[level];
 // Walls
 ctx.fillStyle='#444';
 for(const wall of L.walls){ctx.fillRect(wall.x,wall.y,wall.w,wall.h);}
 // Ice
 ctx.fillStyle='#00f7ff';
 for(const i of L.ice){ctx.fillRect(i.x,i.y,i.w,i.h);}
 // Exit portal
 const ex=L.exit;
 ctx.save();ctx.translate(ex.x,ex.y);
 ctx.fillStyle=`hsl(${Date.now()/10%360},80%,60%)`;
 ctx.beginPath();ctx.arc(0,0,ex.r,0,Math.PI*2);ctx.fill();
 ctx.shadowBlur=20;ctx.shadowColor='#fff';
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,0,ex.r*0.6,0,Math.PI*2);ctx.fill();
 ctx.restore();
 // Player
 ctx.save();ctx.translate(player.x,player.y);
 ctx.shadowBlur=15;ctx.shadowColor='#00f7ff';
 const grad=ctx.createRadialGradient(-player.r/2,-player.r/2,player.r*0.2,0,0,player.r);
 grad.addColorStop(0,'#aaa');grad.addColorStop(1,'#333');
 ctx.fillStyle=grad;ctx.beginPath();ctx.arc(0,0,player.r,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#00f7ff';ctx.lineWidth=3;ctx.stroke();
 ctx.restore();
 // Trail
 if(trail.length>10)trail.shift();
 trail.push({x:player.x,y:player.y});
 ctx.fillStyle='rgba(0,247,255,0.4)';
 for(const p of trail){ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();}
 // HUD
 ctx.fillStyle='#fff';ctx.font='18px monospace';
 ctx.fillText('SECTOR '+(level+1)+' // GRAVITY CORE',20,30);
 ctx.fillText('SHIFTS: '+moves,20,55);
 ctx.fillText('TIME: '+(time/1000).toFixed(2)+'s',20,80);
 ctx.fillText('BEST: '+(highScore/1000).toFixed(2)+'s',20,105);
 // Cooldown ring
 const elapsed=performance.now()-lastShift;
 const pct=Math.min(elapsed/cooldown,1);
 ctx.strokeStyle='#ff00cc';ctx.lineWidth=4;
 ctx.beginPath();ctx.arc(player.x,player.y-player.r-15,player.r+5,0,Math.PI*2*pct);ctx.stroke();
}

// Game loop
let last=0;
function loop(timestamp){
 if(!last)last=timestamp;
 const delta=timestamp-last;last=timestamp;
 if(running){time+=delta;update();}
 render();
 requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
})();
