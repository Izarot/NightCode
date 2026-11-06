const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let gameState = {
    score: 0,
    wave: 1,
    maxWaves: 5,
    player: null,
    bullets: [],
    enemies: [],
    particles: [],
    powerUps: [],
    shieldCooldown: 0,
    isPaused: false,
    gameOver: false,
    highScore: localStorage.getItem('shieldburst_highscore') || 0
};

// Input
const keys = {};
const mouse = { x: 0, y: 0, clicked: false };

// Audio Context
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Utility Functions
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function distance(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
function playSound(freq, type, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Player Class
class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.width = 32;
        this.height = 32;
        this.speed = 4;
        this.velX = 0;
        this.velY = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.shootCooldown = 0;
        this.shieldActive = false;
        this.shieldTimer = 0;
        this.shieldDuration = 3.0;
        this.shieldCooldownTime = 5.0;
        this.shieldRadius = 40;
        this.invincible = false;
    }
    update() {
        // Movement
        let accX = 0, accY = 0;
        if (keys['KeyW'] || keys['ArrowUp']) accY -= 0.25;
        if (keys['KeyS'] || keys['ArrowDown']) accY += 0.25;
        if (keys['KeyA'] || keys['ArrowLeft']) accX -= 0.25;
        if (keys['KeyD'] || keys['ArrowRight']) accX += 0.25;
        
        // Diagonal compensation
        if (accX !== 0 && accY !== 0) {
            accX *= Math.SQRT1_2;
            accY *= Math.SQRT1_2;
        }
        
        this.velX += accX;
        this.velY += accY;
        
        // Friction
        if (accX === 0) this.velX *= 0.85;
        if (accY === 0) this.velY *= 0.85;
        
        // Clamp velocity
        this.velX = clamp(this.velX, -this.speed, this.speed);
        this.velY = clamp(this.velY, -this.speed, this.speed);
        
        // Position
        this.x = clamp(this.x + this.velX, this.width/2, canvas.width - this.width/2);
        this.y = clamp(this.y + this.velY, this.height/2, canvas.height - this.height/2);
        
        // Shooting
        if (this.shootCooldown > 0) this.shootCooldown--;
        if ((mouse.clicked || keys['Space']) && this.shootCooldown === 0) {
            this.shoot();
            this.shootCooldown = 18; // 0.3s at 60fps
            mouse.clicked = false;
        }
        
        // Shield
        if ((keys['ShiftLeft'] || keys['ShiftRight'] || mouse.rightClick) && this.shieldCooldown <= 0) {
            this.activateShield();
        }
        if (this.shieldActive) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) {
                this.shieldActive = false;
                this.shieldCooldown = this.shieldCooldownTime * 60;
                playSound(220, 'sine', 0.3);
            }
        }
        if (this.shieldCooldown > 0) this.shieldCooldown--;
    }
    
    shoot() {
        const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        const bulletSpeed = 8;
        this.bullets.push(new Bullet(this.x, this.y, Math.cos(angle) * bulletSpeed, Math.sin(angle) * bulletSpeed));
        playSound(800, 'square', 0.1);
    }
    
    activateShield() {
        this.shieldActive = true;
        this.shieldTimer = this.shieldDuration * 60;
        playSound(660, 'sine', 0.2);
    }
    
    draw() {
        // Shield
        if (this.shieldActive) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.shieldRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.fill();
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Player
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    }
}

// Bullet Class
class Bullet {
    constructor(x, y, velX, velY) {
        this.x = x;
        this.y = y;
        this.velX = velX;
        this.velY = velY;
        this.radius = 4;
        this.life = 200;
    }
    
    update() {
        this.x += this.velX;
        this.y += this.velY;
        this.life--;
    }
    
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffff00';
        ctx.fill();
    }
}

// Enemy Class
class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 32;
        this.height = 32;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 2;
        this.velX = 0;
        this.velY = 0;
        this.lastShot = 0;
        this.shootRate = 30; // frames
        this.targetX = x;
        this.targetY = y;
        
        // Type-specific stats
        switch(type) {
            case 'rammer':
                this.health = 150;
                this.speed = 2;
                break;
            case 'shooter':
                this.health = 80;
                this.speed = 3;
                this.shootRate = 30;
                break;
            case 'flanker':
                this.health = 70;
                this.speed = 5;
                break;
            case 'cruiser':
                this.health = 500;
                this.speed = 1.5;
                break;
        }
    }
    
    update() {
        // Simple AI: move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
            this.velX = (dx / dist) * this.speed;
            this.velY = (dy / dist) * this.speed;
        }
        
        this.x += this.velX;
        this.y += this.velY;
        
        // Shooting for shooter type
        if (this.type === 'shooter' && this.lastShot >= this.shootRate) {
            const angle = Math.atan2(dy, dx);
            const bulletSpeed = 6;
            gameState.bullets.push(new Bullet(this.x, this.y, Math.cos(angle) * bulletSpeed, Math.sin(angle) * bulletSpeed));
            this.lastShot = 0;
        }
        this.lastShot++;
    }
    
    draw() {
        let color = '#ff4444';
        switch(this.type) {
            case 'rammer': color = '#ff8800'; break;
            case 'shooter': color = '#ff4444'; break;
            case 'flanker': color = '#aa44ff'; break;
            case 'cruiser': color = '#ff0088'; break;
        }
        ctx.fillStyle = color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Health bar
        const hpPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - 16, this.y - 20, 32, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - 16, this.y - 20, 32 * hpPercent, 4);
    }
}

// Game Functions
function spawnEnemy() {
    const types = ['rammer', 'shooter', 'flanker'];
    if (gameState.wave >= 3) types.push('cruiser');
    const type = types[Math.floor(Math.random() * types.length)];
    const x = Math.random() * (canvas.width - 40) + 20;
    const y = Math.random() * (canvas.height - 40) + 20;
    gameState.enemies.push(new Enemy(x, y, type));
}

function updateGame() {
    if (gameState.isPaused || gameState.gameOver) return;
    
    // Update player
    player.update();
    
    // Update bullets
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        gameState.bullets[i].update();
        if (gameState.bullets[i].life <= 0 || 
            gameState.bullets[i].x < 0 || gameState.bullets[i].x > canvas.width ||
            gameState.bullets[i].y < 0 || gameState.bullets[i].y > canvas.height) {
            gameState.bullets.splice(i, 1);
        }
    }
    
    // Update enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        gameState.enemies[i].update();
        
        // Collision with player
        if (distance(gameState.enemies[i].x, gameState.enemies[i].y, player.x, player.y) < 32) {
            if (!player.shieldActive) {
                player.health -= 10;
                if (player.health <= 0) {
                    gameOver();
                }
            }
            gameState.enemies.splice(i, 1);
            continue;
        }
        
        // Collision with bullets
        for (let j = gameState.bullets.length - 1; j >= 0; j--) {
            if (distance(gameState.enemies[i].x, gameState.enemies[i].y, gameState.bullets[j].x, gameState.bullets[j].y) < 20) {
                gameState.enemies[i].health -= 10;
                gameState.bullets.splice(j, 1);
                if (gameState.enemies[i].health <= 0) {
                    gameState.score += 100;
                    gameState.enemies.splice(i, 1);
                    playSound(440, 'sine', 0.1);
                    break;
                }
            }
        }
    }
    
    // Spawn enemies
    if (Math.random() < 0.02) {
        spawnEnemy();
    }
    
    // Wave progression
    if (gameState.score > gameState.wave * 1000) {
        gameState.wave++;
        if (gameState.wave > gameState.maxWaves) {
            victory();
        }
    }
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw game objects
    player.draw();
    
    gameState.bullets.forEach(bullet => bullet.draw());
    gameState.enemies.forEach(enemy => enemy.draw());
    
    // Draw HUD
    drawHUD();
}

function drawHUD() {
    // Health bar
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(10, 10, 200, 20);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(10, 10, 200 * (player.health / player.maxHealth), 20);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(10, 10, 200, 20);
    
    // Shield indicator
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.shieldRadius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = player.shieldActive ? '#00ffff' : '#555555';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Cooldown bar
    if (player.shieldCooldown > 0) {
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(canvas.width - 210, canvas.height - 30, 200 * (player.shieldCooldown / (player.shieldCooldownTime * 60)), 20);
    } else {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(canvas.width - 210, canvas.height - 30, 200, 20);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(canvas.width - 210, canvas.height - 30, 200, 20);
    
    // Score and wave
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Roboto';
    ctx.fillText(`Score: ${gameState.score}`, canvas.width / 2, 40);
    ctx.fillText(`Wave: ${gameState.wave}/${gameState.maxWaves}`, canvas.width / 2, 70);
    
    // High score
    ctx.fillStyle = '#ffff00';
    ctx.fillText(`High Score: ${gameState.highScore}`, 10, 50);
}

function gameOver() {
    gameState.gameOver = true;
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        localStorage.setItem('shieldburst_highscore', gameState.highScore);
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff0000';
    ctx.font = '48px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Roboto';
    ctx.fillText(`Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText(`High Score: ${gameState.highScore}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('Press R to Restart', canvas.width / 2, canvas.height / 2 + 80);
}

function victory() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff00';
    ctx.font = '48px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Roboto';
    ctx.fillText(`Final Score: ${gameState.score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText('Press R to Play Again', canvas.width / 2, canvas.height / 2 + 80);
}

function resetGame() {
    gameState.score = 0;
    gameState.wave = 1;
    gameState.bullets = [];
    gameState.enemies = [];
    gameState.gameOver = false;
    player = new Player();
}

// Event Listeners
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'KeyR' && gameState.gameOver) {
        resetGame();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouse.clicked = true;
    if (e.button === 2) mouse.rightClick = true;
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.clicked = false;
    if (e.button === 2) mouse.rightClick = false;
});

// Prevent right-click context menu
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Game Loop
let player = new Player();
function gameLoop() {
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();

// Make canvas responsive
function resizeCanvas() {
    const container = document.body;
    const maxWidth = Math.min(960, container.clientWidth - 40);
    const maxHeight = Math.min(960, container.clientHeight - 40);
    const size = Math.min(maxWidth, maxHeight);
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();