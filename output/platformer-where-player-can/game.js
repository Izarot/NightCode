const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highscore');
const timerEl = document.getElementById('timer');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const finalTimeEl = document.getElementById('final-time');
const newBestEl = document.getElementById('new-best');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

let width, height;
let player, enemies, particles;
let isRunning = false;
let startTime = 0;
let elapsedTime = 0;
let frameCount = 0;
let difficulty = 1;
let highScore = parseFloat(localStorage.getItem('neonDodgeHighScore')) || 0;
highScoreEl.textContent = highScore.toFixed(1);

let audioCtx;
const playSound = (type) => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'point') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    }
};

function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
}

window.addEventListener('resize', resize);
resize();

class Player {
    constructor() {
        this.radius = Math.min(width, height) * 0.03;
        this.x = width / 2;
        this.y = height - this.radius - 20;
        this.speed = Math.min(width, height) * 0.015;
        this.color = '#00f2ff';
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    update(keys, touchX) {
        if (keys.ArrowLeft || keys.a) this.x -= this.speed;
        if (keys.ArrowRight || keys.d) this.x += this.speed;
        if (touchX !== undefined) {
            const targetX = touchX;
            const dx = targetX - this.x;
            this.x += dx * 0.2;
        }
        if (this.x < this.radius) this.x = this.radius;
        if (this.x > width - this.radius) this.x = width - this.radius;
    }
}

class Enemy {
    constructor() {
        this.size = Math.random() * 30 + 20;
        this.x = Math.random() * (width - this.size);
        this.y = -this.size;
        this.speed = Math.random() * 4 + 2 + difficulty;
        this.color = '#ff00ff';
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.shadowBlur = 0;
    }
    update() {
        this.y += this.speed;
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 4, 4);
        ctx.globalAlpha = 1.0;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.05;
    }
}

function initGame() {
    player = new Player();
    enemies = [];
    particles = [];
    elapsedTime = 0;
    frameCount = 0;
    difficulty = 1;
    scoreEl.textContent = '0';
    timerEl.textContent = '0.0';
    isRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    startTime = performance.now();
    playSound('start');
    requestAnimationFrame(loop);
}

function gameOver() {
    isRunning = false;
    const finalTime = elapsedTime;
    finalTimeEl.textContent = finalTime.toFixed(1);

    if (finalTime > highScore) {
        highScore = finalTime;
        localStorage.setItem('neonDodgeHighScore', highScore.toString());
        highScoreEl.textContent = highScore.toFixed(1);
        newBestEl.classList.remove('hidden');
    } else {
        newBestEl.classList.add('hidden');
    }

    playSound('die');
    gameOverScreen.classList.remove('hidden');
}

function spawnEnemy() {
    if (Math.random() < 0.02 * difficulty) {
        enemies.push(new Enemy());
    }
    if (frameCount % 600 === 0) difficulty += 0.2;
}

function checkCollision(p, e) {
    const closestX = Math.max(e.x, Math.min(p.x, e.x + e.size));
    const closestY = Math.max(e.y, Math.min(p.y, e.y + e.size));
    const dx = p.x - closestX;
    const dy = p.y - closestY;
    return (dx * dx + dy * dy) < (p.radius * p.radius);
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

let lastTouchX = null;
canvas.addEventListener('touchstart', e => {
    if (!isRunning) return;
    lastTouchX = e.touches[0].clientX;
}, { passive: false });
canvas.addEventListener('touchmove', e => {
    if (!isRunning) return;
    lastTouchX = e.touches[0].clientX;
    e.preventDefault();
}, { passive: false });
canvas.addEventListener('touchend', () => { lastTouchX = null; });

canvas.addEventListener('mousedown', e => { if (!isRunning) return; lastTouchX = e.clientX; });
canvas.addEventListener('mousemove', e => { if (!isRunning) return; lastTouchX = e.clientX; });
canvas.addEventListener('mouseup', () => { lastTouchX = null; });

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

function loop() {
    if (!isRunning) return;
    const now = performance.now();
    elapsedTime = (now - startTime) / 1000;
    frameCount++;
    
    ctx.clearRect(0, 0, width, height);
    
    timerEl.textContent = elapsedTime.toFixed(1);
    scoreEl.textContent = Math.floor(elapsedTime * 10);
    
    spawnEnemy();
    
    player.update(keys, lastTouchX);
    player.draw();
    
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.update();
        e.draw();
        if (checkCollision(player, e)) {
            createExplosion(player.x, player.y, player.color);
            gameOver();
            return;
        }
        if (e.y > height) enemies.splice(i, 1);
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    requestAnimationFrame(loop);
}
