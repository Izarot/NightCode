const C=document.getElementById('c');
const X=C.getContext('2d');
const CW=960,CH=540;
function resize(){
  const r=Math.min(window.innerWidth/CW,window.innerHeight/CH);
  C.width=CW;C.height=CH;
  C.style.width=(CW*r)+'px';C.style.height=(CH*r)+'px';
}
window.addEventListener('resize',resize);resize();

const KEY_={};
addEventListener('keydown',e=>{KEY_[e.code]=1;if(e.code==='Space')e.preventDefault();});
addEventListener('keyup',e=>KEY_[e.code]=0);

let touch={x:0,y:0,l:0,r:0,j:0};
C.addEventListener('touchstart',e=>{
  e.preventDefault();
  const r=C.getBoundingClientRect();
  for(let t of e.changedTouches){
    const px=(t.clientX-r.left)/r.width*CW;
    if(px<CW/3)touch.l=1;
    else if(px>2*CW/3)touch.r=1;
    else touch.j=1;
  }
},{passive:false});
C.addEventListener('touchend',()=>{touch.l=touch.r=touch.j=0;});

const AC=new(window.AudioContext||window.webkitAudioContext)();
function snd(f,dur,type='square',vol=0.15){
  try{
    const o=AC.createOscillator(),g=AC.createGain();
    o.type=type;o.frequency.value=f;
    g.gain.setValueAtTime(vol,AC.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,AC.currentTime+dur);
    o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+dur);
  }catch(e){}
}

const HI=parseInt(localStorage.getItem('pp_hi')||'0');

let state='menu',level=0,score=0,timer=0,best=HI,goalFlash=0;

const COLORS={
  bg1:'#1a0033',bg2:'#ff006e',bg3:'#00f5ff',
  p:'#ffd60a',plat:'#8338ec',mov:'#3a86ff',
  goal:'#06ffa5',text:'#ffffff',accent:'#fb5607'
};

function rand(a,b){return a+Math.random()*(b-a);}

const LEVELS=[
  {
    p:{x:80,y:420},goal:{x:800,y:460,w:80,h:60},
    plats:[
      {x:0,y:480,w:960,h:60},
      {x:300,y:380,w:150,h:20},
      {x:550,y:300,w:120,h:20}
    ],
    mov:[{x:200,y:440,w:60,h:60,m:1.5}],
    door:{x:780,y:420,w:20,h:60,open:false}
  },
  {
    p:{x:80,y:420},goal:{x:820,y:200,w:80,h:60},
    plats:[
      {x:0,y:480,w:400,h:60},
      {x:500,y:480,w:200,h:60},
      {x:250,y:300,w:200,h:20},
      {x:700,y:260,w:200,h:20}
    ],
    mov:[
      {x:150,y:440,w:50,h:50,m:1.2},
      {x:550,y:440,w:50,h:50,m:1.2}
    ],
    door:null
  },
  {
    p:{x:60,y:200},goal:{x:860,y:460,w:60,h:60},
    plats:[
      {x:0,y:480,w:300,h:60},
      {x:380,y:480,w:200,h:60},
      {x:660,y:480,w:300,h:60},
      {x:200,y:300,w:100,h:20,trap:true},
      {x:500,y:300,w:100,h:20,trap:true}
    ],
    mov:[
      {x:50,y:440,w:60,h:60,m:1.8},
      {x:400,y:440,w:50,h:50,m:1.0}
    ],
    door:null
  }
];

let cur,player,particles,shakeT;

function loadLevel(i){
  level=i;cur=JSON.parse(JSON.stringify(LEVELS[i]));
  player={x:cur.p.x,y:cur.p.y,vx:0,vy:0,w:28,h:36,g:0,on:false};
  particles=[];shakeT=0;timer=60;
}

function aabb(a,b){
  return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
}

function update(){
  if(state!=='play')return;
  timer-=1/60;
  if(timer<=0){state='over';snd(150,0.5,'sawtooth',0.2);return;}

  const L=KEY_['ArrowLeft']||KEY_['KeyA']||touch.l;
  const R=KEY_['ArrowRight']||KEY_['KeyD']||touch.r;
  const J=KEY_['Space']||KEY_['ArrowUp']||KEY_['KeyW']||touch.j;
  const SL=KEY_['ShiftLeft']||KEY_['ShiftRight'];

  const acc=SL?0.9:0.6;
  if(L)player.vx-=acc;
  if(R)player.vx+=acc;
  player.vx*=0.88;
  player.vy+=0.55;

  if(J&&player.on){
    player.vy=-11;
    player.on=false;
    snd(440,0.1,'square',0.1);
    for(let i=0;i<6;i++)particles.push({x:player.x+player.w/2,y:player.y+player.h,vx:rand(-2,2),vy:rand(-3,-1),life:20,c:COLORS.p});
  }

  player.x+=player.vx;
  player.on=false;

  for(let p of cur.plats){
    if(aabb(player,p)){
      if(p.trap){player.vy=-14;player.x-=player.vx*1.5;shakeT=10;continue;}
      if(player.vy>0&&player.y+player.h-p.y<20){
        player.y=p.y-player.h;player.vy=0;player.on=true;
      }else{
        if(player.vx>0)player.x=p.x-player.w;
        else if(player.vx<0)player.x=p.x+p.w;
        player.vx=0;
      }
    }
  }

  player.y+=player.vy;
  for(let p of cur.plats){
    if(aabb(player,p)){
      if(player.vy>0){player.y=p.y-player.h;player.vy=0;player.on=true;}
      else if(player.vy<0){player.y=p.y+p.h;player.vy=0;}
    }
  }

  for(let m of cur.mov){
    m.vy=m.vy||0;m.vx=m.vx||0;
    m.vy+=0.55;
    m.x+=m.vx;m.y+=m.vy;
    for(let p of cur.plats){
      if(aabb(m,p)){
        if(m.vy>0&&m.y+m.h-p.y<20){m.y=p.y-m.h;m.vy=0;}
        else{m.vx*=-0.3;m.x+=m.vx;}
      }
    }
    if(aabb(player,m)){
      if(player.vx>0){m.vx+=3/m.m;player.vx*=-0.2;}
      if(player.vx<0){m.vx-=3/m.m;player.vx*=-0.2;}
      snd(180,0.05,'triangle',0.08);
    }
  }

  if(cur.door&&!cur.door.open){
    let all=false;
    for(let m of cur.mov){if(aabb(m,cur.door)){all=true;break;}}
    if(all)cur.door.open=true;
  }

  if(aabb(player,cur.goal)){
    const bonus=Math.floor(timer*10);
    score+=100+bonus;
    if(score>best){best=score;localStorage.setItem('pp_hi',best);}
    goalFlash=60;shakeT=15;
    snd(660,0.15,'sine',0.2);setTimeout(()=>snd(880,0.2,'sine',0.2),100);
    if(level<LEVELS.length-1){setTimeout(()=>loadLevel(level+1),800);}
    else{state='end';}
  }

  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.3;p.life--;
    if(p.life<=0)particles.splice(i,1);
  }
  if(shakeT>0)shakeT--;
}

function draw(){
  X.fillStyle=COLORS.bg1;X.fillRect(0,0,CW,CH);
  const grd=X.createLinearGradient(0,0,0,CH);
  grd.addColorStop(0,'#3a0ca3');grd.addColorStop(1,'#1a0033');
  X.fillStyle=grd;X.fillRect(0,0,CW,CH);

  X.save();
  if(shakeT>0){X.translate(rand(-3,3),rand(-3,3));}

  if(state==='menu'){drawMenu();}
  else if(state==='play'){drawGame();}
  else if(state==='over'){drawOver();}
  else if(state==='end'){drawEnd();}

  X.restore();
}

function drawGame(){
  for(let s=0;s<30;s++){
    X.fillStyle=`rgba(255,255,255,${0.3+Math.sin(Date.now()/500+s)*0.2})`;
    X.fillRect((s*73+Date.now()/30)%CW,(s*47)%(CH-100),2,2);
  }

  for(let p of cur.plats){
    X.fillStyle=p.trap?COLORS.accent:COLORS.plat;
    X.fillRect(p.x,p.y,p.w,p.h);
    X.fillStyle='rgba(255,255,255,0.3)';
    X.fillRect(p.x,p.y,p.w,3);
  }

  if(cur.door){
    X.fillStyle=cur.door.open?'#06ffa5':'#fb5607';
    X.fillRect(cur.door.x,cur.door.y,cur.door.w,cur.door.h);
  }

  X.fillStyle=COLORS.goal;
  const pulse=Math.sin(Date.now()/200)*5;
  X.fillRect(cur.goal.x-pulse/2,cur.goal.y-pulse/2,cur.goal.w+pulse,cur.goal.h+pulse);
  X.fillStyle='#ffffff';
  X.font='bold 18px Courier';X.textAlign='center';
  X.fillText('GOAL',cur.goal.x+cur.goal.w/2,cur.goal.y+cur.goal.h/2+6);

  for(let m of cur.mov){
    X.fillStyle=COLORS.mov;
    X.fillRect(m.x,m.y,m.w,m.h);
    X.fillStyle='rgba(255,255,255,0.4)';
    X.fillRect(m.x+3,m.y+3,m.w-6,4);
  }

  const bob=Math.sin(Date.now()/300)*2;
  X.fillStyle=COLORS.p;
  X.fillRect(player.x,player.y+bob,player.w,player.h);
  X.fillStyle='#ffffff';
  X.fillRect(player.x+6,player.y+8+bob,5,5);
  X.fillRect(player.x+17,player.y+8+bob,5,5);
  X.fillStyle='#000';
  X.fillRect(player.x+7,player.y+9+bob,3,3);
  X.fillRect(player.x+18,player.y+9+bob,3,3);

  if(player.on&&Math.abs(player.vx)>0.5){
    for(let i=0;i<2;i++)particles.push({x:player.x+player.w/2,y:player.y+player.h,vx:rand(-0.5,0.5)-player.vx*0.3,vy:rand(-0.5,0),life:15,c:'#ffffff'});
  }

  for(let p of particles){
    X.globalAlpha=p.life/20;
    X.fillStyle=p.c;
    X.fillRect(p.x,p.y,3,3);
  }
  X.globalAlpha=1;

  if(goalFlash>0){
    X.globalAlpha=goalFlash/60;
    X.fillStyle='#ffffff';X.fillRect(0,0,CW,CH);
    X.globalAlpha=1;
    goalFlash--;
  }

  drawHUD();
}

function drawHUD(){
  X.fillStyle='rgba(0,0,0,0.5)';
  X.fillRect(0,0,CW,60);

  X.fillStyle=COLORS.text;X.font='bold 18px Courier';X.textAlign='left';
  X.fillText('Score: '+score,15,25);
  X.fillText('Best: '+best,15,48);

  X.textAlign='right';
  X.fillStyle=timer<10?'#ff006e':COLORS.text;
  X.font='bold 22px Courier';
  X.fillText('\u23f1 '+timer.toFixed(1)+'s',CW-15,30);
  X.font='14px Courier';
  X.fillText('Lvl '+(level+1)+'/'+LEVELS.length,CW-15,50);

  X.textAlign='center';X.font='14px Courier';X.fillStyle=COLORS.text;
  const hints=['\u2190 \u2192 Move, SPACE Jump, SHIFT Slide','Push blue blocks to the GOAL','Trampolines (orange) bounce you!'];
  X.fillText(hints[level]||'',CW/2,30);
}

function drawMenu(){
  X.fillStyle=COLORS.text;X.textAlign='center';
  X.font='bold 56px Courier';
  X.fillText('PHYSICS',CW/2,180);
  X.fillText('PUZZLE',CW/2,250);
  X.font='bold 24px Courier';
  X.fillStyle=COLORS.bg3;
  X.fillText('\ud83c\udfae '+best+' \ud83c\udfae',CW/2,320);
  X.font='20px Courier';
  X.fillStyle=state==='menu'?'#ffd60a':'#ffffff';
  X.fillText('Press SPACE or TAP to Start',CW/2,400);
  X.font='14px Courier';X.fillStyle='#aaa';
  X.fillText('Arrow Keys / WASD: Move  Space: Jump  Shift: Slide',CW/2,440);
  X.fillText('Touch: Left/Right thirds to move, Middle to jump',CW/2,465);
}

function drawOver(){
  X.fillStyle='rgba(0,0,0,0.7)';X.fillRect(0,0,CW,CH);
  X.fillStyle='#ff006e';X.textAlign='center';
  X.font='bold 48px Courier';
  X.fillText('TIME OUT!',CW/2,220);
  X.fillStyle='#fff';X.font='24px Courier';
  X.fillText('Score: '+score,CW/2,290);
  X.fillText('Best: '+best,CW/2,325);
  X.font='18px Courier';X.fillStyle=COLORS.bg3;
  X.fillText('SPACE / TAP to Retry',CW/2,400);
}

function drawEnd(){
  X.fillStyle='rgba(0,0,0,0.7)';X.fillRect(0,0,CW,CH);
  X.fillStyle='#06ffa5';X.textAlign='center';
  X.font='bold 48px Courier';
  X.fillText('YOU WIN!',CW/2,200);
  X.fillStyle='#fff';X.font='24px Courier';
  X.fillText('Final Score: '+score,CW/2,280);
  X.fillText('Best: '+best,CW/2,320);
  X.font='18px Courier';X.fillStyle=COLORS.bg3;
  X.fillText('SPACE / TAP to Restart',CW/2,400);
}

function start(){
  if(state==='menu'){state='play';score=0;loadLevel(0);}
  else if(state==='over'){state='play';loadLevel(level);}
  else if(state==='end'){state='play';score=0;loadLevel(0);}
}

addEventListener('keydown',e=>{
  if(e.code==='Space'&&state!=='play')start();
});
C.addEventListener('click',start);
C.addEventListener('touchstart',()=>{if(state!=='play')start();});

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();