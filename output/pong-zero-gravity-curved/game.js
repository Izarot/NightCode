const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Configuration ---
const CONFIG = {
    colors: {
        bg: '#050510',
        p1: '#00f3ff', // Cyan
        p2: '#ff00ff', // Magenta
        ball: '#ffffff',
        grid: 'rgba(255, 255, 255, 0.05)'
    },
    physics: {
        ballSpeed: 7,
        speedIncrease: 1.05,
        maxSpeed: 20,
        paddleThrust: 0.4,
        paddleFriction: 0.96,
        paddleMaxSpeed: 4,
        paddleRadius: 120,
        paddleArc: 2.2, // radians (~126 deg)
        ballRadius: 6,
        friction: 0.99
    }
};

// --- State ---
let width, height;
let state = 'MENU'; // MENU, COUNTDOWN, PLAYING, PAUSED, GAMEOVER
let scores = { p1: 0, p2: 0 };
let highScore = parseInt(localStorage.getItem('cvp_high') || '0');
document.getElementById('highScoreDisplay').innerText = highScore;
let gameStartTime = 0;
let pausedTime = 0;
let lastTime = 0;

// --- Audio ---
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, type = 'square', duration = 0.1) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function playHit() { playTone(400, 'square', 0.05); }
function playScore() { playTone(200, 'sawtooth', 0.2); }
function playWall() { playTone(600, 'sine', 0.03); }

// --- Vector Math ---
class Vec {
    constructor(x, y) { this.x = x; this.y = y; }
    add(v) { return new Vec(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vec(this.x - v.x, this.y - v.y); }
    mult(n) { return new Vec(this.x * n, this.y * n); }
    dot(v) { return this.x * v.x + this.y * v.y; }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() { const m = this.mag(); return m === 0 ? new Vec(0,0) : new Vec(this.x/m, this.y/m); }
    limit(max) { const m = this.mag(); if (m > max) return this.normalize().mult(max); return this; }
}

// --- Entities ---
class Paddle {
    constructor(side) {
        this.side = side; // 'left' or 'right'
        this.pos = new Vec(side === 'left' ? 100 : width - 100, height / 2);
        this.vel = new Vec(0, 0);
        this.acc = new Vec(0, 0);
        this.color = side === 'left' ? CONFIG.colors.p1 : CONFIG.colors.p2;
        this.keys = {};
    }

    update(dt) {
        // Apply thrust based on keys
        this.acc = new Vec(0, 0);
        if (this.side === 'left') {
            if (this.keys['w']) this.acc.y -= CONFIG.physics.paddleThrust;
            if (this.keys['s']) this.acc.y += CONFIG.physics.paddleThrust;
            if (this.keys['a']) this.acc.x -= CONFIG.physics.paddleThrust;
            if (this.keys['d']) this.acc.x += CONFIG.physics.paddleThrust;
            // Boundary: Left half
            this.pos.x = Math.max(50, Math.min(width/2 - 50, this.pos.x));
        } else {
            if (this.keys['ArrowUp']) this.acc.y -= CONFIG.physics.paddleThrust;
            if (this.keys['ArrowDown']) this.acc.y += CONFIG.physics.paddleThrust;
            if (this.keys['ArrowLeft']) this.acc.x += CONFIG.physics.paddleThrust;
            if (this.keys['ArrowRight']) this.acc.x -= CONFIG.physics.paddleThrust;
            // Boundary: Right half
            this.pos.x = Math.max(width/2 + 50, Math.min(width - 50, this.pos.x));
        }

        this.pos.y = Math.max(50, Math.min(height - 50, this.pos.y));

        // Physics
        this.vel = this.vel.add(this.acc.mult(dt));
        this.vel = this.vel.mult(CONFIG.physics.paddleFriction);
        this.vel = this.vel.limit(CONFIG.physics.paddleMaxSpeed);
        this.pos = this.pos.add(this.vel.mult(dt));
    }

    draw() {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.lineWidth = 15;
        ctx.strokeStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.lineCap = 'round';

        // Draw Arc
        const startAngle = -CONFIG.physics.paddleArc / 2;
        const endAngle = CONFIG.physics.paddleArc / 2;
        // Orientation: Face inward
        const rotation = this.side === 'left' ? 0 : Math.PI;
        ctx.rotate(rotation);

        ctx.beginPath();
        ctx.arc(0, 0, CONFIG.physics.paddleRadius, startAngle, endAngle);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    getCenter() {
        // Center of curvature is offset from paddle pos based on orientation
        // For simplicity in this implementation, the 'pos' IS the center of curvature visually
        // but the arc is drawn around it. Wait, spec says center of curvature C lies on inner side.
        // Let's make Pos the center of curvature for math simplicity.
        return this.pos;
    }
}

class Ball {
    constructor() {
        this.reset();
        this.trail = [];
    }

    reset() {
        this.pos = new Vec(width / 2, height / 2);
        this.vel = new Vec(0, 0);
        this.active = false;
        this.trail = [];
    }

    launch() {
        const angle = (Math.random() - 0.5) * 1; // -0.5 to 0.5
        const dir = Math.random() > 0.5 ? 1 : -1;
        this.vel = new Vec(dir * CONFIG.physics.ballSpeed, angle * CONFIG.physics.ballSpeed);
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;

        this.pos = this.pos.add(this.vel.mult(dt));

        // Trail
        this.trail.push({pos: this.pos.clone ? this.pos.clone() : new Vec(this.pos.x, this.pos.y), alpha: 1});
        if (this.trail.length > 15) this.trail.shift();
        this.trail.forEach(t => t.alpha -= 0.05);
        this.trail = this.trail.filter(t => t.alpha > 0);

        // Wall Collisions (Top/Bottom)
        if (this.pos.y - CONFIG.physics.ballRadius < 0 || this.pos.y + CONFIG.physics.ballRadius > height) {
            this.vel.y *= -1;
            this.pos.y = Math.max(CONFIG.physics.ballRadius, Math.min(height - CONFIG.physics.ballRadius, this.pos.y));
            playWall();
        }
    }

    draw() {
        // Trail
        this.trail.forEach(t => {
            ctx.strokeStyle = `rgba(255, 255, 255, ${t.alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(t.pos.x, t.pos.y);
            ctx.lineTo(this.pos.x, this.pos.y);
            ctx.stroke();
        });

        // Ball
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.fillStyle = CONFIG.colors.ball;
        ctx.shadowBlur = 15;
        ctx.shadowColor = CONFIG.colors.ball;
        ctx.beginPath();
        ctx.arc(0, 0, CONFIG.physics.ballRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.pos = new Vec(x, y);
        this.vel = new Vec((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
        this.life = 1;
        this.color = color;
    }
    update() {
        this.pos = this.pos.add(this.vel);
        this.life -= 0.05;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// --- Game Objects ---
let p1, p2, ball, particles = [];

function initGame() {
    p1 = new Paddle('left');
    p2 = new Paddle('right');
    ball = new Ball();
    particles = [];
    scores = { p1: 0, p2: 0 };
    gameStartTime = Date.now();
    pausedTime = 0;
    document.getElementById('score').innerText = '0 - 0';
    document.getElementById('newHighScore').style.display = 'none';
}

// --- Input ---
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Map keys to paddle objects
function updateInput() {
    p1.keys = { w: keys['w'], s: keys['s'], a: keys['a'], d: keys['d'] };
    p2.keys = { 'ArrowUp': keys['ArrowUp'], 'ArrowDown': keys['ArrowDown'], 'ArrowLeft': keys['ArrowLeft'], 'ArrowRight': keys['ArrowRight'] };
}

// --- Collision ---
function checkPaddleCollision(ball, paddle) {
    const C = paddle.getCenter();
    const B = ball.pos;
    const r = CONFIG.physics.ballRadius;
    const R = CONFIG.physics.paddleRadius;

    const dVec = B.sub(C);
    const d = dVec.mag();

    // Distance check
    if (d < R - r || d > R + r) return false;

    // Angular sector check
    let theta = Math.atan2(dVec.y, dVec.x);
    let startAngle = -CONFIG.physics.paddleArc / 2;
    let endAngle = CONFIG.physics.paddleArc / 2;

    // Adjust for paddle orientation
    if (paddle.side === 'right') {
        theta = theta - Math.PI;
        while (theta < -Math.PI) theta += Math.PI * 2;
        while (theta > Math.PI) theta -= Math.PI * 2;
    }

    if (theta < startAngle || theta > endAngle) return false;

    // Collision detected
    const normal = dVec.normalize();
    // Reflect
    const dot = ball.vel.dot(normal);
    if (dot > 0) return false; // Moving away

    ball.vel = ball.vel.sub(normal.mult(2 * dot));
    ball.vel = ball.vel.mult(CONFIG.physics.speedIncrease).limit(CONFIG.physics.maxSpeed);

    // Push out
    const overlap = (R + r) - d;
    ball.pos = ball.pos.add(normal.mult(overlap));

    // Particles
    for(let i=0; i<5; i++) particles.push(new Particle(ball.pos.x, ball.pos.y, paddle.color));
    playHit();
    return true;
}

// --- Loop ---
function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    updateInput();

    // Clear
    ctx.fillStyle = CONFIG.colors.bg;
    ctx.fillRect(0, 0, width, height);

    // Draw Grid
    ctx.strokeStyle = CONFIG.colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width/2, 0); ctx.lineTo(width/2, height);
    for(let i=0; i<width; i+=40) {
        ctx.moveTo(i, 0); ctx.lineTo(i, height);
    }
    for(let i=0; i<height; i+=40) {
        ctx.moveTo(0, i); ctx.lineTo(width, i);
    }
    ctx.stroke();

    if (state === 'PLAYING') {
        p1.update(dt);
        p2.update(dt);
        ball.update(dt);

        checkPaddleCollision(ball, p1);
        checkPaddleCollision(ball, p2);

        // Scoring
        if (ball.pos.x < 0) {
            scores.p2++;
            playScore();
            resetRound();
        } else if (ball.pos.x > width) {
            scores.p1++;
            playScore();
            resetRound();
        }

        document.getElementById('score').innerText = `${scores.p1} - ${scores.p2}`;
        document.getElementById('speedMeter').innerText = `SPEED: ${Math.round((ball.vel.mag() / CONFIG.physics.maxSpeed) * 100)}%`;

        // Timer
        const now = Date.now();
        const elapsed = now - gameStartTime - pausedTime;
        const mins = Math.floor(elapsed / 60000);
        const secs = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
        const ms = Math.floor((elapsed % 1000) / 10).toString().padStart(2, '0');
        document.getElementById('timer').innerText = `${mins}:${secs}.${ms}`;

        // Win condition
        if (scores.p1 >= 5 || scores.p2 >= 5) {
            state = 'GAMEOVER';
            showScreen('gameOverScreen');
            const winner = scores.p1 >= 5 ? 'PLAYER 1' : 'PLAYER 2';
            document.getElementById('winnerText').innerText = `${winner} VICTORY`;
            document.getElementById('winnerText').style.color = scores.p1 >= 5 ? CONFIG.colors.p1 : CONFIG.colors.p2;
            document.getElementById('finalScore').innerText = `Time: ${document.getElementById('timer').innerText}`;
            if (elapsed > highScore) {
                highScore = elapsed;
                localStorage.setItem('cvp_high', highScore);
                document.getElementById('newHighScore').style.display = 'block';
            }
        }
    }

    if (state === 'PAUSED') {
        // Just draw objects, no update
    }

    p1.draw();
    p2.draw();
    ball.draw();
    particles.forEach((p, i) => {
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    });

    requestAnimationFrame(loop);
}

function resetRound() {
    ball.reset();
    state = 'COUNTDOWN';
    let count = 3;
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.top = '50%';
    el.style.left = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.fontSize = '5rem';
    el.style.color = '#fff';
    el.style.pointerEvents = 'none';
    el.style.textShadow = '0 0 20px #fff';
    document.body.appendChild(el);

    const interval = setInterval(() => {
        count--;
        if (count > 0) el.innerText = count;
        else {
            clearInterval(interval);
            document.body.removeChild(el);
            ball.launch();
            state = 'PLAYING';
        }
    }, 1000);
    el.innerText = count;
}

// --- UI Management ---
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// --- Event Listeners ---
document.getElementById('btnStart').onclick = () => {
    initAudio();
    initGame();
    showScreen('hudScreen');
    state = 'COUNTDOWN';
    resetRound();
};

document.getElementById('btnControls').onclick = () => showScreen('controlsScreen');
document.getElementById('btnBack').onclick = () => showScreen('menuScreen');
document.getElementById('btnResume').onclick = () => {
    state = 'PLAYING';
    showScreen('hudScreen');
};
document.getElementById('btnPlayAgain').onclick = () => {
    initGame();
    showScreen('hudScreen');
    resetRound();
};
document.getElementById('btnMenu').onclick = () => showScreen('menuScreen');

window.addEventListener('keydown', e => {
    if (e.code === 'Space' && state === 'COUNTDOWN') {
        // Skip countdown if already started? No, just prevent double launch handled by state
    }
    if (e.key === 'p' || e.key === 'P') {
        if (state === 'PLAYING') {
            state = 'PAUSED';
            showScreen('pauseScreen');
        } else if (state === 'PAUSED') {
            state = 'PLAYING';
            showScreen('hudScreen');
        }
    }
});

// Start Loop
requestAnimationFrame(loop);
