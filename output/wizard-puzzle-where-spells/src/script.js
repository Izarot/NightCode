// script.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const manaFill = document.getElementById('manaFill');
const timerCount = document.getElementById('timerCount');
let lastTime = 0;
let elapsed = 0;
let highScore = localStorage.getItem('highScore') || 0;
highScore = Number(highScore);

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const width = Math.min(window.innerWidth, 1024);
  const height = Math.min(window.innerHeight, 600);
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  update(delta);
  render();
  lastTime = timestamp;
  requestAnimationFrame(gameLoop);
}
function update(delta) {
  elapsed += delta / 1000;
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60);
  timerCount.textContent = `${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
  const mana = Math.min(100, (parseInt(manaFill.dataset.current)||0) + 2);
  manaFill.dataset.current = mana;
  manaFill.style.width = `${mana}%`;
}
function render() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#c0c0ff';
  ctx.fillRect(50,50,60,60);
  const barX = 20, barY = 20, barW = 150, barH = 20;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX,barY,barW,barH);
  ctx.fillStyle = '#00ffcc';
  ctx.fillRect(barX,barY,parseInt(manaFill.dataset.current),barH);
}
function playCastSound() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  osc.frequency.value = 440;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.2;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  setTimeout(()=>{osc.stop();}, 50);
}
canvas.addEventListener('click', playCastSound);
gameLoop(0);

function updateHighScoreDisplay() {
  const hsEl = document.createElement('div');
  hsEl.textContent = `Best Score: ${highScore}`;
  hsEl.style.position = 'absolute';
  hsEl.style.top = '10px';
  hsEl.style.right = '10px';
  hsEl.style.color = '#fff';
  document.body.appendChild(hsEl);
}
updateHighScoreDisplay();