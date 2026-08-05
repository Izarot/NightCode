// Engine and game constants
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hud = {score:0, combo:0, focus:100, timer:0, highScore:0};
const state = {current:'MENU'};
const sections = [];
const sectionColors = {strings:'var(--strings)', woodwinds:'var(--woodwinds)', brass:'var(--brass)', percussion:'var(--percussion)'};
const sectionNames = ['strings','woodwinds','brass','percussion'];
const beatInterval = 600; // ms per beat at start (100 BPM)
let beatTimer = 0;
let lastBeatTime = 0;
let audioCtx;
let buffers = {};
// Responsive canvas
function resizeCanvas(){
  const aspect = 1280/720;
  let w = window.innerWidth;
  let h = window.innerHeight;
  if(w/h > aspect){w = h*aspect;}
  else{h = w/aspect;}
  canvas.width = w; canvas.height = h;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
// Load audio
async function loadAudio(url){
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioCtx.decodeAudioData(arrayBuffer);
}
async function initAudio(){
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const urls = {
    swoosh:'https://cdn.jsdelivr.net/gh/mdn/webaudio-examples@master/oscillator/oscillator.mp3',
    ding:'https://cdn.jsdelivr.net/gh/mdn/webaudio-examples@master/oscillator/oscillator.mp3',
    buzz:'https://cdn.jsdelivr.net/gh/mdn/webaudio-examples@master/oscillator/oscillator.mp3'
  };
  for(const key in urls){
    buffers[key] = await loadAudio(urls[key]);
  }
}
function playSound(key){
  const source = audioCtx.createBufferSource();
  source.buffer = buffers[key];
  source.connect(audioCtx.destination);
  source.start();
}
// Section class
class Section{
  constructor(name, angle){
    this.name = name;
    this.angle = angle;
    this.active = false;
    this.radius = 80;
  }
  draw(){
    const cx = canvas.width/2;
    const cy = canvas.height/2;
    const x = cx + Math.cos(this.angle)*200;
    const y = cy + Math.sin(this.angle)*200;
    ctx.beginPath();
    ctx.arc(x, y, this.radius, 0, Math.PI*2);
    ctx.fillStyle = this.active?sectionColors[this.name]:'rgba(255,255,255,0.3)';
    ctx.fill();
    ctx.strokeStyle = sectionColors[this.name];
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  isHit(mx,my){
    const cx = canvas.width/2;
    const cy = canvas.height/2;
    const x = cx + Math.cos(this.angle)*200;
    const y = cy + Math.sin(this.angle)*200;
    const dx = mx - x;
    const dy = my - y;
    return Math.sqrt(dx*dx+dy*dy) <= this.radius;
  }
}
// Create sections
for(let i=0;i<sectionNames.length;i++){
  const angle = Math.PI/2 + i*(Math.PI/2);
  sections.push(new Section(sectionNames[i], angle));
}
// Input handling
canvas.addEventListener('click', e=>{
  if(state.current!=="PLAYING")return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  let hitSection = null;
  for(const sec of sections){
    if(sec.isHit(mx,my)){
      hitSection = sec;break;
    }
  }
  if(!hitSection) return;
  const now = performance.now();
  const diff = Math.abs(now - lastBeatTime);
  let result='miss';
  if(diff<=25){result='perfect';}
  else if(diff<=50){result='good';}
  if(result==='perfect'){hud.score+=200;hud.combo++;playSound('ding');}
  else if(result==='good'){hud.score+=100;hud.combo++;playSound('swoosh');}
  else {hud.combo=0;hud.focus-=10;playSound('buzz');}
  if(hud.focus<=0){state.current='GAME_OVER';}
});
// Game loop
function update(dt){
  if(state.current==='PLAYING'){
    beatTimer+=dt;
    if(beatTimer>=beatInterval){
      beatTimer=0;
      lastBeatTime=performance.now();
      // activate random section
      sections.forEach(s=>s.active=false);
      const idx=Math.floor(Math.random()*sections.length);
      sections[idx].active=true;
    }
    hud.timer+=dt/1000;
  }
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // background
  ctx.fillStyle='#212121';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // podium
  const cx=canvas.width/2,cy=canvas.height/2;
  ctx.beginPath();
  ctx.arc(cx,cy,30,0,Math.PI*2);
  ctx.fillStyle='var(--gold)';
  ctx.fill();
  // sections
  sections.forEach(s=>s.draw());
  // beat ring
  const radius=60+Math.sin((performance.now()/beatInterval)*Math.PI)*10;
  ctx.beginPath();
  ctx.arc(cx,cy,radius,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,255,255,0.5)';
  ctx.lineWidth=2;
  ctx.stroke();
}
function loop(timestamp){
  if(!last){last=timestamp;}
  const dt=timestamp-last;
  last=timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
let last;
// HUD updates
function updateHUD(){
  document.getElementById('score').innerText=`Score: ${hud.score}`;
  document.getElementById('combo').innerText=`Combo: ${hud.combo}`;
  document.getElementById('focusBar').style.width=`${hud.focus}%`;
  const mins=Math.floor(hud.timer/60);
  const secs=Math.floor(hud.timer%60).toString().padStart(2,'0');
  document.getElementById('timer').innerText=`${mins}:${secs}`;
  document.getElementById('highScore').innerText=`High: ${hud.highScore}`;
}
setInterval(updateHUD,100);
// Menu handling
const menu=document.getElementById('menu');
const gameOver=document.getElementById('gameOver');
const finalScore=document.getElementById('finalScore');
const restartBtn=document.getElementById('restartBtn');
function showMenu(){menu.classList.remove('hidden');}
function hideMenu(){menu.classList.add('hidden');}
function showGameOver(){gameOver.classList.remove('hidden');}
function hideGameOver(){gameOver.classList.add('hidden');}
function resetGame(){
  hud.score=0;hud.combo=0;hud.focus=100;hud.timer=0;beatTimer=0;lastBeatTime=0;
  sections.forEach(s=>s.active=false);
}
window.addEventListener('keydown',e=>{
  if(state.current==='MENU' && e.code==='Space'){
    hideMenu();
    state.current='PLAYING';
  }
});
restartBtn.addEventListener('click',()=>{resetGame();hideGameOver();state.current='PLAYING';});
// High score persistence
function loadHigh(){
  const hs=localStorage.getItem('orchestraHighScore');
  hud.highScore=hs?parseInt(hs):0;
}
function saveHigh(){
  if(hud.score>hud.highScore){
    hud.highScore=hud.score;
    localStorage.setItem('orchestraHighScore',hud.score);
  }
}
// Game over handling
function checkGameOver(){
  if(state.current==='GAME_OVER'){
    saveHigh();
    finalScore.innerText=`Final Score: ${hud.score}`;
    showGameOver();
  }
}
setInterval(checkGameOver,200);
// Initialize
loadHigh();
initAudio();
showMenu();
requestAnimationFrame(loop);
