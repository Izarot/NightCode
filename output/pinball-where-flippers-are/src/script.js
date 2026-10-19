const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const highScoreEl = document.getElementById('highScore');

function resizeCanvas() {
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const colors = ['#6b5b95', '#88b04b', '#f7cac9', '#ff6f61'];

const paddle = {
  width: 120,
  height: 20,
  x: 0,
  y: 0,
  color: '#ff6f61'
};

const balls = [];
const maxBalls = 5;
let spawnTimer = 0;
const spawnInterval = 800;

let score = 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let startTime = Date.now();
let lastFrameTime = 0;

let mouseX = 0;
canvas.addEventListener('pointermove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
});

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playCatch() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(440, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.25);
}
function playMiss() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.2);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.25);
}

function update(deltaTime) {
  paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, mouseX - paddle.width/2));
  paddle.y = canvas.height - paddle.height - 10;

  spawnTimer += deltaTime;
  if (spawnTimer > spawnInterval && balls.length < maxBalls) {
    spawnTimer = 0;
    const radius = 20 + Math.random()*15;
    const x = radius + Math.random()*(canvas.width - 2*radius);
    const y = -radius;
    const speedY = 150 + Math.random()*100;
    const color = colors[Math.floor(Math.random()*colors.length)];
    balls.push({x, y, radius, speedY, color});
  }

  for (let i = balls.length-1; i >= 0; i--) {
    const b = balls[i];
    b.y += b.speedY * (deltaTime/1000);
    if (b.y + b.radius > paddle.y &&
        b.y - b.radius < paddle.y + paddle.height &&
        b.x > paddle.x &&
        b.x < paddle.x + paddle.width) {
      score++;
      scoreEl.textContent = `Score: ${score}`;
      playCatch();
      balls.splice(i,1);
      continue;
    }
    if (b.y - b.radius > canvas.height) {
      playMiss();
      balls.splice(i,1);
    }
  }
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = paddle.color;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  for (const b of balls) {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2);
    ctx.fill();
  }
}

function loop(timestamp) {
  if (!lastFrameTime) lastFrameTime = timestamp;
  const delta = timestamp - lastFrameTime;
  lastFrameTime = timestamp;
  update(delta);
  draw();
  const elapsedSec = Math.floor((Date.now() - startTime)/1000);
  timerEl.textContent = `Time: ${elapsedSec}s`;
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = `High Score: ${highScore}`;
    localStorage.setItem('highScore', highScore);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);