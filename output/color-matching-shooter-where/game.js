const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerEl = document.getElementById('timer');
const highScoreEl = document.getElementById('highScore');

function resize() {
  const maxW = window.innerWidth * 0.95;
  const maxH = window.innerHeight * 0.9;
  const size = Math.min(maxW, maxH, 600);
  canvas.width = size;
  canvas.height = size;
}
window.addEventListener('resize', resize);
resize();

let player = { x: 0, y: 0, size: 20, color: '#e94560' };
let target = { x: 0, y: 0, size: 20, color: '#00d9ff' };
let score = 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let startTime = performance.now();
let running = true;
highScoreEl.textContent = highScore;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration, type='sine') {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain).connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function spawnTarget() {
  const padding = 30;
  target.x = Math.random() * (canvas.width - 2*padding) + padding;
  target.y = Math.random() * (canvas.height - 2*padding) + padding;
}

function resetPlayer() {
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
}

resetPlayer();
spawnTarget();

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

let touchStart = null;
canvas.addEventListener('touchstart', e => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, {passive:true});
canvas.addEventListener('touchmove', e => {
  if (!touchStart) return;
  const dx = e.touches[0].clientX - touchStart.x;
  const dy = e.touches[0].clientY - touchStart.y;
  player.x += dx * 0.5;
  player.y += dy * 0.5;
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  clampPlayer();
}, {passive:true});
canvas.addEventListener('touchend', () => touchStart = null);

function clampPlayer() {
  player.x = Math.max(player.size/2, Math.min(canvas.width - player.size/2, player.x));
  player.y = Math.max(player.size/2, Math.min(canvas.height - player.size/2, player.y));
}

function update() {
  if (!running) return;
  const speed = 5;
  if (keys['ArrowUp'] || keys['w']) player.y -= speed;
  if (keys['ArrowDown'] || keys['s']) player.y += speed;
  if (keys['ArrowLeft'] || keys['a']) player.x -= speed;
  if (keys['ArrowRight'] || keys['d']) player.x += speed;
  clampPlayer();

  const dx = player.x - target.x;
  const dy = player.y - target.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < player.size/2 + target.size/2) {
    score++;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
      highScoreEl.textContent = highScore;
    }
    playTone(880, 0.1, 'square');
    spawnTarget();
  }

  const elapsed = (performance.now() - startTime) / 1000;
  timerEl.textContent = elapsed.toFixed(2);
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = '#0f3460';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x=0; x<canvas.width; x+=gridSize) {
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();
  }
  for (let y=0; y<canvas.height; y+=gridSize) {
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
  }
  ctx.fillStyle = target.color;
  ctx.beginPath();
  ctx.arc(target.x, target.y, target.size/2, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size/2, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#eaeaea';
  ctx.font = '20px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 10, 30);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();