const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let timeSeconds = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let isRunning = true;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(duration = 0.1, freq = 440) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function gameLoop() {
  if (!isRunning) return;

  timeSeconds++;
  const minutes = Math.floor(timeSeconds / 60);
  const seconds = timeSeconds % 60;
  document.getElementById('timer').textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
  document.getElementById('timeDisplay').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const hunger = Math.max(0, 100 - timeSeconds / 2);
  const hungerFill = hunger / 100;

  score = Math.floor(timeSeconds / 10);
  document.getElementById('lcScore').textContent = `Score: ${score}`;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
    playBeep(0.2, 660);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const charX = canvas.width / 2;
  const charY = canvas.height / 2;
  const charRadius = 20;
  let charColor;
  if (hunger > 75) charColor = '#ff6f61';
  else if (hunger > 50) charColor = '#ffa500';
  else charColor = '#ffd700';
  ctx.fillStyle = charColor;
  ctx.beginPath();
  ctx.arc(charX, charY, charRadius, 0, Math.PI * 2);
  ctx.fill();

  const healthBarWidth = 150;
  const healthBarX = 20;
  const healthBarY = canvas.height - 30;
  ctx.fillStyle = '#444';
  ctx.fillRect(healthBarX, healthBarY, healthBarWidth, 10);
  ctx.fillStyle = '#0f0';
  ctx.fillRect(healthBarX, healthBarY, healthBarWidth * hungerFill, 10);

  requestAnimationFrame(gameLoop);
}

gameLoop();