const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const hudSpeed = document.getElementById('speed');
const hudWind = document.getElementById('wind');
const hudBoost = document.getElementById('gust');
const timerEl = document.getElementById('timer');

function resizeCanvas(){
  const dpr = window.devicePixelRatio || 1;
  const scale = Math.floor(Math.min(window.innerWidth / 640, window.innerHeight / 360));
  canvas.width = 640 * scale;
  canvas.height = 360 * scale;
  canvas.style.width = `${canvas.width / dpr}px`;
  canvas.style.height = `${canvas.height / dpr}px`;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let lastTime = 0;
let accumulator = 0;
const FIXED_DT = 1000 / 60;
let speed = 0;
let wind = 0;
let boost = 0;
let startTime = null;
let highScore = localStorage.getItem('highScore') || 0;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, dur) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur/1000);
  osc.start();
  osc.stop(audioCtx.currentTime + dur/1000);
}
function startTimer(){
  startTime = performance.now();
  const tick = () => {
    const elapsed = performance.now() - startTime;
    const sec = Math.floor(elapsed/1000);
    const ms = Math.floor(elapsed%1000);
    timerEl.textContent = `Timer: ${sec}:${ms.toString().padStart(3, '0')}`;
    requestAnimationFrame(tick);
  };
  tick();
}
startTimer();

function gameLoop(now){
  const dt = now - lastTime;
  lastTime = now;
  accumulator += dt;
  while (accumulator >= FIXED_DT) {
    update(FIXED_DT / 1000);
    accumulator -= FIXED_DT;
  }
  render();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

function update(dt){
  const thrust = Math.max(0, wind * 0.5) + (boost / 100);
  speed = Math.min(speed + thrust * dt, 8);
  hudSpeed.textContent = `Speed: ${Math.floor(speed)}`;
  hudWind.textContent = `Wind: ${Math.round(wind*10)/10}`;
  hudBoost.textContent = `Boost: ${Math.round(boost)}%`;
  if (Math.random() < 0.001){
    wind = (wind + (Math.random() - 0.5) * 0.2) * 0.9 + 0.5;
  }
  if (boost < 100){
    boost += 0.5;
  }
}
function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const grad = ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0,'#001a33');
  grad.addColorStop(1,'#002b5c');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.save();
  const scale = canvas.width/640;
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.rotate(Math.sin(Date.now()*0.001)*0.1);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(0,-20);
  ctx.lineTo(-15,10);
  ctx.lineTo(15,10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
window.addEventListener('keydown', e=>{
  if(e.key==='ArrowUp') wind = Math.min(wind+0.1,1);
  if(e.key==='ArrowDown') wind = Math.max(wind-0.1,0);
  if(e.key===' '){ boost = 100; }
});
window.addEventListener('click',()=>{ boost = 100; });