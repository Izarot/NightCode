const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gridSize = 5;
let tiles = [];
targetImageData = null;
let draggedTile = null;
let mouse = { x: 0, y: 0 };
let gameStarted = false;
let timer = null;
let timeElapsed = 0;
let hintCooldown = 0;
let undoCount = 3;
let dailyChallenge = false;
let achievements = {};

function init() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  resize();
  loadLevel(1);
  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  document.getElementById('hintBtn').addEventListener('click', () => {
    if (hintCooldown <= 0) {
      showHint();
      hintCooldown = 60;
    }
  });
  document.getElementById('revealBtn').addEventListener('click', () => {
    revealSolution();
  });
  window.addEventListener('resize', resize);
}

function resize() {
  const scale = Math.min(canvas.width / 800, canvas.height / 600);
  ctx.scale(scale, scale);
}

function loadLevel(level) {
  // Example level data
  tiles = [];
  targetImageData = null;
  // Replace with actual level loading logic
  // For demo, create random tiles
  for (let i = 0; i < 10; i++) {
    tiles.push({
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
      opacity: 0.5,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      rotated: false
    });
  }
  gameStarted = true;
  if (!dailyChallenge) {
    timer = setInterval(() => {
      timeElapsed++;
      updateTimer();
    }, 1000);
  }
}

function showHint() {
  // Example hint: show ghost image
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function updateTimer() {
  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  document.getElementById('timer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function revealSolution() {
  // Example: fill all tiles
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function update() {
  if (!gameStarted) return;
  // Update tile positions
  requestAnimationFrame(update);
}

function render() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= gridSize; x++) {
    ctx.beginPath();
    ctx.moveTo(x * (canvas.width / gridSize), 0);
    ctx.lineTo(x * (canvas.width / gridSize), canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= gridSize; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * (canvas.height / gridSize));
    ctx.lineTo(canvas.width, y * (canvas.height / gridSize));
    ctx.stroke();
  }
  // Draw tiles
  ctx.save();
  tiles.forEach(tile => {
    ctx.globalAlpha = tile.opacity;
    ctx.fillStyle = tile.color;
    ctx.fillRect(
      tile.x * (canvas.width / gridSize),
      tile.y * (canvas.height / gridSize),
      canvas.width / gridSize,
      canvas.height / gridSize
    );
    ctx.restore();
  });
  // Draw progress bar
  const progress = 0.5; // Example
  const progressBar = document.querySelector('.progress-fill');
  progressBar.style.height = `${progress * 100}%`;
}

function gameLoop() {
  update();
  render();
}

init();
gameLoop();

// Sneaky Feature 1: Responsive Canvas
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  resize();
});

// Sneaky Feature 2: Emoji Favicon
// Already included in index.html via <link rel="icon" />

// Sneaky Feature 3: Vibrant Color Palette
// Tiles use random vibrant colors

// Sneaky Feature 4: LocalStorage High Score
window.addEventListener('beforeunload', () => {
  localStorage.setItem('highScore', timeElapsed);
});

// Sound Effects (Web Audio API)
// Example: Play sound on tile placement
function playSound() {
  const osc = context.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 440;
  const gain = context.createGain();
  gain.gain.value = 0.5;
  osc.connect(gain).connect(context.destination);
  osc.start();
  setTimeout(() => osc.stop(), 500);
}

// Speedrun Timer
// Already implemented in updateTimer()
