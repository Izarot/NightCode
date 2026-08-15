const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highEl = document.getElementById('high');
const timerEl = document.getElementById('timer');
const overlay = document.getElementById('overlay');
const finalScoreEl = document.getElementById('finalScore');

let width, height, player, obstacles, score, startTime, gameActive, highScore;

const colors = { bg: '#0a0a12', player: '#00f2ff', obstacle: '#ff00ff', accent: '#7000ff' };

audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration) {
 const osc = audioCtx.createOscillator();
 const gain = audioCtx.createGain();
 osc.type = type;
 osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
 gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
 gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
 osc.connect(gain);
 gain.connect(audioCtx.destination);
 osc.start();
 osc.stop(audioCtx.currentTime + duration);
}

function resize() {
 const scale = Math.min(window.innerWidth / 800, window.innerHeight / 400);
 canvas.width = 800;
 canvas.height = 400;
 canvas.style.width = (800 * scale) + 'px';
 canvas.style.height = (400 * scale) + 'px';
}

window.addEventListener('resize', resize);
resize();

class Player {
 constructor() {
 this.x = 50; this.y = 200; this.size = 30;
 this.vy = 0; this.gravity = 0.6; this.jump = -12;
 }
 update() {
 this.vy += this.gravity;
 this.y += this.vy;
 if (this.y + this.size > canvas.height) {
 this.y = canvas.height - this.size;
 this.vy = 0;
 }
 if (this.y < 0) this.y = 0;
 }
 draw() {
 ctx.fillStyle = colors.player;
 ctx.shadowBlur = 15;
 ctx.shadowColor = colors.player;
 ctx.fillRect(this.x, this.y, this.size, this.size);
 ctx.shadowBlur = 0;
 }
}

class Obstacle {
 constructor() {
 this.x = canvas.width;
 this.w = 30 + Math.random() * 30;
 this.h = 40 + Math.random() * 60;
 this.speed = 5 + (score / 5);
 }
 update() { this.x -= this.speed; }
 draw() {
 ctx.fillStyle = colors.obstacle;
 ctx.shadowBlur = 10;
 ctx.shadowColor = colors.obstacle;
 ctx.fillRect(this.x, canvas.height - this.h, this.w, this.h);
 ctx.shadowBlur = 0;
 }
}

function resetGame() {
 player = new Player();
 obstacles = [];
 score = 0;
 startTime = Date.now();
 gameActive = true;
 overlay.style.display = 'none';
 highScore = localStorage.getItem('neonDashHigh') || 0;
 highEl.innerText = highScore;
 requestAnimationFrame(loop);
}

function gameOver() {
 gameActive = false;
 playSound(150, 'awtooth', 0.5);
 if (score > highScore) {
 localStorage.setItem('neonDashHigh', score);
 }
 finalScoreEl.innerText = score;
 overlay.style.display = 'block';
}

function loop() {
 if (!gameActive) return;
 ctx.fillStyle = colors.bg;
 ctx.fillRect(0, 0, canvas.width, canvas.height);

 player.update();
 player.draw();

 if (Math.random() < 0.02) obstacles.push(new Obstacle());

 for (let i = obstacles.length - 1; i >= 0; i--) {
 obstacles[i].update();
 obstacles[i].draw();

 if (player.x < obstacles[i].x + obstacles[i].w &&
 player.x + player.size > obstacles[i].x &&
 player.y + player.size > canvas.height - obstacles[i].h) {
 gameOver();
 }

 if (obstacles[i].x + obstacles[i].w < 0) {
 obstacles.splice(i, 1);
 score++;
 scoreEl.innerText = score;
 playSound(440, 'ine', 0.1);
 }
 }

 timerEl.innerText = ((Date.now() - startTime) / 1000).toFixed(2) + '';
 requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e) => {
 if (e.code === 'Space' || e.code === 'ArrowUp') {
 if (player.y >= canvas.height - player.size - 1) {
 player.vy = player.jump;
 playSound(600, 'ine', 0.1);
 }
 }
});

canvas.addEventListener('touchstart', (e) => {
 e.preventDefault();
 if (player.y >= canvas.height - player.size - 1) {
 player.vy = player.jump;
 playSound(600, 'ine', 0.1);
 }
}, {passive: false});

resetGame();