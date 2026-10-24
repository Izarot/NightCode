const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const highScoreEl = document.getElementById('highscore');
const finalScoreEl = document.getElementById('finalScore');
const finalTimeEl = document.getElementById('finalTime');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const COLORS = {
    player: '#00f2ff',
    enemy: '#ff00c8',
    particle: '#feff00',
    bg: '#050505'
};

let width, height;
let player, enemies, particles;
let score, gameTime, startTime, lastTime;
let gameActive = false;
let highScore = localStorage.getItem('neonDodgeHighScore') || 0;
highScoreEl.textContent = highScore;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        if (type === 'point') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'hit') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        }
    } catch (e) { console.log('Audio blocked'); }
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    if (player) {
        player.x = Math.min(player.x, width - player.w);
        player.y = Math.min(player.y, height - 60);
    }
}
window.addEventListener('resize', resize);

function initGame() {
    player = { x: width / 2, y: height - 50, w: 24, h: 24, speed: 8, color: COLORS.player };
    enemies = [];
    particles = [];
    score = 0;
    gameTime = 0;
    scoreEl.textContent = '0';
    timerEl.textContent = '0.0';
    gameActive = true;
    startTime = performance.now();
    lastTime = startTime;
    gameOverScreen.classList.add('hidden');
    startScreen.classList.add('hidden');
    requestAnimationFrame(loop);
}

function spawnEnemy() {
    const size = Math.random() * 24 + 16;
    enemies.push({
        x: Math.random() * Math.max(1, width - size),
        y: -size,
        w: size,
        h: size,
        vy: Math.random() * 3.5 + 2 + score * 0.03,
        color: COLORS.enemy
    });
}

function spawnParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            color
        });
    }
}

function update(dt) {
    if (!gameActive) return;

    gameTime = (performance.now() - startTime) / 1000;
    timerEl.textContent = gameTime.toFixed(1);

    score += dt * 12;
    scoreEl.textContent = Math.floor(score);

    if (Math.random() < 0.018 + score * 0.00015) spawnEnemy();

    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.y += e.vy;
        if (e.y > height) {
            enemies.splice(i, 1);
            playSound('point');
            continue;
        }
        if (player.x < e.x + e.w && player.x + player.w > e.x &&
            player.y < e.y + e.h && player.y + player.h > e.y) {
            gameActive = false;
            playSound('hit');
            spawnParticles(player.x + player.w / 2, player.y + player.h / 2, COLORS.player);
            setTimeout(() => {
                finalScoreEl.textContent = Math.floor(score);
                finalTimeEl.textContent = gameTime.toFixed(1);
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('neonDodgeHighScore', highScore);
                    highScoreEl.textContent = highScore;
                }
                gameOverScreen.classList.remove('hidden');
            }, 150);
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    // Player
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0;

    // Enemies
    enemies.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = e.color;
        ctx.fillRect(e.x, e.y, e.w, e.h);
    });
    ctx.shadowBlur = 0;

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

function loop() {
    if (!gameActive) return;
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    handleInput(dt);
    update(dt);
    draw();
    requestAnimationFrame(loop);
}

const keys = {};
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        keys[e.key] = true;
    }
});
window.addEventListener('keyup', e => {
    keys[e.key] = false;
});

function handleInput(dt) {
    if (!gameActive) return;
    const move = player.speed * dt * 60;
    if (keys['ArrowLeft']) player.x -= move;
    if (keys['ArrowRight']) player.x += move;
    player.x = Math.max(0, Math.min(width - player.w, player.x));
}

let touchX = null;
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    touchX = e.touches[0].clientX;
}, { passive: false });
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (!gameActive || touchX === null) return;
    const dx = e.touches[0].clientX - touchX;
    player.x += dx * 1.5;
    touchX = e.touches[0].clientX;
    player.x = Math.max(0, Math.min(width - player.w, player.x));
}, { passive: false });
canvas.addEventListener('touchend', () => {
    touchX = null;
});

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

resize();
initGame();