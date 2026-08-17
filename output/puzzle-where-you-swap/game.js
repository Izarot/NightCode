const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const overlay = document.getElementById('overlay');
const timerEl = document.getElementById('timer');
const highScoreEl = document.getElementById('highScore');

// Game Constants
const COLORS = {
    player: '#00ffcc',
    enemy: '#ff0055',
    bg: '#0a0a12',
    accent: '#ff00ff'
};

let gameState = 'MENU';
let score = 0;
let startTime = 0;
let elapsedTime = 0;
let highScore = localStorage.getItem('neonOrbitHighScore') || 0;

// Audio Engine
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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

// Responsive Scaling
function resize() {
    const size = Math.min(window.innerWidth, window.innerHeight, 800);
    canvas.width = size;
    canvas.height = size;
}
window.addEventListener('resize', resize);
resize();

let player = { x: 0, y: 0, radius: 10, angle: 0 };
let enemies = [];
let particles = [];

function initGame() {
    player = { x: canvas.width / 2, y: canvas.height / 2, radius: 10, angle: 0 };
    enemies = [];
    particles = [];
    startTime = Date.now();
    highScoreEl.innerText = `Best: ${highScore}s`;
}

function spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const dist = canvas.width / 2 + 50;
    enemies.push({
        x: canvas.width / 2 + Math.cos(angle) * dist,
        y: canvas.height / 2 + Math.sin(angle) * dist,
        vx: -Math.cos(angle) * (2 + Math.random() * 2),
        vy: -Math.sin(angle) * (2 + Math.random() * 2),
        radius: 5 + Math.random() * 10
    });
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x, y, 
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            color
        });
    }
}

function update() {
    if (gameState !== 'PLAYING') return;

    elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    timerEl.innerText = `Time: ${elapsedTime}s`;

    // Player movement (orbiting)
    player.angle += 0.05;
    const orbitRadius = 60;
    player.x = canvas.width / 2 + Math.cos(player.angle) * orbitRadius;
    player.y = canvas.height / 2 + Math.sin(player.angle) * orbitRadius;

    // Handle Input (Change orbit direction/radius)
    // Simple: Space or Touch reverses orbit
    
    if (Math.random() < 0.03) spawnEnemy();

    enemies.forEach((e, index) => {
        e.x += e.vx;
        e.y += e.vy;

        const dx = e.x - player.x;
        const dy = e.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < e.radius + player.radius) {
            gameOver();
        }

        if (e.x < 0 || e.x > canvas.width || e.y < 0 || e.y > canvas.height) {
            enemies.splice(index, 1);
        }
    });

    particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) particles.splice(index, 1);
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Orbit Path
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.player;
    ctx.shadowBlur = 15;
    ctx.shadowColor = COLORS.player;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Enemies
    enemies.forEach(e => {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.enemy;
        ctx.shadowBlur = 10;
        ctx.shadowColor = COLORS.enemy;
        ctx.fill();
        ctx.shadowBlur = 0;
    });

    // Draw Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1.0;
}

function gameOver() {
    gameState = 'MENU';
    playSound(150, 'sawtooth', 0.5);
    createExplosion(player.x, player.y, COLORS.player);
    
    if (parseFloat(elapsedTime) > parseFloat(highScore)) {
        highScore = elapsedTime;
        localStorage.setItem('neonOrbitHighScore', highScore);
    }
    
    overlay.style.display = 'flex';
    overlay.querySelector('h1').innerText = 'SYSTEM CRASH';
    overlay.querySelector('p').innerText = `Survival Time: ${elapsedTime}s`;
    startBtn.innerText = 'Reboot System';
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

startBtn.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playSound(440, 'sine', 0.1);
    initGame();
    gameState = 'PLAYING';
    overlay.style.display = 'none';
});

// Interaction to change orbit direction
window.addEventListener('mousedown', () => { if(gameState === 'PLAYING') player.angle -= 0.1; });
window.addEventListener('touchstart', (e) => { 
    e.preventDefault();
    if(gameState === 'PLAYING') player.angle -= 0.1; 
}, {passive: false});

loop();