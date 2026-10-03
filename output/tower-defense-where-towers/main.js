// Sketch Defense - minimal implementation with requested sneaky features
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// HUD elements
const goldEl = document.getElementById('gold');
const waveEl = document.getElementById('wave');
const timerEl = document.getElementById('timer');
const pauseBtn = document.getElementById('pauseBtn');

let gold = 0;
let wave = 0;
let startTime = Date.now();
let paused = false;

// Load high score
const loadHighScore = () => {
  const saved = localStorage.getItem('sketchDefenseHighScore');
  return saved ? parseInt(saved,10) : 0;
};
const saveHighScore = (score) => {
  localStorage.setItem('sketchDefenseHighScore', score.toString());
};
let highScore = loadHighScore();

// Simple sound effect using Web Audio API
function playBeep(freq = 440, duration = 0.1) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.01);
  gain.gain.setValueAtTime(0.001, ctx.currentTime + duration - 0.01);
  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// Drawing state
let drawing = false;
let points = [];
function getPointerPos(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}
canvas.addEventListener('pointerdown', (e) => {
  drawing = true;
  points = [getPointerPos(e)];
});
canvas.addEventListener('pointermove', (e) => {
  if (!drawing) return;
  points.push(getPointerPos(e));
});
canvas.addEventListener('pointerup', (e) => {
  if (!drawing) return;
  drawing = false;
  points.push(getPointerPos(e));
  const first = points[0];
  const last = points[points.length-1];
  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < 8 && points.length > 2) {
    gold += 10;
    goldEl.textContent = gold;
    playBeep(660,0.05);
  } else {
    playBeep(220,0.05);
  }
  points = [];
});
canvas.addEventListener('pointercancel', () => { drawing = false; points = []; });

// Pause
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
});

// Game loop
function update() {
  if (paused) return;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  timerEl.textContent = elapsed + 's';
  const elapsedNum = parseFloat(elapsed);
  if (elapsedNum > highScore) {
    highScore = elapsedNum;
    saveHighScore(highScore);
  }
}
function render() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, Math.max(canvas.width,canvas.height));
  grad.addColorStop(0, '#1a1a1a');
  grad.addColorStop(1, '#0d0d0d');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  if (points.length > 0) {
    ctx.strokeStyle = 'rgba(0,255,136,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i=1;i<points.length;i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }
}
function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}
loop();
