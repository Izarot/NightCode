// Game initialization and loop
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let lastTime = 0;
let gameState = 'playing';
let startTime = 0;
let elapsed = 0;
let highScore = localStorage.getItem('highScore') || 0;

// Responsive canvas sizing
function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w;
  canvas.height = h;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Web Audio API setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(frequency, duration) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
  oscillator.stop(audioCtx.currentTime + duration);
}

// Game loop
function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  if (gameState === 'playing') {
    elapsed = (timestamp - startTime) / 1000;
    update(delta);
    draw();
  }

  requestAnimationFrame(gameLoop);
}

function update(delta) {
  updatePlayer(delta);
  updateGameLogic();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawWires();
  drawNodes();
  drawPlayer();
  drawUI();
}

function drawUI() {
  document.getElementById('levelDisplay').textContent = `Level ${currentLevel + 1}/${levels.length}`;
  document.getElementById('timerDisplay').textContent = `Time: ${elapsed.toFixed(2)}s`;
  document.getElementById('progressBar').style.width = `${getProgress()}%`;
}

// Start game
initGame();
gameLoop(0);
