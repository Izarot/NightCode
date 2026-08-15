const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('high-score');

// Configuration
const CONFIG = {
    width: 1920,
    height: 1080,
    gravity: 0.6,
    jumpForce: -14,
    speed: 0.6,
    friction: 0.85,
    maxSpeed: 7,
    colors: {
        bg: '#1a1a2e', 
        main: '#16213e', 
        fg: '#0f3460',
        playerBG: '#ff00ff', // Magenta
        playerMain: '#00ffff', // Cyan
        accent: '#e94560'
    }
};

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

// Game State
let gameState = {
    running: true,
    score: 0,
    highScore: localStorage.getItem('layerShift_highScore') || 0,
    layer: 1, // 0: Background, 1: Main, 2: Foreground
    startTime: Date.now(),
    lastSwitch: 0
};

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.color = color;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.life -= 0.05;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 6, 6);
        ctx.globalAlpha = 1.0;
    }
}

class Player {
    constructor() {
        this.x = 300; this.y = 500;
        this.vx = 0; this.vy = 0;
        this.w = 40; this.h = 60;
        this.grounded = false;
    }
    update(platforms) {
        this.vy += CONFIG.gravity;
        this.x += this.vx;
        this.checkCollision(platforms, 'x');
        this.y += this.vy;
        this.grounded = false;
        this.checkCollision(platforms, 'y');
        
        this.vx *= CONFIG.friction;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }
    checkCollision(platforms, axis) {
        for (let p of platforms) {
            if (p.layer!== gameState.layer) continue;
            if (this.x < p.x + p.w && this.x + this.w > p.x &&
                this.y < p.y + p.h && this.y + this.h > p.y) {
                if (axis === 'x') {
                    if (this.vx > 0) this.x = p.x - this.w;
                    else if (this.vx < 0) this.x = p.x + p.w;
                    this.vx = 0;
                } else {
                    if (this.vy > 0) {
                        this.y = p.y - this.h;
                        this.grounded = true;
                        this.vy = 0;
                    } else {
                        this.y = p.y + p.h;
                        this.vy = 0;
                    }
                }
            }
        }
    }
    draw(ctx) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = gameState.layer === 1? CONFIG.colors.playerMain : CONFIG.colors.playerBG;
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.shadowBlur = 0;
    }
}

const player = new Player();
const platforms = [
    {x: 0, y: 1000, w: 1920, h: 120, layer: 1}, // Floor
    {x: 500, y: 800, w: 300, h: 40, layer: 1}, 
    {x: 200, y: 600, w: 300, h: 40, layer: 0}, // BG platform
    {x: 1200, y: 700, w: 300, h: 40, layer: 2}, // FG platform
    {x: 800, y: 450, w: 200, h: 40, layer: 1},
    {x: 400, y: 300, w: 200, h: 40, layer: 2},
    {x: 1400, y: 400, w: 200, h: 40, layer: 0}
];
let particles = [];

function switchLayer() {
    if (Date.now() - gameState.lastSwitch < 300) return;
    gameState.layer = (gameState.layer + 1) % 3;
    gameState.lastSwitch = Date.now();
    playSound(gameState.layer * 200 + 200, 'ine', 0.2);
    
    // Burst
    for(let i=0; i<12; i++) {
        particles.push(new Particle(player.x + 20, player.y + 30, 
            gameState.layer === 1? CONFIG.colors.playerMain : CONFIG.colors.playerBG));
    }
}

function update() {
    if (!gameState.running) return;

    player.update(platforms);

    // Bounds check
    if (player.y > CONFIG.height) {
        player.x = 300; player.y = 500; player.vx = 0; player.vy = 0;
    }

    // Timer
    const elapsed = (Date.now() - gameState.startTime) / 1000;
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toFixed(2).padStart(5, '0');
    timerEl.innerText = `${m}:${s}`;

    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => p.update());
}

function draw() {
    // Clear
    ctx.fillStyle = CONFIG.colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Layers
    [0, 1, 2].forEach(l => {
        ctx.globalAlpha = l === gameState.layer? 1.0 : 0.2;
        ctx.fillStyle = l === 0? '#2c3e50' : l === 1? '#34495e' : '#d35400';
        
        platforms.filter(p => p.layer === l).forEach(p => {
            ctx.fillRect(p.x, p.y, p.w, p.h);
        });
    });
    ctx.globalAlpha = 1.0;

    particles.forEach(p => p.draw(ctx));
    player.draw(ctx);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Input
const keys = {};
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') switchLayer();
});
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousedown', () => switchLayer());

// Mobile Touch Support
window.addEventListener('touchstart', (e) => {
    if (e.touches[0].clientX < window.innerWidth / 2) {
        // Handle movement logic if needed
    } else {
        switchLayer();
    }
});

// Resize
function resize() {
    canvas.width = CONFIG.width;
    canvas.height = CONFIG.height;
}
window.addEventListener('resize', resize);
resize();

// Input Loop for movement
setInterval(() => {
    if (keys['ArrowLeft']) player.vx -= CONFIG.speed;
    if (keys['ArrowRight']) player.vx += CONFIG.speed;
    if (keys['ArrowUp'] && player.grounded) {
        player.vy = CONFIG.jumpForce;
        player.grounded = false;
        playSound(400, 'quare', 0.1);
    }
}, 16);

highscoreEl.innerText = `BEST: ${gameState.highScore}`;
loop();