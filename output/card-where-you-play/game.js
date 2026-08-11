const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');

// Vibrant Neon Palette
const COLORS = {
    bg: '#16213e',
    player: '#00ffff',
    playerGlow: 'rgba(0, 255, 255, 0.8)',
    obstacle: '#ff006e',
    obstacleGlow: 'rgba(255, 0, 110, 0.8)',
    particle: '#ffbe0b',
    text: '#ffffff',
    grid: 'rgba(0, 255, 255, 0.05)'
};

// Game State
let width, height, dpr;
let player, obstacles, particles;
let score, highScore, gameTime, gameSpeed;
let isGameOver, animationId, lastTime;
let audioCtx;

// Audio Helpers
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}
function playTone(freq, type, duration, vol, startTime = 0) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain).connect(audioCtx.destination);
    const t = audioCtx.currentTime + startTime;
    osc.start(t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.stop(t + duration);
}
function sfxJump() { playTone(440, 'square', 0.1, 0.05); playTone(880, 'square', 0.05, 0.03, 0.05); }
function sfxHit() { playTone(200, 'sawtooth', 0.3, 0.1); playTone(100, 'sawtooth', 0.4, 0.05, 0.1); }
function sfxPoint() { playTone(660, 'sine', 0.05, 0.03); playTone(1320, 'sine', 0.05, 0.02, 0.05); }

// Resize & Init
function resize() {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    if (player) player.y = height - player.h - 20;
}

function initGame() {
    initAudio();
    highScore = parseInt(localStorage.getItem('neonDodgeHighScore')) || 0;
    highscoreEl.textContent = `BEST: ${highScore}`;
    
    player = { x: 50, y: 0, w: 40, h: 40, vy: 0, jumping: false, color: COLORS.player };
    obstacles = [];
    particles = [];
    score = 0;
    gameTime = 0;
    gameSpeed = 5;
    isGameOver = false;
    
    resize();
    player.y = height - player.h - 20;
    
    scoreEl.textContent = `SCORE: ${score}`;
    timerEl.textContent = `TIME: 0.00s`;
    
    lastTime = performance.now();
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(loop);
}

// Input
window.addEventListener('pointerdown', (e) => {
    if (isGameOver) { initGame(); return; }
    if (!player.jumping) { player.vy = -18; player.jumping = true; sfxJump(); }
});
window.addEventListener('keydown', (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); if (isGameOver) initGame(); else if (!player.jumping) { player.vy = -18; player.jumping = true; sfxJump(); } } });
window.addEventListener('resize', resize);

// Game Loop
function loop(ts) {
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    
    if (!isGameOver) {
        update(dt);
        gameTime += dt;
        timerEl.textContent = `TIME: ${gameTime.toFixed(2)}s`;
    }
    draw();
    animationId = requestAnimationFrame(loop);
}

function update(dt) {
    // Player Physics
    const gravity = 40;
    player.vy += gravity * dt;
    player.y += player.vy * dt;
    const groundY = height - player.h - 20;
    if (player.y >= groundY) { player.y = groundY; player.vy = 0; player.jumping = false; }

    // Speed Scaling
    gameSpeed = 5 + gameTime * 0.3;

    // Spawn Obstacles
    if (Math.random() < 0.015 * (1 + gameTime * 0.05)) {
        const h = 30 + Math.random() * 50;
        obstacles.push({ x: width + 20, y: height - h - 20, w: 20 + Math.random() * 30, h, passed: false });
    }

    // Update Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= gameSpeed * dt * 60;
        
        // Collision
        if (player.x < o.x + o.w && player.x + player.w > o.x && player.y < o.y + o.h && player.y + player.h > o.y) {
            gameOver();
            return;
        }
        
        // Score
        if (!o.passed && o.x + o.w < player.x) {
            o.passed = true;
            score++;
            scoreEl.textContent = `SCORE: ${score}`;
            sfxPoint();
            spawnParticles(o.x + o.w/2, o.y + o.h/2, COLORS.particle);
        }
        
        // Cleanup
        if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.02;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function gameOver() {
    isGameOver = true;
    sfxHit();
    spawnParticles(player.x + player.w/2, player.y + player.h/2, COLORS.obstacle, 30);
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neonDodgeHighScore', highScore);
        highscoreEl.textContent = `BEST: ${highScore}`;
    }
}

function spawnParticles(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color, size: 3 + Math.random() * 4 });
    }
}

// Drawing
function draw() {
    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);
    
    // Grid Background Effect
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    const gridSize = 40;
    const offset = (gameTime * 50) % gridSize;
    for (let x = -offset; x < width + gridSize; x += gridSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = -offset; y < height + gridSize; y += gridSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    // Ground Line
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - 20);
    ctx.lineTo(width, height - 20);
    ctx.stroke();

    // Obstacles
    obstacles.forEach(o => {
        ctx.fillStyle = COLORS.obstacle;
        ctx.shadowColor = COLORS.obstacleGlow;
        ctx.shadowBlur = 15;
        roundRect(ctx, o.x, o.y, o.w, o.h, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Top highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(o.x, o.y, o.w, 4);
    });

    // Player
    ctx.fillStyle = COLORS.player;
    ctx.shadowColor = COLORS.playerGlow;
    ctx.shadowBlur = 20;
    roundRect(ctx, player.x, player.y, player.w, player.h, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Eye / Detail
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(player.x + 12, player.y + 14, 4, 0, Math.PI * 2);
    ctx.arc(player.x + 28, player.y + 14, 4, 0, Math.PI * 2);
    ctx.fill();

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Game Over Overlay
    if (isGameOver) {
        ctx.fillStyle = 'rgba(26, 26, 46, 0.9)';
        ctx.fillRect(0, 0, width, height);
        ctx.font = 'bold 48px Segoe UI';
        ctx.fillStyle = COLORS.obstacle;
        ctx.textAlign = 'center';
        ctx.shadowColor = COLORS.obstacleGlow;
        ctx.shadowBlur = 20;
        ctx.fillText('GAME OVER', width/2, height/2 - 40);
        ctx.shadowBlur = 0;
        ctx.font = '24px Segoe UI';
        ctx.fillStyle = COLORS.text;
        ctx.fillText(`Score: ${score}`, width/2, height/2 + 20);
        ctx.fillStyle = COLORS.player;
        ctx.fillText(`Best: ${highScore}`, width/2, height/2 + 55);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '18px Segoe UI';
        ctx.fillText('Tap or Press Space to Restart', width/2, height/2 + 100);
        ctx.textAlign = 'start';
    }
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

initGame();