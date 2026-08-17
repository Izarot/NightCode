// ======== CONFIG ========
const ASPECT_RATIO = 16/9;
const PLAYER_SIZE = 32;
const PLAYER_COLOR = '#1abc9c';
const COLLECTIBLE_COLOR = '#f1c40f';
const GOAL_COLOR = '#2ecc71';
const HAZARD_COLOR = '#e74c3c';
const BACKGROUND_COLOR = '#2c3e50';
const ACCEL = 0.3;
const MAX_SPEED = 4;
const FRICTION = 0.92;
const ROTATE_STEP = Math.PI/2; // 90 degrees
const MOMENTUM_SPEED = 0.5 * Math.PI/180; // 0.5° per frame

// ======== CANVAS SETUP ========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let canvasWidth, canvasHeight;
function resizeCanvas(){
  const w = window.innerWidth;
  const h = window.innerHeight;
  if(w/h > ASPECT_RATIO){
    canvasHeight = h;
    canvasWidth = h*ASPECT_RATIO;
  }else{
    canvasWidth = w;
    canvasHeight = w/ASPECT_RATIO;
  }
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ======== AUDIO ========
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration/1000);
}
function playCollect(){ playTone(600,150); }
function playRotate(){ playTone(400,100); }
function playGoal(){ playTone(800,200); }
function playDeath(){ playTone(200,200); }

// ======== GAME STATE ========
let worldAngle = 0;
let rotating = false;
let rotationTarget = 0;
let rotationSpeed = 0;

const player = {
  x: 100, y: 100,
  vx: 0, vy: 0,
  width: PLAYER_SIZE, height: PLAYER_SIZE
};
const startPos = {x:100,y:100};
const collectibles = [
  {x:400,y:200, collected:false},
  {x:600,y:400, collected:false}
];
const goal = {x:800,y:200, width:50, height:50};
const hazards = [
  {x:500,y:300, width:80, height:80}
];
let score = 0;
let highScore = parseInt(localStorage.getItem('rotatingScreen_highscore'))||0;
let startTime = performance.now();
let elapsed = 0;

// ======== INPUT ========
const keys = {};
window.addEventListener('keydown', e=>{keys[e.code]=true;});
window.addEventListener('keyup', e=>{keys[e.code]=false;});

// ======== UPDATE ========
function update(){
  // Player movement
  let ax=0, ay=0;
  if(keys['KeyW']||keys['ArrowUp']) ay=-1;
  if(keys['KeyS']||keys['ArrowDown']) ay=1;
  if(keys['KeyA']||keys['ArrowLeft']) ax=-1;
  if(keys['KeyD']||keys['ArrowRight']) ax=1;
  const len = Math.hypot(ax,ay);
  if(len>0){ ax/=len; ay/=len; }
  player.vx += ax*ACCEL;
  player.vy += ay*ACCEL;
  const speed = Math.hypot(player.vx, player.vy);
  if(speed>MAX_SPEED){
    player.vx = player.vx/speed*MAX_SPEED;
    player.vy = player.vy/speed*MAX_SPEED;
  }
  player.vx *= FRICTION;
  player.vy *= FRICTION;
  player.x += player.vx;
  player.y += player.vy;

  // Rotation
  if(keys['KeyR'] && !rotating){
    if(keys['ShiftLeft']||keys['ShiftRight']){
      rotating = true;
      rotationTarget = worldAngle + ROTATE_STEP;
      rotationSpeed = MOMENTUM_SPEED;
    }else{
      worldAngle = (worldAngle + ROTATE_STEP) % (2*Math.PI);
      playRotate();
    }
  }
  if(rotating){
    worldAngle += rotationSpeed;
    if(Math.abs(worldAngle - rotationTarget) < 0.01){
      worldAngle = rotationTarget;
      rotating = false;
      playRotate();
    }
  }

  // Collectibles
  collectibles.forEach(c=>{
    if(!c.collected && rectIntersect(player, c)){
      c.collected=true;
      score += 100;
      playCollect();
    }
  });

  // Goal
  if(rectIntersect(player, goal)){
    playGoal();
    if(score>highScore){ highScore=score; localStorage.setItem('rotatingScreen_highscore', highScore); }
    alert('Level Complete! Score: '+score+'\nHigh Score: '+highScore);
    resetLevel();
  }

  // Hazards
  hazards.forEach(h=>{
    if(rectIntersect(player, h)){
      playDeath();
      resetPlayer();
    }
  });

  // Timer
  elapsed = (performance.now()-startTime)/1000;
}

function rectIntersect(a,b){
  return a.x < b.x + (b.width||b.size) &&
         a.x + a.width > b.x &&
         a.y < b.y + (b.height||b.size) &&
         a.y + a.height > b.y;
}

function resetPlayer(){
  player.x = startPos.x;
  player.y = startPos.y;
  player.vx = 0;
  player.vy = 0;
}
function resetLevel(){
  startTime = performance.now();
  score = 0;
  worldAngle = 0;
  rotating = false;
  collectibles.forEach(c=>c.collected=false);
  resetPlayer();
}

// ======== RENDER ========
function render(){
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0,0,canvasWidth,canvasHeight);
  ctx.save();
  ctx.translate(canvasWidth/2, canvasHeight/2);
  ctx.rotate(worldAngle);
  ctx.translate(-canvasWidth/2, -canvasHeight/2);

  // Draw goal
  ctx.fillStyle = GOAL_COLOR;
  ctx.fillRect(goal.x, goal.y, goal.width, goal.height);

  // Draw collectibles
  collectibles.forEach(c=>{
    if(!c.collected){
      ctx.fillStyle = COLLECTIBLE_COLOR;
      ctx.beginPath();
      ctx.arc(c.x + 16, c.y + 16, 16, 0, Math.PI*2);
      ctx.fill();
    }
  });

  // Draw hazards
  hazards.forEach(h=>{
    ctx.fillStyle = HAZARD_COLOR;
    ctx.fillRect(h.x, h.y, h.width, h.height);
  });

  ctx.restore();

  // Draw player
  ctx.fillStyle = PLAYER_COLOR;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // UI
  ctx.fillStyle = '#ecf0f1';
  ctx.font = '20px monospace';
  ctx.fillText('Score: '+score, 10, 30);
  ctx.fillText('High: '+highScore, 10, 60);
  ctx.fillText('Time: '+elapsed.toFixed(1)+'s', canvasWidth-150, 30);
}

function loop(){
  update();
  render();
  requestAnimationFrame(loop);
}
loop();