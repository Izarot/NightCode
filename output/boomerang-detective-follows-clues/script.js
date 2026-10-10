const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const timerEl = document.getElementById('timer');

const COLORS = { bg:'#0d0d0d', paddle:'#ff6f61', star:'#ffe066', text:'#00ffef' };

let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
highScoreEl.textContent = highScore;

let gameOver = false;
let startTime = null;
let raf;

// paddle
const paddleWidth = 120;
const paddleHeight = 20;
let paddleX = (canvas.width - paddleWidth)/2;

// stars
const stars = [];
const starRadius = 15;
const spawnInterval = 800; // ms
let lastSpawn = 0;

// input
const keys = {};
window.addEventListener('keydown', e=>{keys[e.key]=true;});
window.addEventListener('keyup', e=>{keys[e.key]=false;});

// sound
function playSound(freq, duration, type='sine'){
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime+0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime+duration);
}

// resize
function resizeCanvas(){
  const dpr = window.devicePixelRatio || 1;
  const width = Math.min(window.innerWidth*0.9, 600);
  const height = Math.min(window.innerHeight*0.7, 400);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  paddleX = Math.min(paddleX, width - paddleWidth);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// star class
function Star(){
  this.reset();}
Star.prototype.reset = function(){
  this.x = Math.random() * (canvas.width - 2*starRadius) + starRadius;
  this.y = -starRadius;
  this.speed = 2
  };

Star.prototype.update = function(){
  this.y += this.speed;
};

Star.prototype.draw = function(){
  ctx.beginPath();
  ctx.arc(this.x, this.y, starRadius, 0, Math.PI*2);
  ctx.fillStyle = COLORS.star;
  ctx.fill();
};

function update(){
  if(gameOver) return;
  now = Date.now();
  if(now - lastSpawn > spawnInterval){
    stars.push(new Star());
    lastSpawn = now;
  }
  // paddle movement
  var paddleSpeed = 6;
  if(keys['ArrowLeft']) paddleX -= paddleSpeed;
  if(keys['ArrowRight']) paddleX += paddleSpeed;
  if(paddleX < 0) paddleX = 0;
  if(paddleX > canvas.width - paddleWidth) paddleX = canvas.width - paddleWidth;
  // update stars
  for(var i=0;i<stars.length;i++){
    var s = stars[i];
    s.update();
    // catch
    if(s.y + starRadius > canvas.height - paddleHeight &&
       s.x > paddleX && s.x < paddleX + paddleWidth){
      score+=10;
      scoreEl.textContent = score;
      playSound(440,0.1,'sine');
      s.reset();
    }
    // miss
    if(s.y > canvas.height){
      gameOver = true;
      if(score > highScore){
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem('highScore',highScore);
      }
      playSound(200,0.5,'sine');
    }
  }
  // timer
  if(startTime===null) startTime = Date.now();
  var elapsed = Date.now() - startTime;
  var ms = elapsed%1000;
  var sec = Math.floor(elapsed/1000)%60;
  var min = Math.floor(elapsed/60000);
  timerEl.textContent = (min<10?'0':'')+min+':'+(sec<10?'0':'')+sec+'.'+(ms<100?(ms<10?'00':'0'):'');
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // paddle
  ctx.fillStyle = COLORS.paddle;
  ctx.fillRect(paddleX, canvas.height-paddleHeight, paddleWidth, paddleHeight);
  // stars
  for(var i=0;i<stars.length;i++){
    stars[i].draw();
  }
  if(gameOver){
    ctx.fillStyle = 'rgba(255,0,0,0.5)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = COLORS.text;
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    ctx.font = '20px Arial';
    ctx.fillText('Score: '+score, canvas.width/2, canvas.height/2+30);
  }
}

function loop(){
  update();
  draw();
  raf = requestAnimationFrame(loop);
}

loop();
