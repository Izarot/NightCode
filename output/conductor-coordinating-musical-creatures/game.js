// SYNCOPATION - Maestro Game
const CANVAS = document.getElementById('gameCanvas');
const CTX = CANVAS.getContext('2d');
const SPEEDRUN_TIMER = document.getElementById('speedrunTimer');
const HIGH_SCORE_DISPLAY = document.getElementById('highScoreDisplay');

// Game Constants
const TARGET_WIDTH = 1280;
const TARGET_HEIGHT = 720;
const BPM = 138;
const BEAT_INTERVAL = 60 / BPM;
const SAMPLE_RATE = 44100;

// Game State
let gameState = {
    score: 0,
    combo: 0,
    highScore: 0,
    accuracy: 100,
    hits: { perfect: 0, good: 0, miss: 0 },
    gameStarted: false,
    gameOver: false,
    startTime: 0,
    elapsedTime: 0,
    beat: 0,
    nextBeat: 0,
    lastBeatTime: 0
};

// Audio Engine
let audioCtx = null;
let masterGain = null;
let isAudioReady = false;

// Baton State
let baton = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    trail: [],
    targetX: 0,
    targetY: 0
};

// Creatures
let creatures = [];
const CREATURE_TYPES = ['PULSAR', 'DRIFTER', 'ARPENT', 'RESONATOR', 'CHORIST'];

// Color Palette - Vibrant Synesthesia
const COLORS = {
    PULSAR: '#ff006e',      // Magenta
    DRIFTER: '#00d4ff',     // Cyan
    ARPENT: '#ffbe00',      // Gold
    RESONATOR: '#7b2cbf',   // Purple
    CHORIST: '#00ff9d',     // Emerald
    HARMONY: '#ffffff',
    BEAT_RING: '#00ff00',
    ACC_PERFECT: '#00ff00',
    ACC_GOOD: '#ffff00',
    ACC_MISS: '#ff0000'
};

// Initialize Game
function init() {
    resizeCanvas();
    loadHighScore();
    setupAudio();
    setupInput();
    requestAnimationFrame(gameLoop);
}

// Responsive Canvas
function resizeCanvas() {
    const rect = CANVAS.getBoundingClientRect();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    CANVAS.width = rect.width * scale;
    CANVAS.height = rect.height * scale;
    CANVAS.style.width = rect.width + 'px';
    CANVAS.style.height = rect.height + 'px';
    CTX.setTransform(scale, 0, 0, scale, 0, 0);
    baton.x = TARGET_WIDTH / 2;
    baton.y = TARGET_HEIGHT / 2;
    baton.targetX = baton.x;
    baton.targetY = baton.y;
}

// Load High Score from LocalStorage
function loadHighScore() {
    const saved = localStorage.getItem('syncopation_highscore');
    if (saved) {
        gameState.highScore = parseInt(saved, 10);
    }
    HIGH_SCORE_DISPLAY.textContent = `HI: ${String(gameState.highScore).padStart(6, '0')}`;
}

// Save High Score to LocalStorage
function saveHighScore() {
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('syncopation_highscore', gameState.highScore.toString());
        HIGH_SCORE_DISPLAY.textContent = `HI: ${String(gameState.highScore).padStart(6, '0')}`;
    }
}

// Web Audio API Setup
function setupAudio() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.5;
        masterGain.connect(audioCtx.destination);
        isAudioReady = true;
    } catch (e) {
        console.warn('Web Audio API not supported');
    }
}

// Play Sound Effect
function playSound(frequency, duration, type = 'sine') {
    if (!isAudioReady || !audioCtx) return;
    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.warn('Sound error:', e);
    }
}

// Setup Input
function setupInput() {
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', (e) => {
        baton.targetX = e.clientX;
        baton.targetY = e.clientY;
    });
    window.addEventListener('mousedown', () => {
        if (!gameState.gameStarted) {
            gameState.gameStarted = true;
            gameState.startTime = performance.now();
        }
        if (gameState.gameOver) return;
        playSound(440, 0.1, 'square');
        checkBeatHit();
    });
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !gameState.gameStarted) {
            gameState.gameStarted = true;
            gameState.startTime = performance.now();
        }
        if (e.code === 'Enter' && gameState.gameOver) {
            resetGame();
        }
    });
}

// Check Beat Hit
function checkBeatHit() {
    const now = performance.now();
    const timeSinceStart = now - gameState.startTime;
    const currentBeat = timeSinceStart / (BEAT_INTERVAL * 1000);
    const beatDiff = Math.abs(currentBeat - gameState.beat);
    
    if (beatDiff < 0.05) {
        // Perfect hit
        gameState.hits.perfect++;
        gameState.combo++;
        gameState.score += 100 * gameState.combo;
        gameState.accuracy = Math.min(100, gameState.accuracy + 0.1);
        playSound(880, 0.15, 'sawtooth');
        spawnCreature('PULSAR');
    } else if (beatDiff < 0.1) {
        // Good hit
        gameState.hits.good++;
        gameState.combo = Math.max(0, gameState.combo - 1);
        gameState.score += 50;
        gameState.accuracy = Math.min(100, gameState.accuracy + 0.05);
        playSound(440, 0.1, 'triangle');
    } else {
        // Miss
        gameState.hits.miss++;
        gameState.combo = 0;
        gameState.accuracy = Math.max(0, gameState.accuracy - 1);
        playSound(110, 0.2, 'sawtooth');
    }
    
    saveHighScore();
}

// Spawn Creature
function spawnCreature(type) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 100 + Math.random() * 100;
    creatures.push({
        type: type,
        x: TARGET_WIDTH / 2 + Math.cos(angle) * radius,
        y: TARGET_HEIGHT / 2 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1,
        size: 10 + Math.random() * 10
    });
}

// Update Baton Physics
function updateBaton() {
    // Spring-damper physics for baton
    const stiffness = 0.1;
    const damping = 0.8;
    
    baton.vx += (baton.targetX - baton.x) * stiffness - baton.vx * damping;
    baton.vy += (baton.targetY - baton.y) * stiffness - baton.vy * damping;
    baton.x += baton.vx;
    baton.y += baton.vy;
    
    // Update angle based on velocity
    if (Math.abs(baton.vx) > 0.1 || Math.abs(baton.vy) > 0.1) {
        baton.angle = Math.atan2(baton.vy, baton.vx) - Math.PI / 2;
    }
    
    // Update trail
    baton.trail.push({ x: baton.x, y: baton.y, time: Date.now() });
    if (baton.trail.length > 12) baton.trail.shift();
}

// Update Creatures
function updateCreatures() {
    for (let i = creatures.length - 1; i >= 0; i--) {
        const c = creatures[i];
        c.x += c.vx;
        c.y += c.vy;
        c.life -= 0.01;
        
        // Move towards center
        const dx = TARGET_WIDTH / 2 - c.x;
        const dy = TARGET_HEIGHT / 2 - c.y;
        c.vx += dx * 0.001;
        c.vy += dy * 0.001;
        
        if (c.life <= 0) {
            creatures.splice(i, 1);
        }
    }
}

// Update Beat
function updateBeat() {
    const now = performance.now();
    if (gameState.gameStarted) {
        const timeSinceStart = now - gameState.startTime;
        gameState.beat = Math.floor(timeSinceStart / (BEAT_INTERVAL * 1000));
        gameState.elapsedTime = timeSinceStart;
    }
}

// Update Speedrun Timer
function updateSpeedrunTimer() {
    if (gameState.gameStarted && !gameState.gameOver) {
        const elapsed = performance.now() - gameState.startTime;
        const seconds = Math.floor(elapsed / 1000);
        const tenths = Math.floor((elapsed % 1000) / 100);
        SPEEDRUN_TIMER.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}.${tenths}`;
    }
}

// Render Functions
function render() {
    // Clear canvas
    CTX.fillStyle = '#08080c';
    CTX.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    
    // Draw beat ring
    drawBeatRing();
    
    // Draw baton trail
    drawBatonTrail();
    
    // Draw baton
    drawBaton();
    
    // Draw creatures
    drawCreatures();
    
    // Draw HUD
    drawHUD();
}

function drawBeatRing() {
    CTX.strokeStyle = COLORS.BEAT_RING;
    CTX.lineWidth = 2;
    CTX.beginPath();
    CTX.arc(TARGET_WIDTH / 2, TARGET_HEIGHT / 2, 80, 0, Math.PI * 2);
    CTX.stroke();
    
    // Beat markers
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        CTX.beginPath();
        CTX.moveTo(TARGET_WIDTH / 2 + 70 * Math.cos(angle), TARGET_HEIGHT / 2 + 70 * Math.sin(angle));
        CTX.lineTo(TARGET_WIDTH / 2 + 80 * Math.cos(angle), TARGET_HEIGHT / 2 + 80 * Math.sin(angle));
        CTX.stroke();
    }
}

function drawBatonTrail() {
    if (baton.trail.length < 2) return;
    
    CTX.lineStyle = 'rgba(255, 255, 255, 0.3)';
    CTX.lineCap = 'round';
    CTX.lineWidth = 4;
    CTX.globalCompositeOperation = 'lighter';
    
    CTX.beginPath();
    for (let i = 0; i < baton.trail.length - 1; i++) {
        const p1 = baton.trail[i];
        const p2 = baton.trail[i + 1];
        CTX.moveTo(p1.x, p1.y);
        CTX.lineTo(p2.x, p2.y);
    }
    CTX.stroke();
    CTX.globalCompositeOperation = 'source-over';
}

function drawBaton() {
    CTX.save();
    CTX.translate(baton.x, baton.y);
    CTX.rotate(baton.angle);
    
    // Baton shaft
    CTX.fillStyle = COLORS.HARMONY;
    CTX.fillRect(-3, -10, 6, 40);
    
    // Baton tip
    CTX.fillStyle = '#ffffff';
    CTX.beginPath();
    CTX.arc(0, -10, 5, 0, Math.PI * 2);
    CTX.fill();
    
    CTX.restore();
}

function drawCreatures() {
    creatures.forEach(c => {
        switch (c.type) {
            case 'PULSAR':
                drawPulsar(c);
                break;
            case 'DRIFTER':
                drawDrifter(c);
                break;
            case 'ARPENT':
                drawArpent(c);
                break;
            case 'RESONATOR':
                drawResonator(c);
                break;
            case 'CHORIST':
                drawChorist(c);
                break;
        }
    });
}

function drawPulsar(c) {
    CTX.fillStyle = COLORS.PULSAR;
    CTX.globalAlpha = c.life;
    const size = c.size * (1 + Math.sin(c.life * 20) * 0.5);
    CTX.beginPath();
    CTX.moveTo(c.x, c.y - size);
    for (let i = 1; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        CTX.lineTo(c.x + Math.cos(angle) * size, c.y + Math.sin(angle) * size);
    }
    CTX.closePath();
    CTX.fill();
    CTX.globalAlpha = 1;
}

function drawDrifter(c) {
    CTX.fillStyle = COLORS.DRIFTER;
    CTX.globalAlpha = c.life;
    CTX.beginPath();
    CTX.arc(c.x, c.y, c.size, 0, Math.PI * 2);
    CTX.fill();
    CTX.globalAlpha = 1;
}

function drawArpent(c) {
    CTX.strokeStyle = COLORS.ARPENT;
    CTX.globalAlpha = c.life;
    CTX.lineWidth = 2;
    CTX.beginPath();
    CTX.moveTo(c.x - 10, c.y);
    CTX.lineTo(c.x + 10, c.y);
    CTX.stroke();
    CTX.globalAlpha = 1;
}

function drawResonator(c) {
    CTX.strokeStyle = COLORS.RESONATOR;
    CTX.globalAlpha = c.life;
    CTX.lineWidth = 3;
    CTX.beginPath();
    CTX.arc(c.x, c.y, c.size, 0, Math.PI * 2);
    CTX.stroke();
    CTX.globalAlpha = 1;
}

function drawChorist(c) {
    CTX.fillStyle = COLORS.CHORIST;
    CTX.globalAlpha = c.life;
    CTX.fillRect(c.x - 1, c.y - 1, 2, 2);
    CTX.globalAlpha = 1;
}

function drawHUD() {
    // Score
    CTX.fillStyle = '#ffffff';
    CTX.font = '24px monospace';
    CTX.textAlign = 'left';
    CTX.fillText(`SCORE: ${String(gameState.score).padStart(6, '0')}`, 20, 40);
    
    // Combo
    CTX.fillText(`COMBO: ${gameState.combo}`, 20, 70);
    
    // Accuracy
    CTX.fillText(`ACC: ${gameState.accuracy.toFixed(1)}%`, 20, 100);
    
    // Game Over
    if (gameState.gameOver) {
        CTX.fillStyle = '#ff0000';
        CTX.font = '48px monospace';
        CTX.textAlign = 'center';
        CTX.fillText('GAME OVER', TARGET_WIDTH / 2, TARGET_HEIGHT / 2);
        CTX.font = '24px monospace';
        CTX.fillText('Press ENTER to restart', TARGET_WIDTH / 2, TARGET_HEIGHT / 2 + 50);
    }
}

// Game Loop
function gameLoop(timestamp) {
    updateBaton();
    updateBeat();
    updateSpeedrunTimer();
    updateCreatures();
    render();
    
    // Check game over condition
    if (gameState.hits.miss > 10) {
        gameState.gameOver = true;
        saveHighScore();
    }
    
    requestAnimationFrame(gameLoop);
}

// Reset Game
function resetGame() {
    gameState = {
        score: 0,
        combo: 0,
        highScore: gameState.highScore,
        accuracy: 100,
        hits: { perfect: 0, good: 0, miss: 0 },
        gameStarted: false,
        gameOver: false,
        startTime: 0,
        elapsedTime: 0,
        beat: 0,
        nextBeat: 0,
        lastBeatTime: 0
    };
    creatures = [];
    baton.trail = [];
    SPEEDRUN_TIMER.textContent = '00:00.00';
}

// Start the game
window.addEventListener('load', init);