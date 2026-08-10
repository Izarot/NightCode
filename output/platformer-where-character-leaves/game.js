const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const trailCountEl = document.getElementById('trail-count');
const timerEl = document.getElementById('timer');
const highScoreEl = document.getElementById('high-score');

// --- Audio Engine ---
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

// --- Constants & State ---
const GRAVITY = 0.5;
const MAX_FALL = 12;
const WALK_SPEED = 3.5;
const RUN_SPEED = 6;
const JUMP_FORCE = -12;
const TRAIL_MAX = 500;
const TRAIL_WIDTH = 12;
const TRAIL_HEIGHT = 32;

let gameState = {
    player: { x: 100, y: 100, vx: 0, vy: 0, w: 32, h: 32, grounded: false, wallSliding: false, coyoteTime: 0, jumpBuffer: 0 },
    trails: [],
    platforms: [
        { x: 0, y: 500, w: 2000, h: 50 }, // Ground
        { x: 400, y: 400, w: 100, h: 20 },
        { x: 600, y: 300, w: 100, h: 20 },
        { x: 800, y: 400, w: 100, h: 20 },
        { x: 1000, y: 300, w: 100, h: 20 },
    ],
    keys: { left: false, right: false, up: false, run: false },
    time: 0,
    highScore: localStorage.getItem('trailHighscore') || 0
};

highScoreEl.innerText = `BEST: ${parseFloat(gameState.highScore).toFixed(2)}s`;

// --- Input Handling ---
window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') gameState.keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') gameState.keys.right = true;
    if (e.code === 'Space' || e.code === 'ArrowUp') gameState.keys.up = true;
    if (e.code === 'ShiftLeft') gameState.keys.run = true;
});
window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') gameState.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') gameState.keys.right = false;
    if (e.code === 'Space' || e.code === 'ArrowUp') gameState.keys.up = false;
    if (e.code === 'ShiftLeft') gameState.keys.run = false;
});

// --- Core Logic ---
function update() {
    const p = gameState.player;

    // Movement
    let speed = gameState.keys.run? RUN_SPEED : WALK_SPEED;
    if (!p.grounded) speed *= 0.7;

    if (gameState.keys.left) p.vx = -speed;
    else if (gameState.keys.right) p.vx = speed;
    else p.vx *= 0.8;

    p.vy += GRAVITY;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;

    // Apply movement
    p.x += p.vx;
    p.y += p.vy;

    // Collision Detection (Platforms & Trails)
    p.grounded = false;
    p.wallSliding = false;

    const collidables = [...gameState.platforms,...gameState.trails];

    for (let obj of collidables) {
        // Simple AABB
        if (p.x < obj.x + obj.w && p.x + p.w > obj.x && p.y < obj.y + obj.h && p.y + p.h > obj.y) {
            // Vertical collision
            if (p.vy > 0 && p.y + p.h - p.vy <= obj.y) {
                p.y = obj.y - p.h;
                p.vy = 0;
                p.grounded = true;
                gameState.coyoteTime = 10;
            } else if (p.vy < 0 && p.y - p.vy >= obj.y + obj.h) {
                p.y = obj.y + obj.h;
                p.vy = 0;
            } else {
                // Horizontal collision
                if (p.x < obj.x) p.x = obj.x - p.w;
                else p.x = obj.x + obj.w;
                p.vx = 0;
                // Wall slide check
                if (!p.grounded) p.wallSliding = true;
            }
        }
    }

    if (p.wallSliding && p.vy > 2) p.vy = 2;

    // Jump Logic
    if (gameState.keys.up) {
        if (p.grounded || gameState.coyoteTime > 0) {
            p.vy = JUMP_FORCE;
            p.grounded = false;
            gameState.coyoteTime = 0;
            playSound(400, 'quare', 0.1);
        } else if (p.wallSliding) {
            p.vy = JUMP_FORCE * 0.8;
            p.vx = p.vx > 0? -10 : 10;
            playSound(450, 'quare', 0.1);
        }
    }

    if (gameState.coyoteTime > 0) gameState.coyoteTime--;

    // Trail Generation
    if (Math.abs(p.vx) > 0.5 || Math.abs(p.vy) > 0.5) {
        if (Math.random() < 0.15 && gameState.trails.length < TRAIL_MAX) {
            const last = gameState.trails[gameState.trails.length - 1];
            const dist = last? Math.hypot(p.x - last.x, p.y - last.y) : 10;
            if (dist > 8) {
                gameState.trails.push({ x: p.x, y: p.y + 16, w: TRAIL_WIDTH, h: TRAIL_HEIGHT });
                trailCountEl.innerText = gameState.trails.length;
                if (gameState.trails.length % 10 === 0) playSound(200, 'ine', 0.05);
            }
        }
    }

    // Timer
    gameState.time += 1/60;
    timerEl.innerText = gameState.time.toFixed(2).padStart(5, '0');

    // Death/Reset
    if (p.y > 800) {
        gameState.player.x = 100;
        gameState.player.y = 100;
        gameState.player.vx = 0;
        gameState.player.vy = 0;
        gameState.trails = [];
        gameState.time = 0;
        trailCountEl.innerText = "0";
    }
}

function draw() {
    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Parallax Stars
    ctx.fillStyle = '#ffffff33';
    for(let i=0; i<20; i++) ctx.fillRect((i*137)%canvas.width, (i*257)%canvas.height, 2, 2);

    // Platforms
    ctx.fillStyle = '#16213e';
    gameState.platforms.forEach(plat => {
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.strokeStyle = '#4ecca3';
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
    });

    // Trails
    ctx.fillStyle = '#e9456044';
    ctx.strokeStyle = '#e94560';
    gameState.trails.forEach(t => {
        ctx.fillRect(t.x, t.y, t.w, t.h);
        ctx.strokeRect(t.x, t.y, t.w, t.h);
    });

    // Player
    ctx.fillStyle = '#4ecca3';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#4ecca3';
    ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.w, gameState.player.h);
    ctx.shadowBlur = 0;
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
resize();
loop();