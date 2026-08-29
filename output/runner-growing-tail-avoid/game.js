const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const distanceEl = document.getElementById('distance');
const timeEl = document.getElementById('time');
const highScoreEl = document.getElementById('highScore');
const finalDistanceEl = document.getElementById('finalDistance');
const finalTailEl = document.getElementById('finalTail');
const menu = document.getElementById('menu');
const gameOver = document.getElementById('gameOver');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const scoreFill = document.getElementById('scoreFill');
const segmentMarkers = document.getElementById('segmentMarkers');

// Game Constants
const GROUND_HEIGHT = 40;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MAX_JUMP_BUTTONS = 3;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;
const TAIL_SEGMENT_SIZE = 10;
const INITIAL_TAIL_LENGTH = 3;
const OBSTACLE_WIDTH = 50;
const OBSTACLE_HEIGHT_MIN = 30;
const OBSTACLE_HEIGHT_MAX = 150;
const OBSTACLE_SPEED_START = 3;
const OBSTACLE_SPEED_INCREMENT = 0.001;
const COLLECTIBLE_RADIUS = 15;
const COLLECTIBLE_SPEED = OBSTACLE_SPEED_START;
const SPAWN_INTERVAL_OBSTACLE = 1500;
const SPAWN_INTERVAL_COLLECTIBLE = 2000;
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

// Color Palette
const COLORS = {
    background: { start: '#4B0082', end: '#00008B' },
    player: '#00FFFF',
    tailStart: '#00FFFF',
    tailEnd: '#FF00FF',
    obstacle: '#FF0040',
    obstacleGlow: 'rgba(255,0,64,0.5)',
    collectible: '#FFFF00',
    ground: '#222',
    hud: '#00FFFF',
    timer: '#FF0040'
};

// Game State
let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER
let score = 0;
let highScore = 0;
let gameTime = 0;
let obstacleSpeed = OBSTACLE_SPEED_START;
let lastObstacleSpawn = 0;
let lastCollectibleSpawn = 0;
let player = {};
let tail = [];
let obstacles = [];
let collectibles = [];
let jumpButtonCount = 0;
let isSliding = false;
let screenShake = 0;
let audioContext = null;

// Initialize
highScore = parseInt(localStorage.getItem('runnerHighScore')) || 0;
highScoreEl.textContent = highScore + 'm';

function resizeCanvas() {
    const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
    canvas.width = GAME_WIDTH * scale;
    canvas.height = GAME_HEIGHT * scale;
    ctx.scale(scale, scale);
}

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    
    switch(type) {
        case 'jump':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
            break;
        case 'collect':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
            break;
        case 'collision':
            oscillator.type = 'noise';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            break;
    }
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
    oscillator.stop(audioContext.currentTime + 0.5);
}

function initPlayer() {
    player = {
        x: 100,
        y: GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        vy: 0,
        jumping: false,
        originalHeight: PLAYER_HEIGHT
    };
}

function initTail() {
    tail = [];
    for (let i = 0; i < INITIAL_TAIL_LENGTH; i++) {
        tail.push({ x: player.x - (i+1)*20, y: player.y });
    }
}

function initGame() {
    initPlayer();
    initTail();
    obstacles = [];
    collectibles = [];
    score = 0;
    gameTime = 0;
    obstacleSpeed = OBSTACLE_SPEED_START;
    lastObstacleSpawn = 0;
    lastCollectibleSpawn = 0;
    jumpButtonCount = 0;
    isSliding = false;
    screenShake = 0;
    distanceEl.textContent = '0m';
    timeEl.textContent = '0s';
}

function update(deltaTime) {
    if (gameState !== 'PLAYING') return;
    
    gameTime += deltaTime / 1000;
    timeEl.textContent = Math.floor(gameTime) + 's';
    
    // Update player physics
    if (!isSliding) {
        player.vy += GRAVITY;
        player.y += player.vy;
        
        // Ground collision
        if (player.y > GAME_HEIGHT - GROUND_HEIGHT - player.height) {
            player.y = GAME_HEIGHT - GROUND_HEIGHT - player.height;
            player.vy = 0;
            player.jumping = false;
            jumpButtonCount = 0;
        }
    }
    
    // Update tail
    tail.unshift({ x: player.x, y: player.y });
    if (tail.length > INITIAL_TAIL_LENGTH + score) {
        tail.pop();
    }
    
    // Spawn obstacles
    if (performance.now() - lastObstacleSpawn > SPAWN_INTERVAL_OBSTACLE) {
        lastObstacleSpawn = performance.now();
        const height = OBSTACLE_HEIGHT_MIN + Math.random() * (OBSTACLE_HEIGHT_MAX - OBSTACLE_HEIGHT_MIN);
        obstacles.push({
            x: GAME_WIDTH,
            y: GAME_HEIGHT - GROUND_HEIGHT - height,
            width: OBSTACLE_WIDTH,
            height: height,
            passed: false
        });
    }
    
    // Spawn collectibles
    if (performance.now() - lastCollectibleSpawn > SPAWN_INTERVAL_COLLECTIBLE) {
        lastCollectibleSpawn = performance.now();
        const y = 50 + Math.random() * (GAME_HEIGHT - GROUND_HEIGHT - 100);
        collectibles.push({
            x: GAME_WIDTH,
            y: y,
            radius: COLLECTIBLE_RADIUS
        });
    }
    
    // Update obstacles and collectibles
    obstacles.forEach(obstacle => {
        obstacle.x -= obstacleSpeed;
        
        // Score when passed
        if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
            obstacle.passed = true;
            score += 10;
            distanceEl.textContent = Math.floor(score) + 'm';
            scoreFill.style.width = (score / 1000) * 100 + '%';
            
            // Increase difficulty
            obstacleSpeed += OBSTACLE_SPEED_INCREMENT;
        }
    });
    
    collectibles.forEach(collectible => {
        collectible.x -= COLLECTIBLE_SPEED;
    });
    
    // Remove off-screen objects
    obstacles = obstacles.filter(ob => ob.x + ob.width > 0);
    collectibles = collectibles.filter(col => col.x + col.radius > 0);
    
    // Check collisions
    if (checkCollisions()) {
        endGame();
    }
    
    // Check self-collision (tail)
    for (let i = 5; i < tail.length; i++) { // Skip first 5 segments to avoid immediate self-collision
        const dx = player.x - tail[i].x;
        const dy = player.y - tail[i].y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        if (distance < PLAYER_WIDTH/2) {
            endGame();
            break;
        }
    }
}

function checkCollisions() {
    // Player vs obstacles
    for (const obstacle of obstacles) {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
            return true;
        }
    }
    
    // Player vs collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i];
        const dx = player.x + player.width/2 - (c.x + c.radius);
        const dy = player.y + player.height/2 - (c.y + c.radius);
        const distance = Math.sqrt(dx*dx + dy*dy);
        if (distance < player.width/2 + c.radius) {
            collectibles.splice(i, 1);
            playSound('collect');
            // Extend tail
            tail.push({ x: tail[tail.length-1].x, y: tail[tail.length-1].y });
            // Screen flash
            document.body.style.background = 'rgba(255,255,255,0.3)';
            setTimeout(() => {
                document.body.style.background = `linear-gradient(180deg, ${COLORS.background.start}, ${COLORS.background.end})`;
            }, 100);
        }
    }
    
    return false;
}

function endGame() {
    playSound('collision');
    gameState = 'GAMEOVER';
    finalDistanceEl.textContent = Math.floor(score) + 'm';
    finalTailEl.textContent = tail.length;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('runnerHighScore', highScore);
        highScoreEl.textContent = highScore + 'm';
    }
    
    gameOver.style.display = 'flex';
    menu.style.display = 'none';
}

function render() {
    // Clear with shake
    ctx.save();
    if (screenShake > 0) {
        ctx.translate(Math.random() * screenShake * 2 - screenShake, Math.random() * screenShake * 2 - screenShake);
        screenShake -= 0.5;
    }
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, COLORS.background.start);
    gradient.addColorStop(1, COLORS.background.end);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Ground
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);
    
    // Obstacles
    obstacles.forEach(obstacle => {
        // Glow effect
        ctx.shadowColor = COLORS.obstacleGlow;
        ctx.shadowBlur = 20;
        ctx.fillStyle = COLORS.obstacle;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.shadowBlur = 0;
    });
    
    // Collectibles
    ctx.fillStyle = COLORS.collectible;
    collectibles.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x + c.radius, c.y + c.radius, c.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Tail
    for (let i = 0; i < tail.length; i++) {
        const ratio = i / tail.length;
        const r = Math.round(parseInt(COLORS.tailStart.substr(1,2), 16) * (1-ratio) + parseInt(COLORS.tailEnd.substr(1,2), 16) * ratio);
        const g = Math.round(parseInt(COLORS.tailStart.substr(3,2), 16) * (1-ratio) + parseInt(COLORS.tailEnd.substr(3,2), 16) * ratio);
        const b = Math.round(parseInt(COLORS.tailStart.substr(5,2), 16) * (1-ratio) + parseInt(COLORS.tailEnd.substr(5,2), 16) * ratio);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.arc(tail[i].x + TAIL_SEGMENT_SIZE/2, tail[i].y + TAIL_SEGMENT_SIZE/2, TAIL_SEGMENT_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Particle effect at tip
        if (i === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(tail[i].x + TAIL_SEGMENT_SIZE/2, tail[i].y + TAIL_SEGMENT_SIZE/2, Math.random()*5 + 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Player
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Update segment markers
    segmentMarkers.innerHTML = '';
    const segmentsToShow = Math.min(20, tail.length);
    for (let i = 0; i < segmentsToShow; i++) {
        const segment = document.createElement('div');
        segment.className = 'segment';
        const ratio = i / segmentsToShow;
        segment.style.background = `rgb(${Math.round(parseInt(COLORS.tailStart.substr(1,2),16)*(1-ratio) + parseInt(COLORS.tailEnd.substr(1,2),16)*ratio)},${Math.round(parseInt(COLORS.tailStart.substr(3,2),16)*(1-ratio) + parseInt(COLORS.tailEnd.substr(3,2),16)*ratio)},${Math.round(parseInt(COLORS.tailStart.substr(5,2),16)*(1-ratio) + parseInt(COLORS.tailEnd.substr(5,2),16)*ratio)})`;
        segmentMarkers.appendChild(segment);
    }
    
    ctx.restore();
}

function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    
    update(deltaTime);
    render();
    
    if (gameState === 'PLAYING') {
        requestAnimationFrame(gameLoop);
    }
}

let lastTimestamp = 0;

// Event Listeners
window.addEventListener('resize', resizeCanvas);

startBtn.addEventListener('click', () => {
    gameState = 'PLAYING';
    menu.style.display = 'none';
    initGame();
    lastTimestamp = 0;
    requestAnimationFrame(gameLoop);
});

restartBtn.addEventListener('click', () => {
    gameOver.style.display = 'none';
    menu.style.display = 'flex';
});

// Keyboard Controls
window.addEventListener('keydown', (e) => {
    if (gameState !== 'PLAYING') return;
    
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (!player.jumping && jumpButtonCount < MAX_JUMP_BUTTONS) {
            player.jumping = true;
            player.vy = JUMP_FORCE;
            jumpButtonCount++;
            playSound('jump');
        }
    }
    
    if (e.code === 'ArrowDown' && !player.jumping) {
        isSliding = true;
        player.height = player.originalHeight / 2;
        player.y = GAME_HEIGHT - GROUND_HEIGHT - player.height;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown' && isSliding) {
        isSliding = false;
        player.height = player.originalHeight;
        player.y = GAME_HEIGHT - GROUND_HEIGHT - player.height;
    }
});

// Touch Controls
let touchStartY = 0;
let touchStartTime = 0;

window.addEventListener('touchstart', (e) => {
    if (gameState !== 'PLAYING') return;
    e.preventDefault();
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
}, { passive: false });

window.addEventListener('touchend', (e) => {
    if (gameState !== 'PLAYING') return;
    e.preventDefault();
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    const swipeDown = touchEndY - touchStartY > 50 && touchEndTime - touchStartTime < 500;
    const tap = Math.abs(touchEndY - touchStartY) < 20 && touchEndTime - touchStartTime < 300;
    
    if (swipeDown && !player.jumping) {
        isSliding = true;
        player.height = player.originalHeight / 2;
        player.y = GAME_HEIGHT - GROUND_HEIGHT - player.height;
    } else if (tap && !player.jumping && jumpButtonCount < MAX_JUMP_BUTTONS) {
        player.jumping = true;
        player.vy = JUMP_FORCE;
        jumpButtonCount++;
            playSound('jump');
        }
    });

