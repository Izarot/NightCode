// Sneaky Feature 1: Responsive Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Sneaky Feature 3: Vibrant Color Palette
const COLORS = {
    PLAYER: '#ff00ff', // Magenta
    PLAYER_TRAIL: '#ff00ff80',
    MONSTER_BASE: '#00ffff', // Cyan
    MONSTER_EVOLVED: '#ff00ff', // Magenta
    BACKGROUND: '#0a0a0a',
    WALL: '#1a1a1a',
    GOAL: '#ffff00', // Yellow
    PARTICLE: ['#ff00ff', '#00ffff', '#ffff00', '#ff0000']
};

// Sneaky Feature 4: High Score Persistence
let highScore = loadHighScore();

function loadHighScore() {
    const saved = localStorage.getItem('evolveConquerHighScore');
    return saved ? parseFloat(saved) : 0;
}

function saveHighScore(time) {
    if (time < highScore || highScore === 0) {
        highScore = time;
        localStorage.setItem('evolveConquerHighScore', highScore.toString());
        document.getElementById('highScore').textContent = `Best: ${formatTime(highScore)}`;
    }
}

// Sneaky Feature 5: Simple Sound Effects (Web Audio API)
class SoundManager {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
    }

    playBeep(frequency = 440, duration = 0.1) {
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.start();
        oscillator.stop(this.context.currentTime + duration);
    }

    playEvolution() {
        // Play a rising chord for evolution
        const now = this.context.currentTime;
        const frequencies = [220, 277, 330];
        frequencies.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.01 + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.1);
            osc.connect(gain);
            gain.connect(this.context.destination);
            osc.start();
            osc.stop(now + 0.5 + i * 0.1);
        });
    }
}

const sound = new SoundManager();

// Game State
const GAME_STATE = {
    PLAYING: 'playing',
    EVOLVING: 'evolving',
    VICTORY: 'victory'
};

let gameState = GAME_STATE.PLAYING;
let startTime = null;
let elapsedTime = 0;
let evolutionStage = 0;
const maxEvolutionStages = 3;

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    size: 20,
    speed: 5,
    vx: 0,
    vy: 0,
    trail: []
};

// Goal
const goal = {
    x: Math.random() * (canvas.width - 100) + 50,
    y: Math.random() * (canvas.height - 100) + 50,
    size: 30
};

// Input
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

window.addEventListener('keydown', (e) => {
    if (keys[e.key] !== undefined) {
        keys[e.key] = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys[e.key] !== undefined) {
        keys[e.key] = false;
        e.preventDefault();
    }
});

// Update Game
function update(deltaTime) {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    // Movement
    player.vx = 0;
    player.vy = 0;
    
    if (keys.ArrowUp) player.vy = -player.speed;
    if (keys.ArrowDown) player.vy = player.speed;
    if (keys.ArrowLeft) player.vx = -player.speed;
    if (keys.ArrowRight) player.vx = player.speed;
    
    // Diagonal speed correction
    if (player.vx !== 0 && player.vy !== 0) {
        const diagFactor = Math.sqrt(2) / 2;
        player.vx *= diagFactor;
        player.vy *= diagFactor;
    }
    
    player.x += player.vx * deltaTime;
    player.y += player.vy * deltaTime;
    
    // Boundary
    player.x = Math.max(player.size/2, Math.min(canvas.width - player.size/2, player.x));
    player.y = Math.max(player.size/2, Math.min(canvas.height - player.size/2, player.y));
    
    // Trail
    player.trail.push({x: player.x, y: player.y, size: player.size});
    if (player.trail.length > 10) player.trail.shift();
    
    // Goal collision
    const dx = player.x - goal.x;
    const dy = player.y - goal.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    if (distance < player.size/2 + goal.size/2) {
        // Collect goal - trigger evolution
        evolutionStage++;
        sound.playEvolution();
        
        if (evolutionStage >= maxEvolutionStages) {
            gameState = GAME_STATE.VICTORY;
            elapsedTime = Date.now() - startTime;
            saveHighScore(elapsedTime / 1000);
        } else {
            gameState = GAME_STATE.EVOLVING;
            setTimeout(() => {
                gameState = GAME_STATE.PLAYING;
                // Move goal to new random position
                goal.x = Math.random() * (canvas.width - 100) + 50;
                goal.y = Math.random() * (canvas.height - 100) + 50;
            }, 500);
        }
    }
}

// Render
function render() {
    // Clear
    ctx.fillStyle = COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Player trail
    player.trail.forEach((point, index) => {
        const alpha = (index + 1) / player.trail.length;
        ctx.fillStyle = COLORS.PLAYER_TRAIL.replace('0.8', `${0.8 * alpha}`);
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size * (index / player.trail.length), 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Player
    ctx.fillStyle = COLORS.PLAYER;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Goal
    ctx.fillStyle = COLORS.GOAL;
    ctx.beginPath();
    ctx.arc(goal.x, goal.y, goal.size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Evolution visual effect
    if (gameState === GAME_STATE.EVOLVING) {
        ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Victory screen
    if (gameState === GAME_STATE.VICTORY) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = COLORS.PLAYER;
        ctx.font = '30px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText('VICTORY!', canvas.width/2, canvas.height/2 - 20);
        ctx.font = '20px "Press Start 2P"';
        ctx.fillText(`Time: ${formatTime(elapsedTime/1000)}`, canvas.width/2, canvas.height/2 + 20);
        ctx.fillText('Press R to Restart', canvas.width/2, canvas.height/2 + 60);
    }
}

// Timer
function updateTimer() {
    if (gameState === GAME_STATE.PLAYING && startTime) {
        elapsedTime = Date.now() - startTime;
        document.getElementById('timer').textContent = formatTime(elapsedTime / 1000);
    }
    
    // Update evolution tracker
    document.getElementById('evolutionStage').textContent = `${evolutionStage}/${maxEvolutionStages}`;
    const progress = (evolutionStage / maxEvolutionStages) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 100) % 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

// Game Loop
let lastTimestamp = 0;
function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTimestamp) / 1000; // seconds
    lastTimestamp = timestamp;
    
    update(deltaTime);
    render();
    updateTimer();
    
    requestAnimationFrame(gameLoop);
}

// Initialize
function init() {
    startTime = Date.now();
    elapsedTime = 0;
    evolutionStage = 0;
    gameState = GAME_STATE.PLAYING;
    
    // Reset player position
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.trail = [];
    
    // Random goal
    goal.x = Math.random() * (canvas.width - 100) + 50;
    goal.y = Math.random() * (canvas.height - 100) + 50;
    
    // Update high score display
    document.getElementById('highScore').textContent = `Best: ${formatTime(highScore)}`;
    
    requestAnimationFrame(gameLoop);
}

// Restart on R key
window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        if (gameState === GAME_STATE.VICTORY) {
            init();
        }
    }
});

// Start game
init();

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause game when tab is hidden
        lastTimestamp = 0;
    } else {
        lastTimestamp = performance.now();
        requestAnimationFrame(gameLoop);
    }
});
}