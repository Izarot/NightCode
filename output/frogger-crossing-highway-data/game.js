const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const TILE_SIZE = 32;
const COLS = 20;
const ROWS = 30;
canvas.width = COLS * TILE_SIZE;
canvas.height = ROWS * TILE_SIZE;

// Colors (Vibrant Cyberpunk Palette)
const COLORS = {
    bg: '#0a0a12',
    grid: '#1a1a2e',
    player: '#00ffcc',
    packet: '#ff00ff',
    firewall: '#ff3e3e',
    glitch: '#ffff00',
    hub: '#ffffff',
    node: '#00ffff'
};

// Audio Engine (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Game State
let gameState = 'MENU';
let score = 0;
let highScore = localStorage.getItem('df_highscore') || 0;
let lives = 3;
let level = 1;
let timer = 60;
let lastTime = 0;
let timerInterval;

const player = {
    x: 10 * TILE_SIZE,
    y: 29 * TILE_SIZE,
    targetX: 10 * TILE_SIZE,
    targetY: 29 * TILE_SIZE,
    moveSpeed: 200,
    isMoving: false,
    lastMoveTime: 0
};

class Obstacle {
    constructor(row, speed, type) {
        this.w = TILE_SIZE * (type === 'firewall'? 2 : 1.5);
        this.h = TILE_SIZE;
        this.x = Math.random() * canvas.width;
        this.y = row * TILE_SIZE;
        this.speed = speed;
        this.type = type;
    }
    update() {
        this.x += this.speed;
        if (this.x > canvas.width) this.x = -this.w;
        if (this.x + this.w < 0) this.x = canvas.width;
    }
    draw() {
        ctx.fillStyle = this.type === 'firewall'? COLORS.firewall : COLORS.packet;
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(this.x, this.y + 4, this.w, this.h - 8);
        ctx.shadowBlur = 0;
    }
}

let obstacles = [];
function initLevel() {
    obstacles = [];
    const laneCount = 4 + level;
    for (let i = 1; i < laneCount; i++) {
        const speed = (Math.random() * 50 + 40 + (level * 10)) * (i % 2 === 0? 1 : -1);
        const count = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < count; j++) {
            obstacles.push(new Obstacle(i, speed, i % 3 === 0? 'firewall' : 'packet'));
        }
    }
    player.x = 10 * TILE_SIZE;
    player.y = 29 * TILE_SIZE;
    player.targetX = 10 * TILE_SIZE;
    player.targetY = 29 * TILE_SIZE;
    timer = 60 - (level * 2);
    startTimer();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (gameState === 'PLAYING') {
            timer--;
            if (timer <= 0) gameOver();
        }
    }, 1000);
}

function gameOver() {
    gameState = 'GAMEOVER';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('df_highscore', highScore);
    }
    playSound(150, 'awtooth', 0.5);
}

// Input Handling
window.addEventListener('keydown', e => {
    if (gameState!== 'PLAYING') {
        if (gameState === 'MENU' || gameState === 'GAMEOVER') {
            score = 0;
            level = 1;
            initLevel();
            gameState = 'PLAYING';
        }
        return;
    }

    const now = Date.now();
    if (now - player.lastMoveTime < player.moveSpeed) return;
    player.lastMoveTime = now;

    let moved = false;
    if (e.key === 'ArrowUp' || e.key === 'w') { player.targetY -= TILE_SIZE; moved = true; }
    if (e.key === 'ArrowDown' || e.key === '') { player.targetY += TILE_SIZE; moved = true; }
    if (e.key === 'ArrowLeft' || e.key === 'a') { player.targetX -= TILE_SIZE; moved = true; }
    if (e.key === 'ArrowRight' || e.key === 'd') { player.targetX += TILE_SIZE; moved = true; }

    if (moved) {
        player.x = player.targetX;
        player.y = player.targetY;
        playSound(440, 'ine', 0.1);
        checkCollision();
    }
});

function checkCollision() {
    // Bounds
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x >= canvas.width) player.x = canvas.width - TILE_SIZE;
    if (player.y >= canvas.height) player.y = canvas.height - TILE_SIZE;

    // Win Condition
    if (player.y < TILE_SIZE) {
        score += 100;
        level++;
        initLevel();
    }

    // Obstacle Collision
    for (let obs of obstacles) {
        if (player.x < obs.x + obs.w && player.x + TILE_SIZE > obs.x &&
            player.y < obs.y + obs.h && player.y + TILE_SIZE > obs.y) {
            lives--;
            playSound(100, 'quare', 0.3);
            if (lives <= 0) gameOver();
            else {
                player.x = 10 * TILE_SIZE;
                player.y = 29 * TILE_SIZE;
                player.targetX = 10 * TILE_SIZE;
                player.targetY = 29 * TILE_SIZE;
            }
            break;
        }
    }
}

function update(time) {
    if (gameState === 'PLAYING') {
        obstacles.forEach(obs => obs.update());
        checkCollision();
    }
    requestAnimationFrame(update);
}

function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath(); ctx.moveTo(i * TILE_SIZE, 0); ctx.lineTo(i * TILE_SIZE, canvas.height); ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath(); ctx.moveTo(0, i * TILE_SIZE); ctx.lineTo(canvas.width, i * TILE_SIZE); ctx.stroke();
    }

    // Draw Hub
    ctx.fillStyle = COLORS.hub;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';
    ctx.fillRect(10 * TILE_SIZE, 0, TILE_SIZE * 2, TILE_SIZE);
    ctx.shadowBlur = 0;

    // Draw Obstacles
    obstacles.forEach(obs => obs.draw());

    // Draw Player
    ctx.fillStyle = COLORS.player;
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.player;
    ctx.fillRect(player.x + 4, player.y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '20px Courier New';
    ctx.fillText(`SCORE: ${score}`, 20, 30);
    ctx.fillText(`HIGH: ${highScore}`, 20, 55);
    ctx.fillText(`TIME: ${timer}`, canvas.width / 2 - 30, 30);
    ctx.fillText(`LIVES: ${'🐸'.repeat(lives)}`, canvas.width - 150, 30);

    if (gameState === 'MENU') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0ff';
        ctx.font = '40px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('DATA FROGGER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '20px Courier New';
        ctx.fillText('PRESS ANY KEY TO START', canvas.width / 2, canvas.height / 2 + 40);
    }

    if (gameState === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '40px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM CRASHED', canvas.width / 2, canvas.height / 2);
        ctx.font = '20px Courier New';
        ctx.fillText('PRESS ANY KEY TO REBOOT', canvas.width / 2, canvas.height / 2 + 50);
    }

    requestAnimationFrame(draw);
}

// Start
update();
draw();