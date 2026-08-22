// Symphonic Leap - Audio-Driven Platformer
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;
window.addEventListener('resize', ()=>{w=canvas.width=window.innerWidth;h=canvas.height=window.innerHeight});

// Color Palette
const COLORS = {
  bg: '#0d0220',
  player: '#00fff2',
  platform: '#7fff00',
  hazard: '#ff2a6d',
  emitter: '#ff9e00',
  silence: '#8888aa',
  text: '#ffffff',
  pulse: '#bb86ff'
};

// Audio Context
let audioCtx;
let musicGain;
let isMusicPlaying = false;
let musicTimeout;
let jumpBuffer, dashBuffer, collectBuffer;

function initAudio(){
  if(audioCtx) return;
  audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  musicGain = audioCtx.createGain();
  musicGain.connect(audioCtx.destination);
  musicGain.gain.value = 0.3;
  loadSounds();
}

function loadSounds(){
  const ctx = audioCtx;
  function makeTone(freq, dur){
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type='sine'; o.frequency.value=freq;
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime+0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
    o.start(); o.stop(ctx.currentTime+dur);
  }
  jumpBuffer = ()=>makeTone(220,0.2);
  dashBuffer = ()=>makeTone(110,0.1);
  collectBuffer = ()=>makeTone(440,0.15);
}

function startMusic(){ 
  if(!audioCtx) initAudio();
  isMusicPlaying=true; 
  clearTimeout(musicTimeout);
  musicTimeout=setTimeout(stopMusic, 8000);
  updateMusicIcon();
}
function stopMusic(){ 
  isMusicPlaying=false; 
  clearTimeout(musicTimeout);
  updateMusicIcon();
}
function updateMusicIcon(){
  document.getElementById('musicIcon').textContent = isMusicPlaying?'🎶':'🔇';
}

// Game State
let player, platforms, emitters, silenceZones, hazards, collectibles;
let score=0, level=1, hearts=3, jumpMeter=100, powerTimer=0;
let speedrunStart=performance.now();
let highScore = localStorage.getItem('symphonicHighScore')||0;
let keys={};
let gameOver=false;

function resetGame(){
  player = {x:100,y:h-150,vx:0,vy:0,onGround:false,canDash:false};
  platforms=[]; emitters=[]; silenceZones=[]; hazards=[]; collectibles=[];
  score=0; level=1; hearts=3; jumpMeter=100; powerTimer=0;
  speedrunStart=performance.now();
  buildLevel(1);
  stopMusic();
}

function buildLevel(n){
  // Ground
  platforms.push({x:0,y:h-60,w:w,hh:60});
  // Platforms
  for(let i=0;i<5;i++){
    platforms.push({x:200+i*180,y:h-200-i*30,w:120,hh:20});
  }
  // Emitter
  emitters.push({x:300,y:h-260,w:40,hh:40});
  // Silence zone
  silenceZones.push({x:w-200,y:h-120,w:100,hh:60});
  // Hazards
  hazards.push({x:500,y:h-200,w:30,hh:30});
  // Collectible
  collectibles.push({x:400,y:h-280,r:10,collected:false});
}

function update(){
  if(gameOver) return;
  // Movement
  if(keys['ArrowLeft']||keys['a']) player.vx=-4;
  else if(keys['ArrowRight']||keys['d']) player.vx=4;
  else player.vx*=0.8;
  // Jump
  if((keys[' ']||keys['ArrowUp']||keys['w'])&&isMusicPlaying&&player.onGround&&jumpMeter>0){
    player.vy=-15; player.onGround=false; jumpBuffer(); jumpMeter-=20;
  }
  // Dash
  if((keys[' ']||keys['ArrowUp']||keys['w'])&&isMusicPlaying&&!player.onGround&&player.canDash){
    player.vx+=(keys['ArrowLeft']||keys['a'])?-8:(keys['ArrowRight']||keys['d'])?8:0;
    player.canDash=false; dashBuffer();
  }
  // Gravity
  player.vy+=0.5;
  player.y+=player.vy;
  player.x+=player.vx;
  // Bounds
  if(player.x<0)player.x=0; if(player.x>w-40)player.x=w-40;
  if(player.y>h-60){player.y=h-60;player.vy=0;player.onGround=true;player.canDash=true;}
  // Collisions
  handleCollisions();
  // Music meter regen
  if(isMusicPlaying) jumpMeter=Math.min(100,jumpMeter+0.5);
  // Power timer
  if(powerTimer>0) powerTimer--;
  // Score
  score+=1;
  // Speedrun
  const elapsed = ((performance.now()-speedrunStart)/1000).toFixed(2);
  document.getElementById('timer').textContent='⏱ '+elapsed;
  // High score
  if(score>highScore){highScore=score;localStorage.setItem('symphonicHighScore',highScore);}
  // Win
  if(score>2000){alert('You Win! High Score: '+highScore);resetGame();}
}

function handleCollisions(){
  // Platforms
  for(let p of platforms){
    if(rectOverlap(player,p)){
      if(player.vy>0&&player.y<p.y){player.y=p.y-player.vy;player.vy=0;player.onGround=true;player.canDash=true;}
      else if(player.vy<0)player.vy=0;
    }
  }
  // Emitters
  for(let e of emitters){
    if(rectOverlap(player,e)){startMusic();}
  }
  // Silence zones
  for(let z of silenceZones){
    if(rectOverlap(player,z)){stopMusic();}
  }
  // Hazards
  for(let hz of hazards){
    if(rectOverlap(player,hz)){hearts--;if(hearts<=0){gameOver=true;document.getElementById('hearts').textContent='💀';}
      player.y=h-150;player.vy=0;}
  }
  // Collectibles
  for(let c of collectibles){
    if(!c.collected&&dist(player.x+20,player.y+20,c.x,c.y)<c.r+20){c.collected=true;score+=500;collectBuffer();powerTimer=300;}
  }
}

function rectOverlap(a,b){
  return a.x<b.x+b.w&&a.x+40>b.x&&a.y<b.y+b.hh&&a.y+40>b.y;
}
function dist(x1,y1,x2,y2){return Math.hypot(x1-x2,y1-y2);}

function draw(){
  ctx.fillStyle=COLORS.bg; ctx.fillRect(0,0,w,h);
  // Platforms
  ctx.fillStyle=COLORS.platform;
  for(let p of platforms) ctx.fillRect(p.x,p.y,p.w,p.hh);
  // Emitters
  ctx.fillStyle=COLORS.emitter;
  for(let e of emitters) ctx.fillRect(e.x,e.y,e.w,e.hh);
  // Silence zones
  ctx.fillStyle=COLORS.silence;
  for(let z of silenceZones) ctx.fillRect(z.x,z.y,z.w,z.hh);
  // Hazards
  ctx.fillStyle=COLORS.hazard;
  for(let hz of hazards) ctx.fillRect(hz.x,hz.y,hz.w,hz.hh);
  // Collectibles
  for(let c of collectibles){
    if(!c.collected){ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.fill();}
  }
  // Player
  ctx.fillStyle=COLORS.player;
  ctx.fillRect(player.x,player.y,40,40);
  // Jump meter bar
  ctx.fillStyle='#444'; ctx.fillRect(0,h-30,w,10);
  ctx.fillStyle=isMusicPlaying?'#0f0':'#555'; ctx.fillRect(0,h-30,jumpMeter*4,10);
}

function loop(){
  update(); draw();
  document.getElementById('score').textContent='Score: '+score;
  document.getElementById('levelInfo').textContent='Level '+level;
  document.getElementById('hearts').textContent='❤️'.repeat(hearts);
  document.getElementById('jumpMeter').textContent='Jump: '+Math.round(jumpMeter)+'%';
  document.getElementById('powerTimer').textContent=powerTimer>0?'Power: '+Math.round(powerTimer/60)+'s':'';
  requestAnimationFrame(loop);
}

// Input
window.addEventListener('keydown',e=>{keys[e.key]=true;});
window.addEventListener('keyup',e=>{keys[e.key]=false;});

// Init
resetGame();
loop();
