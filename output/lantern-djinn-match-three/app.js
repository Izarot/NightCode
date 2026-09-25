// Game constants
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const timerElement = document.getElementById('timer');
const finalScoreElement = document.getElementById('final-score');
const finalHighScoreElement = document.getElementById('final-high-score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');

// Set canvas resolution (internal) but scale via CSS
function resizeCanvas() {
    const container = document.getElementById('game-container');
    const maxWidth = Math.min(container.clientWidth, 800);
    const maxHeight = Math.min(container.clientHeight * 0.8, 600);
    canvas.width = maxWidth;
    canvas.height = maxHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game state
let gameState = 'menu'; // 'menu', 'playing', 'gameover'
let score = 0;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
let startTime = 0;
let elapsedTime = 0;
let animationId = null;

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 40,
    radius: 20,
    speed: 6,
    dx: 0,
    dy: 0
};

// Obstacles
const obstacles = [];
const obstacleSpeed = 3;
const obstacleRadius = 15;
const obstacleInterval = 1500; // ms
let lastObstacleTime = 0;

// Web Audio API setup
let audioContext;
let isMuted = false;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(frequency, duration, type = 'sine') {
    if (isMuted || !audioContext) return;
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        console.log('Audio play failed:', e);
    }
}

// Input handling
let keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (gameState === 'playing') {
        if (e.key === ' ') {
            playSound(300, 0.1, 'square');
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    player.x += dx * 0.1;
    player.y += dy * 0.1;
    // Keep player in bounds
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

// Mouse movement for desktop
canvas.addEventListener('mousemove', (e) => {
    if (gameState !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
});

// Game functions
function resetGame() {
    score = 0;
    startTime = performance.now();
    elapsedTime = 0;
    obstacles.length = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height - 40;
    lastObstacleTime = 0;
    scoreElement.textContent = '0';
    timerElement.textContent = '0.00';
    gameState = 'playing';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
}

function spawnObstacle() {
    const x = Math.random() * (canvas.width - obstacleRadius * 2) + obstacleRadius;
    obstacles.push({
        x: x,
        y: -obstacleRadius,
        radius: obstacleRadius,
        speed: obstacleSpeed + Math.random() * 2
    });
}

function update(deltaTime) {
    // Update timer
    if (gameState === 'playing') {
        elapsedTime = (performance.now() - startTime) / 1000;
        timerElement.textContent = elapsedTime.toFixed(2);
    }

    // Spawn obstacles
    lastObstacleTime += deltaTime;
    if (lastObstacleTime > obstacleInterval) {
        spawnObstacle();
        lastObstacleTime = 0;
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.y += obs.speed;

        // Remove off-screen obstacles
        if (obs.y - obs.radius > canvas.height) {
            obstacles.splice(i, 1);
            score++;
            scoreElement.textContent = score.toString();
            playSound(200, 0.1, 'sine');
        }
    }

    // Collision detection
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        const dist = Math.hypot(player.x - obs.x, player.y - obs.y);
        if (dist < player.radius + obs.radius) {
            // Collision!
            playSound(100, 0.3, 'sawtooth');
            endGame();
            return;
        }
    }
}

function drawPlayer() {
    const gradient = ctx.createRadialGradient(
        player.x - player.radius / 3, player.y - player.radius / 3,
        player.radius / 4,
        player.x, player.y, player.radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, '#00f2fe');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawObstacles() {
    obstacles.forEach(obs => {
        const gradient = ctx.createRadialGradient(
            obs.x - obs.radius / 3, obs.y - obs.radius / 3,
            obs.radius / 4,
            obs.x, obs.y, obs.radius
        );
        gradient.addColorStop(0, '#ff006e');
        gradient.addColorStop(1, '#ff6b6b');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawBackground() {
    // Draw grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#0f0c29';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawObstacles();
    drawPlayer();
}

function gameLoop(timestamp) {
    if (!startTime) startTime = timestamp;
    const deltaTime = timestamp - startTime;
    startTime = timestamp;

    if (gameState === 'playing') {
        update(deltaTime);
        draw();
        animationId = requestAnimationFrame(gameLoop);
    } else if (gameState === 'gameover') {
        draw();
    }
}

function endGame() {
    gameState = 'gameover';
    finalScoreElement.textContent = score.toString();
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore.toString());
    }
    finalHighScoreElement.textContent = highScore.toString();
    gameOverScreen.classList.remove('hidden');
}

// Event listeners
startButton.addEventListener('click', () => {
    initAudio();
    resetGame();
});

restartButton.addEventListener('click', () => {
    initAudio();
    resetGame();
});

// Initialize high score display
highScoreElement.textContent = highScore.toString();

// Handle window resize during gameplay
window.addEventListener('resize', () => {
    resizeCanvas();
});

// Prevent scrolling on mobile when touching canvas
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });
