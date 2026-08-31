// Beat-Jump - Rhythm Platformer
const c=document.getElementById('gameCanvas');
const ctx=c.getContext('2d');
const overlay=document.getElementById('overlay');
const startBtn=document.getElementById('startBtn');

// Responsive canvas
function resize(){
  const dpr=window.devicePixelRatio||1;
  c.width=window.innerWidth*dpr;
  c.height=window.innerHeight*dpr;
  ctx.setTransform(1,0,0,1,0,0);
  ctx.scale(dpr,dpr);
  W=window.innerWidth;H=window.innerHeight;
  scale=Math.min(W/1280,H/720);
  offX=(W-1280*scale)/2;
  offY=(H-720*scale)/2;
}
let W,H,scale,offX,offY;
window.addEventListener('resize',resize);
resize();

// Vibrant neon palette
const COL={bg:'#0a0420',bg2:'#1a0a4a',cyan:'#00f0ff',magenta:'#ff00ea',lime:'#a8ff00',orange:'#ff8a00',red:'#ff2050',yellow:'#ffea00',purple:'#a855ff',white:'#ffffff'};

// State machine
let state='MENU';
let score=0,combo=0,bestCombo=0;
let meter=100;
let meterDrain=0;
let gameTime=0;
let lastFrame=performance.now();
let beatTime=0;
let cameraX=0;
let particles=[];
let platforms=[];
let collectibles=[];
let player={x:200,y:400,vx:0,vy:0,onGround:false,size:20,w:16,h:32,jumping:false};
let beatCue=null;
let bpm=120;
let beatInterval=60/bpm;
let nextBeat=0;
let cues=[];
let timer=0;
let bestScore=parseInt(localStorage.getItem('bj_best'))||0;

// Audio
let audioCtx=null;
let synthStarted=false;

// Web Audio for music & SFX
function initAudio(){
  if(audioCtx)return;
  audioCtx=new(window.AudioContext||window.webkitAudioContext)();
}

function playNote(freq,dur=0.1,type='sine',vol=0.15){
  if(!audioCtx)return;
  const o=audioCtx.createOscillator();
  const g=audioCtx.createGain();
  o.type=type;o.frequency.value=freq;
  g.gain.setValueAtTime(vol,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
  o.connect(g);g.connect(audioCtx.destination);
  o.start();o.stop(audioCtx.currentTime+dur);
}

function playKick(){playNote(60,0.15,'sine',0.2);}
function playPerfect(){playNote(880,0.1,'triangle',0.15);playNote(1320,0.15,'sine',0.1);}
function playMiss(){playNote(150,0.2,'sawtooth',0.1);}
function playCollect(){playNote(1200,0.08,'sine',0.2);}
function playGameOver(){playNote(200,0.3,'sine',0.2);playNote(150,0.4,'sine',0.15);}

// Beat scheduler
function startBeatTrack(b){
  bpm=b;beatInterval=60/b;
  timer=0;cues=[];
  for(let i=0;i<200;i++)cues.push({time:i*beatInterval,hit:false});
}

// Level generator
function generateLevel(){
  platforms=[];collectibles=[];
  player.x=200;player.y=400;player.vx=0;player.vy=0;
  let px=200,py=500;
  for(let i=0;i<100;i++){
    py=400+Math.sin(i*0.4)*80+Math.random()*60;
    const moving=i>10&&i%8===0;
    platforms.push({x:px,y:py,w:80,h:14,type:'std',phase:i,baseY:py,moveRange:80,moving,rot:0});
    if(Math.random()<0.3)collectibles.push({x:px+40,y:py-40,collected:false});
    px+=140+Math.random()*60;
    if(i%15===14)px+=80;
  }
}

// Input
let jumpPressed=false;
function jump(){
  if(state!=='PLAYING')return;
  if(player.onGround&&!jumpPressed){
    jumpPressed=true;
    const tune=Math.min(1.2,Math.max(0.85,bpm/120));
    player.vy=-820*tune;
    player.jumping=true;
    player.onGround=false;
  }
}
document.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();jump();}});
document.addEventListener('keyup',e=>{if(e.code==='Space')jumpPressed=false;});
c.addEventListener('touchstart',e=>{e.preventDefault();jump();},{passive:false});
c.addEventListener('touchend',e=>{jumpPressed=false;});
c.addEventListener('mousedown',jump);

startBtn.onclick=()=>{initAudio();state='PLAYING';score=0;combo=0;bestCombo=0;meter=100;meterDrain=0;cameraX=0;particles=[];generateLevel();startBeatTrack(120);overlay.classList.add('hidden');};

// Spawn particles
function spark(x,y,col,n=8){
  for(let i=0;i<n;i++){
    const a=Math.random()*Math.PI*2;
    const sp=80+Math.random()*150;
    particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-50,life:0.5,col,size:2+Math.random()*3});
  }
}

// Check landing timing
function checkBeat(){
  if(cues.length===0)return null;
  const cue=cues[0];
  const diff=timer-cue.time;
  return diff;
}

// Game loop
function loop(now){
  const dt=Math.min(0.033,(now-lastFrame)/1000);
  lastFrame=now;
  ctx.fillStyle=COL.bg;ctx.fillRect(0,0,W,H);

  if(state==='PLAYING'){
    timer+=dt;
    meterDrain+=dt;
    if(meterDrain>1){meter-=10;meterDrain=0;}
    if(meter<=0){state='GAMEOVER';playGameOver();showGameOver();}

    // Beat scheduling
    if(timer>nextBeat+beatInterval){nextBeat+=beatInterval;if(Math.random()<0.6)playKick();}

    // Check beats
    while(cues.length>0&&timer>cues[0].time+0.3){
      if(!cues[0].hit&&player.jumping&&!player.onGround){
        // Missed landing
        combo=0;meter-=5;playMiss();
        spark(player.x,cameraX*-1+player.y+50,COL.red,6);
      }
      cues.shift();
    }

    // Player physics
    player.vy+=1800*dt;
    player.x+=600*dt;
    cameraX=player.x-300;

    // Platform motion
    platforms.forEach(p=>{
      if(p.moving)p.y=p.baseY+Math.sin(gameTime*2+p.phase)*p.moveRange;
    });

    // Collision
    player.onGround=false;
    platforms.forEach(p=>{
      const px=p.x-cameraX,py=p.y;
      if(px+p.w>player.x-15&&px<player.x+15&&py-20<player.y+32&&py+14>player.y){
        if(player.vy>=0&&player.y+32<=py+5){
          player.y=py-32;player.vy=0;player.onGround=true;
          if(player.jumping){
            player.jumping=false;
            const diff=checkBeat();
            if(diff!==null&&Math.abs(diff)<0.15){
              combo++;bestCombo=Math.max(bestCombo,combo);
              const mult=combo*combo;
              score+=100*mult;
              meter=Math.min(100,meter+10);
              playPerfect();
              spark(player.x,player.y+32,COL.lime,12);
              if(score>bestScore){bestScore=score;localStorage.setItem('bj_best',bestScore);}
            }else{
              combo=0;meter-=5;playMiss();
              spark(player.x,player.y+32,COL.orange,6);
            }
          }
        }
      }
    });

    // Collectibles
    collectibles.forEach(c=>{
      if(!c.collected&&Math.abs(c.x-player.x)<25&&Math.abs(c.y-player.y)<35){
        c.collected=true;meter=Math.min(100,meter+20);score+=50;playCollect();
        spark(c.x-cameraX,c.y,COL.yellow,10);
      }
    });

    if(player.y>800){state='GAMEOVER';playGameOver();showGameOver();}

    gameTime+=dt;
  }

  // Particles
  particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=400*dt;p.life-=dt;});
  particles=particles.filter(p=>p.life>0);

  // ====== RENDER ======
  ctx.save();
  ctx.translate(offX,offY);ctx.scale(scale,scale);

  // Parallax bg
  const bgGrad=ctx.createLinearGradient(0,0,0,720);
  bgGrad.addColorStop(0,'#1a0a4a');bgGrad.addColorStop(1,'#0a0420');
  ctx.fillStyle=bgGrad;ctx.fillRect(0,0,1280,720);
  // Far stars
  ctx.fillStyle=COL.cyan;
  for(let i=0;i<50;i++){
    const sx=(i*137-cameraX*0.1)%1300;
    const sy=(i*91)%720;
    ctx.globalAlpha=0.4+Math.sin(gameTime+i)*0.3;
    ctx.fillRect(sx,sy,2,2);
  }
  ctx.globalAlpha=1;
  // Mid grid
  ctx.strokeStyle='rgba(255,0,234,0.15)';ctx.lineWidth=1;
  for(let i=0;i<15;i++){const x=(i*100-cameraX*0.3)%1500-100;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,720);ctx.stroke();}

  if(state==='PLAYING'||state==='PAUSED'||state==='GAMEOVER'){
    // Beat cue line
    if(cues.length>0){
      const cue=cues[0];
      const diff=timer-cue.time;
      const proximity=Math.max(0,1-Math.abs(diff)/0.15);
      ctx.strokeStyle=COL.cyan;ctx.lineWidth=2+proximity*4;
      ctx.globalAlpha=0.3+proximity*0.7;
      const cx=player.x-cameraX;
      ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,720);ctx.stroke();
      ctx.globalAlpha=1;
    }

    // Platforms
    platforms.forEach(p=>{
      if(p.x-cameraX<-200||p.x-cameraX>1480)return;
      const px=p.x-cameraX,py=p.y;
      const pulse=0.5+Math.abs(Math.sin(gameTime*4+p.phase))*0.5;
      ctx.fillStyle=p.moving?COL.magenta:COL.purple;
      ctx.shadowColor=p.moving?COL.magenta:COL.cyan;
      ctx.shadowBlur=10+pulse*10;
      ctx.fillRect(px,py,p.w,p.h);
      ctx.shadowBlur=0;
      ctx.fillStyle=COL.white;ctx.globalAlpha=0.5+pulse*0.3;
      ctx.fillRect(px+2,py+2,p.w-4,3);
      ctx.globalAlpha=1;
    });

    // Collectibles
    collectibles.forEach(c=>{
      if(c.collected)return;
      if(c.x-cameraX<-50||c.x-cameraX>1330)return;
      const cx=c.x-cameraX,cy=c.y;
      ctx.fillStyle=COL.yellow;
      ctx.shadowColor=COL.yellow;ctx.shadowBlur=15;
      ctx.beginPath();ctx.arc(cx,cy,8,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    });

    // Player
    const py=player.y;
    ctx.fillStyle=COL.lime;
    ctx.shadowColor=COL.lime;ctx.shadowBlur=20;
    ctx.beginPath();ctx.arc(player.x-cameraX,py-16,16,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle=COL.cyan;
    ctx.fillRect(player.x-cameraX-8,py-8,16,24);
    // Eye
    ctx.fillStyle=COL.bg;
    ctx.beginPath();ctx.arc(player.x-cameraX+3,py-18,2,0,Math.PI*2);ctx.fill();
  }

  // Particles
  particles.forEach(p=>{
    ctx.fillStyle=p.col;
    ctx.globalAlpha=Math.max(0,p.life*2);
    ctx.fillRect(p.x-cameraX,p.y,p.size,p.size);
  });
  ctx.globalAlpha=1;

  ctx.restore();

  // ===== HUD =====
  drawHUD();

  requestAnimationFrame(loop);
}

function drawHUD(){
  const ux=offX,uy=offY,us=scale;
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);

  // Score
  ctx.fillStyle=COL.white;ctx.font='bold 28px Arial';
  ctx.shadowColor=COL.cyan;ctx.shadowBlur=8;
  ctx.fillText('SCORE: '+score,20,40);
  ctx.fillStyle=COL.yellow;ctx.font='16px Arial';
  ctx.fillText('BEST: '+bestScore,20,65);

  // Combo
  ctx.fillStyle=combo>0?COL.lime:COL.white;ctx.font='bold 32px Arial';
  ctx.textAlign='center';
  const comboTxt='x'+(combo*combo);
  ctx.shadowColor=combo>0?COL.lime:COL.cyan;ctx.shadowBlur=12;
  ctx.fillText(comboTxt,W/2,50);
  ctx.shadowBlur=0;
  ctx.font='14px Arial';ctx.fillStyle=COL.cyan;
  ctx.fillText('COMBO: '+combo,W/2,72);
  ctx.textAlign='left';

  // Rhythm meter
  const mx=W/2-150,my=H-50,mw=300,mh=24;
  ctx.fillStyle='rgba(255,255,255,0.1)';
  ctx.fillRect(mx,my,mw,mh);
  const mcol=meter<30?COL.red:meter<60?COL.orange:COL.lime;
  ctx.fillStyle=mcol;
  ctx.shadowColor=mcol;ctx.shadowBlur=10;
  ctx.fillRect(mx,my,mw*meter/100,mh);
  ctx.shadowBlur=0;
  ctx.strokeStyle=COL.white;ctx.lineWidth=2;
  ctx.strokeRect(mx,my,mw,mh);
  ctx.fillStyle=COL.white;ctx.font='bold 14px Arial';ctx.textAlign='center';
  ctx.fillText('RHYTHM '+Math.floor(meter)+'%',W/2,my+17);

  // Beat indicator
  const bx=W-50,by=H-80;
  const beatPulse=Math.abs(Math.sin(gameTime*Math.PI*bpm/60));
  ctx.fillStyle=COL.cyan;
  ctx.shadowColor=COL.cyan;ctx.shadowBlur=10+beatPulse*10;
  ctx.beginPath();ctx.arc(bx,by,10+beatPulse*4,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;

  // Speedrun timer
  ctx.fillStyle=COL.magenta;ctx.font='16px Arial';
  ctx.fillText('⏱ '+timer.toFixed(1)+'s',W-110,40);

  ctx.restore();
}

function showGameOver(){
  overlay.classList.remove('hidden');
  overlay.innerHTML=`<h1>GAME OVER</h1><p>Score: ${score}<br>Best Combo: x${bestCombo*bestCombo}<br>High Score: ${bestScore}</p><button class="btn" id="retryBtn">RETRY</button>`;
  document.getElementById('retryBtn').onclick=()=>{overlay.classList.add('hidden');startBtn.click();};
}

requestAnimationFrame(loop);
