const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Game State
let game = {
    score: 0,
    highScore: localStorage.getItem('typingRunnerHighScore') || 0,
    player: { x: 100, y: 500, vx: 0, vy: 0, speed: 120, dashing: false, dashTimer: 0, cooldown: 0 },
    words: ['run', 'jump', 'dash', 'type', 'fast', 'code', 'game', 'win'],
    currentWord: '',
    currentInput: '',
    obstacles: [],
    coins: [],
    particles: [],
    time: 0,
    camera: 0
};

// Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

// Initialize Game
function init() {
    game.currentWord = game.words[Math.floor(Math.random() * game.words.length)];
    generateEnvironment();
    gameLoop();
}

// Generate Environment
function generateEnvironment() {
    for (let i = 0; i < 20; i++) {
        game.obstacles.push({
            x: 800 + i * 400 + Math.random() * 200,
            y: 550,
            width: 40,
            height: 100,
            type: Math.floor(Math.random() * 3)
        });
        if (Math.random() > 0.7) {
            game.coins.push({
                x: 800 + i * 400 + Math.random() * 200,
                y: 400,
                collected: false,
                rotation: 0
            });
        }
    }
}

// Update Game State
function update() {
    game.time += 0.016;
    
    // Player Physics
    if (game.player.dashing) {
        game.player.vx = 480;
        game.player.dashTimer -= 0.016;
        if (game.player.dashTimer <= 0) {
            game.player.dashing = false;
            game.player.vx = 120;
        }
    } else {
        game.player.vx = 120;
    }
    
    if (game.player.cooldown > 0) {
        game.player.cooldown -= 0.016;
    }
    
    // Update Player Position
    game.player.x += game.player.vx * 0.016;
    
    // Update Camera
    game.camera = game.player.x - 300;
    
    // Update Particles
    game.particles = game.particles.filter(p => {
        p.x += p.vx * 0.016;
        p.y += p.vy * 0.016;
        p.vy += 200 * 0.016;
        p.life -= 0.016;
        return p.life > 0;
    });
    
    // Update Coins
    game.coins.forEach(coin => {
        coin.rotation += 0.1;
        if (!coin.collected && Math.abs(coin.x - game.player.x) < 100 && Math.abs(coin.y - game.player.y) < 100) {
            coin.collected = true;
            game.score += 50;
            createParticles(coin.x, coin.y, '#FFD700', 6);
            playSound(880, 0.2);
        }
    });
    
    // Check Obstacles
    game.obstacles.forEach(obstacle => {
        if (game.player.x > obstacle.x && game.player.x < obstacle.x + obstacle.width &&
            game.player.y + 40 > obstacle.y && game.player.y < obstacle.y + obstacle.height) {
            game.player.dashing = false;
            game.player.vx = 120;
            createParticles(game.player.x, game.player.y, '#FF6B35', 8);
            playSound(200, 0.3, 'sawtooth');
        }
    });
}

// Create Particles
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        game.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            life: 0.5,
            color: color,
            size: Math.random() * 4 + 2
        });
    }
}

// Render Game
function render() {
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Sky Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F7FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Ground
    ctx.fillStyle = '#2E8B57';
    ctx.fillRect(0, 600, canvas.width, 120);
    
    // Draw Player
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(game.player.x - game.camera - 16, game.player.y - 24, 32, 48);
    
    // Draw Obstacles
    game.obstacles.forEach(obstacle => {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(obstacle.x - game.camera, obstacle.y, obstacle.width, obstacle.height);
    });
    
    // Draw Coins
    game.coins.forEach(coin => {
        if (!coin.collected) {
            ctx.save();
            ctx.translate(coin.x - game.camera, coin.y);
            ctx.rotate(coin.rotation);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-10, -10, 20, 20);
            ctx.restore();
        }
    });
    
    // Draw Particles
    game.particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - game.camera, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
    
    // Draw Current Word
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(game.currentInput + '|', canvas.width / 2, canvas.height - 50);
    ctx.fillText(game.currentWord, canvas.width / 2, canvas.height - 80);
    
    // Draw Score
    scoreElement.textContent = `Score: ${game.score} | High: ${game.highScore}`;
}

// Game Loop
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// Input Handling
window.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
        game.currentInput = game.currentInput.slice(0, -1);
        return;
    }
    
    if (e.key.length === 1 && game.currentWord.startsWith(e.key)) {
        game.currentInput += e.key;
        
        if (game.currentInput === game.currentWord) {
            // Word completed!
            game.score += game.currentWord.length * 10;
            game.player.dashing = true;
            game.player.dashTimer = 1.2;
            game.player.cooldown = 0.3;
            
            createParticles(game.player.x, game.player.y, '#4A90E2', 12);
            playSound(660, 0.3);
            
            // Next word
            game.currentWord = game.words[Math.floor(Math.random() * game.words.length)];
            game.currentInput = '';
        }
    }
});

// Start Game
init();