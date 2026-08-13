// Neon Dash Game Logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const menu = document.getElementById('menu');
const gameOver = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');
const finalTimeEl = document.getElementById('finalTime');

// Vibrant neon color palette
const COLORS = {
  player: '#00f3ff',
  obstacle: '#ff00ea',
  background: '#1a1a2e',
  grid: '#162134',
  text: '#00f3ff',
  danger: '#ff00ea'
};

let gameState = 'menu';
let player = { x: 400, y: 550, size: 20, speed: 5 };
let obstacles = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let startTime = 0;
let elapsedTime = 0;
let gameLoopId = null;
let keys = {};

// Web Audio API setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    if (type === 'jump') {
      osc.frequency.value = 220;
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'hit') {
      osc.frequency.value = 80;
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'collect') {
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    }
  } catch(e) {}
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawGrid() {
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= canvas.width; x += 40) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = 0; y <= canvas.height; y += 40) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();
}

function drawPlayer() {
  ctx.fillStyle = COLORS.player;
  ctx.shadowBlur = 15;
  ctx.shadowColor = COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawObstacles() {
  ctx.fillStyle = COLORS.obstacle;
  ctx.shadowBlur = 10;
  ctx.shadowColor = COLORS.obstacle;
  obstacles.forEach(obs => {
    ctx.fillRect(obs.x, obs.y, obs.size, obs.size);
  });
  ctx.shadowBlur = 0;
}

function update() {
  if (gameState !== 'playing') return;

  // Movement
  if (keys['ArrowLeft'] && player.x > player.size) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x < canvas.width - player.size) player.x += player.speed;
  if (keys['ArrowUp'] && player.y > player.size) player.y -= player.speed;
  if (keys['ArrowDown'] && player.y < canvas.height - player.size) player.y += player.speed;

  // Update obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].y += obstacles[i].speed;
    // Collision
    const dx = player.x - (obstacles[i].x + obstacles[i].size/2);
    const dy = player.y - (obstacles[i].y + obstacles[i].size/2);
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < player.size + obstacles[i].size/2) {
      playSound('hit');
      endGame();
      return;
    }
    // Remove off-screen
    if (obstacles[i].y > canvas.height + obstacles[i].size) {
      obstacles.splice(i, 1);
      score++;
      playSound('collect');
    }
  }

  // Spawn obstacles
  if (Math.random() < 0.02) {
    obstacles.push({
      x: Math.random() * (canvas.width - 40),
      y: -30,
      size: 20 + Math.random() * 20,
      speed: 2 + Math.random() * 3
    });
  }

  scoreEl.textContent = score;
  elapsedTime = (Date.now() - startTime) / 1000;
  timerEl.textContent = elapsedTime.toFixed(2);
}

function render() {
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawObstacles();
  drawPlayer();
}

function gameLoop() {
  update();
  render();
  gameLoopId = requestAnimationFrame(gameLoop);
}

function startGame() {
  gameState = 'playing';
  player = { x: canvas.width/2, y: canvas.height - 50, size: 20, speed: 5 };
  obstacles = [];
  score = 0;
  startTime = Date.now();
  elapsedTime = 0;
  scoreEl.textContent = score;
  timerEl.textContent = '0.00';
  menu.classList.add('hidden');
  gameOver.classList.add('hidden');
  playSound('jump');
  gameLoop();
}

function endGame() {
  gameState = 'over';
  cancelAnimationFrame(gameLoopId);
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
  }
  highScoreEl.textContent = highScore;
  finalScoreEl.textContent = `Score: ${score}`;
  finalTimeEl.textContent = `Time: ${elapsedTime.toFixed(2)}s`;
  gameOver.classList.remove('hidden');
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

highScoreEl.textContent = highScore;
