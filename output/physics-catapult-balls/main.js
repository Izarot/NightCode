const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let dpr = window.devicePixelRatio || 1;
function resize() {
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resize);
resize();

const palette = {
  sky: '#87ceeb',
  ground: '#228b22',
  catapult: '#8b4513',
  arm: '#a0522d',
  ball: '#ff4500',
  target: '#32cd32',
  particle: '#ffff00'
};

let mouse = {x:0,y:0,down:false};
let power = 0;
const maxPull = 150;

class Ball {
  constructor(x,y,vx,vy){
    this.x=x; this.y=y; this.vx=vx; this.vy=vy;
    this.radius=12;
    this.alive=true;
    this.trail=[];
  }
  update(dt){
    if(!this.alive) return;
    this.trail.push({x:this.x,y:this.y});
    if(this.trail.length>5) this.trail.shift();
    const g = 981; // px/s^2
    this.vy += g * dt;
    const drag = 0.98;
    this.vx *= drag;
    this.vy *= drag;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if(this.x < this.radius){ this.x=this.radius; this.vx*=-0.8; }
    if(this.x > canvas.width/dpr - this.radius){ this.x=canvas.width/dpr - this.radius; this.vx*=-0.8; }
    if(this.y < this.radius){ this.y=this.radius; this.vy*=-0.8; }
    if(this.y > canvas.height/dpr - this.radius){ this.y=canvas.height/dpr - this.radius; this.vy*=-0.8; this.alive=false; }
  }
  draw(ctx){
    ctx.save();
    ctx.translate(this.x,this.y);
    for(let i=0;i<this.trail.length;i++){
      const alpha = (i+1)/this.trail.length * 0.3;
      ctx.fillStyle = `rgba(255,69,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(0,0,this.radius*(1 - i/this.trail.length*0.5),0,Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle = palette.ball;
    ctx.beginPath();
    ctx.arc(0,0,this.radius,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

const target = {
  x: canvas.width/dpr * 0.7,
  y: canvas.height/dpr * 0.5,
  width: 60,
  height: 60,
  health: 3,
  alive:true
};

let balls = [];
let currentBall = null;
let shots = 3;
let score = 0;
let highScore = parseInt(localStorage.getItem('physicsCatapultHighScore'))||0;
let startTime = null;
let elapsed = 0;

canvas.addEventListener('pointerdown', e=>{
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) * (canvas.width/rect.width) / dpr;
  mouse.y = (e.clientY - rect.top) * (canvas.height/rect.height) / dpr;
  mouse.down = true;
});
canvas.addEventListener('pointermove', e=>{
  if(!mouse.down) return;
  const rect = canvas.getBoundingClientRect();
  mouse.x = (e.clientX - rect.left) * (canvas.width/rect.width) / dpr;
  mouse.y = (e.clientY - rect.top) * (canvas.height/rect.height) / dpr;
});
canvas.addEventListener('pointerup', e=>{
  if(!mouse.down) return;
  mouse.down = false;
  if(shots>0 && !currentBall){
    const baseX = canvas.width/dpr * 0.2;
    const baseY = canvas.height/dpr * 0.8;
    const dx = baseX - mouse.x;
    const dy = baseY - mouse.y;
    const distance = Math.hypot(dx,dy);
    const power = Math.min(distance/maxPull,1);
    const angle = Math.atan2(dy,dx);
    const speed = power * 15;
    const vx = -Math.cos(angle) * speed;
    const vy = -Math.sin(angle) * speed;
    currentBall = new Ball(baseX, baseY, vx, vy);
    balls.push(currentBall);
    shots--;
    playLaunchSound();
    if(startTime===null) startTime=performance.now();
  }
});

function checkCollisions(){
  if(!currentBall) return;
  if(currentBall.x > target.x && currentBall.x < target.x+target.width &&
     currentBall.y > target.y && currentBall.y < target.y+target.height){
    target.health--;
    score += 10;
    playImpactSound();
    if(target.health<=0){
      target.alive=false;
      setTimeout(()=>{
        const timeBonus = Math.max(0, 30000 - (performance.now()-startTime));
        score += Math.floor(timeBonus/100);
        if(score>highScore){
          highScore=score;
          localStorage.setItem('physicsCatapultHighScore',highScore);
        }
        alert(`Level Complete! Score: ${score}`);
        resetLevel();
      },500);
    }
    currentBall.alive=false;
    currentBall=null;
  }
}

function resetLevel(){
  target.health=3;
  target.alive=true;
  balls=[];
  currentBall=null;
  shots=3;
  score=0;
  startTime=null;
}

function updateUI(){
  document.getElementById('timer').textContent = (elapsed/1000).toFixed(1)+'s';
  document.getElementById('score').textContent = 'Score: '+score;
  document.getElementById('highScore').textContent = 'High: '+highScore;
}

function loop(timestamp){
  if(startTime!==null){
    elapsed = timestamp - startTime;
  }
  updateUI();
  ctx.clearRect(0,0,canvas.width/dpr,canvas.height/dpr);
  ctx.fillStyle = palette.sky;
  ctx.fillRect(0,0,canvas.width/dpr,canvas.height/dpr);
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0,canvas.height/dpr*0.8,canvas.width/dpr,canvas.height/dpr*0.2);
  ctx.fillStyle = palette.catapult;
  ctx.fillRect(canvas.width/dpr*0.15,canvas.height/dpr*0.75,canvas.width/dpr*0.1,canvas.height/dpr*0.05);
  if(mouse.down){
    const baseX = canvas.width/dpr*0.2;
    const baseY = canvas.height/dpr*0.8;
    ctx.strokeStyle = palette.arm;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(baseX,baseY);
    ctx.lineTo(mouse.x,mouse.y);
    ctx.stroke();
  }else{
    ctx.strokeStyle = palette.arm;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(canvas.width/dpr*0.2,canvas.height/dpr*0.8);
    ctx.lineTo(canvas.width/dpr*0.25,canvas.height/dpr*0.78);
    ctx.stroke();
  }
  if(target.alive){
    ctx.fillStyle = palette.target;
    ctx.fillRect(target.x,target.y,target.width,target.height);
  }
  balls.forEach(b=>{ if(b.alive){ b.update(1/60); b.draw(ctx); } });
  balls = balls.filter(b=>b.alive);
  checkCollisions();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playLaunchSound(){
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime+0.1);
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime+0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+0.2);
  oscillator.connect(gain).connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime+0.25);
}
function playImpactSound(){
  const noise = audioCtx.createBufferSource();
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.05, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for(let i=0;i<buffer.length;i++){
    data[i] = (Math.random()*2-1);
  }
  noise.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+0.1);
  noise.connect(gain).connect(audioCtx.destination);
  noise.start();
  noise.stop(audioCtx.currentTime+0.15);
}
