const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

let width, height, player, platforms, particles, score, startTime, gameActive;
const colors = { bg: '#0a0a12', player: '#ff00ff', platform: '#00ffcc', accent: '#ffff00' };

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration) {
 const osc = audioCtx.createOscillator();
 const gain = audioCtx.createGain();
 osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
 gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
 gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
 osc.connect(gain); gain.connect(audioCtx.destination);
 osc.start(); osc.stop(audioCtx.currentTime + duration);
}

function init() {
 width = canvas.width = window.innerWidth;
 height = canvas.height = window.innerHeight;
 player = { x: width / 2, y: height - 50, vx: 0, vy: 0, size: 20 };
 platforms = [];
 particles = [];
 score = 0;
 startTime = Date.now();
 gameActive = true;
 bestEl.innerText = localStorage.getItem('neonBest') || 0;
 for (let i = 0; i < 6; i++) spawnPlatform(i * (height / 6));
}

function spawnPlatform(y) {
 platforms.push({ x: Math.random() * (width - 60), y: y || -20, w: 60, h: 10 });
}

function update() {
 if (!gameActive) return;
 
 player.vy += 0.4; 
 player.x += player.vx;
 player.y += player.vy;

 if (player.x < 0) player.x = width; else if (player.x > width) player.x = 0;

 platforms.forEach((p, i) => {
 if (player.vy > 0 && player.x + player.size > p.x && player.x < p.x + p.w && player.y + player.size > p.y && player.y + player.size < p.y + p.h + 10) {
 player.vy = -12;
 playSound(400, 'square', 0.1);
 }
 p.y += 2; 
 if (p.y > height) {
 platforms.splice(i, 1);
 spawnPlatform();
 score++;
 scoreEl.innerText = score;
 }
 });

 if (player.y > height) {
 gameActive = false;
 const best = localStorage.getItem('neonBest') || 0;
 if (score > best) localStorage.setItem('neonBest', score);
 playSound(100, 'sawtooth', 0.5);
 setTimeout(init, 1000);
 }

 timerEl.innerText = ((Date.now() - startTime) / 1000).toFixed(2);
}

function draw() {
 ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, width, height);
 ctx.fillStyle = colors.player; ctx.shadowBlur = 15; ctx.shadowColor = colors.player;
 ctx.fillRect(player.x, player.y, player.size, player.size);
 ctx.fillStyle = colors.platform; ctx.shadowColor = colors.platform;
 platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));
 ctx.shadowBlur = 0;
 requestAnimationFrame(() => { update(); draw(); });
}

window.addEventListener('keydown', e => {
 if (e.key === 'ArrowLeft') player.vx = -5;
 if (e.key === 'ArrowRight') player.vx = 5;
});
window.addEventListener('keyup', () => player.vx = 0);
window.addEventListener('touchstart', e => {
 const touchX = e.touches[0].clientX;
 player.vx = touchX < width / 2 ? -5 : 5;
});
window.addEventListener('touchend', () => player.vx = 0);
window.addEventListener('resize', init);

init();
draw();