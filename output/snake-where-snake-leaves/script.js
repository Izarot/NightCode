const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let dpr = window.devicePixelRatio || 1;
function resize() {
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resize);
resize();

let snake = [{x:100, y:100}];
let dir = {x:1, y:0};
let speed = 2;
let maxSpeed = 5;
let minSpeed = 0.5;
let growth = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem('fireSnakeHS'))||0;
let heat = 0;
const MAX_HEAT = 100;
const HEAT_INCREMENT = 0.05;
const HEAT_DECAY = 0.02;
let particles = [];
const PARTICLE_LIFE = 800;
let lastTime = 0;
let gameOver = false;
let paused = false;

window.addEventListener('keydown', e=>{
  if(gameOver){ if(e.key==='r'||e.key==='R') reset(); return;}
  if(e.key==='p'||e.key==='P'){ paused=!paused; return;}
  if(paused) return;
  const map = {ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
               w:{x:0,y:-1}, s:{x:0,y:1}, a:{x:-1,y:0}, d:{x:1,y:0}};
  if(map[e.key]){
    let nd = map[e.key];
    if(!(snake.length>1 && nd.x===-dir.x && nd.y===-dir.y)){
      dir = nd;
    }
  }
});

let food = {x:0,y:0};
function spawnFood(){
  food.x = Math.floor(Math.random()*canvas.width/dpr);
  food.y = Math.floor(Math.random()*canvas.height/dpr);
}
spawnFood();

function loop(timestamp){
  if(!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime)/1000;
  lastTime = timestamp;
  if(!paused && !gameOver){
    update(dt);
  }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function update(dt){
  const head = {x:snake[0].x + dir.x*speed*dt, y:snake[0].y + dir.y*speed*dt};
  snake.unshift(head);
  if(growth>0){ growth--; } else { snake.pop(); }
  if(head.x<0 || head.x>canvas.width/dpr || head.y<0 || head.y>canvas.height/dpr){
    endGame();
    return;
  }
  for(let i=1;i<snake.length;i++){
    const seg = snake[i];
    if(Math.hypot(head.x-seg.x, head.y-seg.y)<5){
      endGame();
      return;
    }
  }
  if(Math.hypot(head.x-food.x, head.y-food.y)<10){
    score++;
    if(score>highScore){ highScore=score; localStorage.setItem('fireSnakeHS', highScore);}
    growth += 1;
    spawnFood();
    playEat();
  }
  particles.push({x:head.x, y:head.y, age:0, life:PARTICLE_LIFE});
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.age += dt*1000;
    if(p.age>=p.life){ particles.splice(i,1); }
  }
  heat += HEAT_INCREMENT * dt * snake.length;
  if(heat>MAX_HEAT) heat=MAX_HEAT;
  heat -= HEAT_DECAY * dt;
  if(heat<0) heat=0;
  speed = Math.max(minSpeed, maxSpeed * (1 - heat/MAX_HEAT * 0.7));
}

function draw(){
  ctx.clearRect(0,0,canvas.width/dpr,canvas.height/dpr);
  const grad = ctx.createLinearGradient(0,0,0,canvas.height/dpr);
  grad.addColorStop(0,'#0a0a0a');
  grad.addColorStop(1,'#1a1a1a');
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,canvas.width/dpr,canvas.height/dpr);
  for(const p of particles){
    const alpha = 1 - p.age/p.life;
    ctx.globalAlpha = alpha>0?alpha:0;
    ctx.fillStyle = '#ff4500';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3,0,Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha=1;
  for(let i=0;i<snake.length;i++){
    const seg = snake[i];
    const radius = 6 - i*0.05;
    const r = Math.min(255, 200 + i*2);
    const g = Math.max(0, 100 - i*1);
    const b = 0;
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, radius,0,Math.PI*2);
    ctx.fill();
  }
  ctx.fillStyle = '#ff0';
  ctx.beginPath();
  ctx.arc(food.x, food.y, 8,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`High: ${highScore}`, 10, 40);
  ctx.fillText(`Speed: ${speed.toFixed(2)}`, 10, 60);
  ctx.fillText(`Length: ${snake.length}`, 10, 80);
}

function endGame(){gameOver=true;}

function reset(){snake=[{x:100,y:100}];dir={x:1,y:0};speed=2;growth=0;score=0;heat=0;particles=[];gameOver=false;paused=false;spawnFood();}

function playEat(){particles.push({x:food.x,y:food.y,age:0,life:PARTICLE_LIFE*2});}
