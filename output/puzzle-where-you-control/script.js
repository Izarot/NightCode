// Get canvas and set responsive size
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Player position
let playerX = canvas.width / 2 - 25;
let playerY = canvas.height / 2 - 25;
const playerSize = 50;

// Timing
let startTime = null;
let elapsed = 0;
let highScore = localStorage.getItem('highScore')? parseFloat(localStorage.getItem('highScore')) : 0;

// Sound
let audioCtx = null;
function playBeep() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'uspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'ine';
  osc.frequency.value = 440;
  gain.gain.value = 0.1;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

// Keyboard handling
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function move(delta) {
  const speed = 200; // pixels per second
  let dx = 0, dy = 0;
  if (keys.ArrowLeft || keys.a) dx -= 1;
  if (keys.ArrowRight || keys.d) dx += 1;
  if (keys.ArrowUp || keys.w) dy -= 1;
  if (keys.ArrowDown || keys.s) dy += 1;
  
  playerX += dx * speed * delta;
  playerY += dy * speed * delta;
  
  playerX = Math.max(0, Math.min(playerX, canvas.width - playerSize));
  playerY = Math.max(0, Math.min(playerY, canvas.height - playerSize));
}

function gameLoop(timestamp) {
  if (!startTime) startTime = timestamp;
  const delta = (timestamp - startTime) / 1000; // seconds
  elapsed = delta;
  
  // Update timer display
  document.getElementById('timer').textContent = elapsed.toFixed(1) + '';
  
  // High score check
  if (elapsed > highScore) {
    highScore = elapsed;
    localStorage.setItem('highScore', highScore);
  }
  
  // Movement
  move(delta);
  
  // Draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(playerX, playerY, playerSize, playerSize);
  
  // Sound on key press (throttled by frame rate)
  if (keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown || keys.a || keys.d || keys.w || keys.s) {
    // To prevent sound overlapping too much, we only play if not already playing
    // In a real game we'd use a more robust trigger
  }
  
  requestAnimationFrame(gameLoop);
}

// Handle sound on first interaction to comply with browser policies
window.addEventListener('keydown', () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}, { once: true });

// Trigger beep on movement
const originalMove = move;
move = function(delta) {
    const wasMoving = (keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown || keys.a || keys.d || keys.w || keys.s);
    originalMove(delta);
    if (wasMoving) playBeep();
};

requestAnimationFrame(gameLoop);