const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOver');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScoreEl = document.getElementById('finalScore');

let width, height, dpr;
function resize() {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resize);
resize();

const PALETTE = {
    bg: '#0a0a12',
    orb: ['#00ffff', '#ff00ff', '#ffff00', '#ff6600', '#00ff88'],
    trail: ['rgba(0,255,255,0.3)', 'rgba(255,0,255,0.3)', 'rgba(255,255,0,0.3)'],
    text: '#ffffff',
    particle: ['#00ffff', '#ff00ff', '#ffff00']
};

const AUDIO_CTX = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, dur, type='sine', vol=0.1) {
    if (AUDIO_CTX.state === 'suspended') AUDIO_CTX.resume();
    const osc = AUDIO_CTX.createOscillator();
    const gain = AUDIO_CTX.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(AUDIO_CTX.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, AUDIO_CTX.currentTime + dur);
    osc.stop(AUDIO_CTX.currentTime + dur);
}
function playClick() { playTone(880, 0.08, 'square', 0.08); playTone(1320, 0.06, 'sine', 0.05); }
function playSpawn() { playTone(440, 0.1, 'triangle', 0.06); }
function playGameOver() { playTone(220, 0.3, 'sawtooth', 0.1); playTone(165, 0.4, 'sawtooth', 0.08); }

let orbs = [];
let particles = [];
let score = 0;
let highScore = parseInt(localStorage.getItem('neonReflexHighScore')) || 0;
let timeLeft = 30;
let gameRunning = false;
let spawnTimer = 0;
let lastTime = 0;

highScoreEl.textContent = 'Best: ' + highScore;

class Orb {
    constructor() {
        this.radius = 24 + Math.random() * 16;
        this.x = this.radius + Math.random() * (width - 2 * this.radius);
        this.y = this.radius + Math.random() * (height - 2 * this.radius);
        this.color = PALETTE.orb[Math.floor(Math.random() * PALETTE.orb.length)];
        this.life = 1.5 + Math.random() * 1.5;
        this.maxLife = this.life;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.rotation = 0;
        playSpawn();
    }
    update(dt) {
        this.life -= dt;
        this.pulsePhase += dt * 8;
        this.rotation += dt * 0.5;
        return this.life > 0;
    }
    draw() {
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.15;
        const r = this.radius * pulse;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, this.color);
        grad.addColorStop(0.6, this.color + '80');
        grad.addColorStop(1, this.color + '00');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(this.rotation + i * 2.1) * r * 1.3, Math.sin(this.rotation + i * 2.1) * r * 1.3);
        }
        ctx.stroke();
        ctx.restore();
    }
    contains(px, py) {
        const dx = px - this.x;
        const dy = py - this.y;
        return dx * dx + dy * dy <= this.radius * this.radius;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 300;
        this.vy = (Math.random() - 0.5) * 300;
        this.life = 0.6;
        this.maxLife = 0.6;
        this.size = 3 + Math.random() * 4;
        this.color = color;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.life -= dt;
        return this.life > 0;
    }
    draw() {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function spawnOrb() {
    if (orbs.length < 4) orbs.push(new Orb());
}

function handleClick(e) {
    if (!gameRunning) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (let i = orbs.length - 1; i >= 0; i--) {
        if (orbs[i].contains(x, y)) {
            score += Math.ceil(orbs[i].life * 10);
            scoreEl.textContent = 'Score: ' + score;
            for (let p = 0; p < 12; p++) particles.push(new Particle(orbs[i].x, orbs[i].y, orbs[i].color));
            playClick();
            orbs.splice(i, 1);
            spawnOrb();
            break;
        }
    }
}
canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); if (e.touches[0]) handleClick({clientX: e.touches[0].clientX, clientY: e.touches[0].clientY}); }, {passive: false});

function startGame() {
    score = 0;
    timeLeft = 30;
    orbs = [];
    particles = [];
    gameRunning = true;
    scoreEl.textContent = 'Score: 0';
    timerEl.textContent = '30.00s';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    for (let i = 0; i < 3; i++) spawnOrb();
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function endGame() {
    gameRunning = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neonReflexHighScore', highScore);
        highScoreEl.textContent = 'Best: ' + highScore;
    }
    finalScoreEl.textContent = score;
    gameOverScreen.classList.remove('hidden');
    playGameOver();
}

function gameLoop(now) {
    if (!gameRunning) return;
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    timeLeft -= dt;
    timerEl.textContent = timeLeft.toFixed(2) + 's';
    if (timeLeft <= 0) { endGame(); return; }
    spawnTimer += dt;
    if (spawnTimer > 0.8 + Math.random() * 0.7) { spawnOrb(); spawnTimer = 0; }
    orbs = orbs.filter(o => o.update(dt));
    particles = particles.filter(p => p.update(dt));
    if (orbs.length === 0) spawnOrb();
    draw();
    requestAnimationFrame(gameLoop);
}

function draw() {
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(0,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    particles.forEach(p => p.draw());
    orbs.forEach(o => o.draw());
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

draw();