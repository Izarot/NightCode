// Deflect Blade - Main Entry Point
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width, height, dpr;

function resize() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
}

window.addEventListener('resize', resize);
resize();

// Game state
const GAME_STATES = { MENU: 0, PLAYING: 1, PAUSED: 2, GAMEOVER: 3 };
let gameState = GAME_STATES.PLAYING;
let lastTime = 0;
let deltaTime = 0;

// Audio context for sound effects
let audioCtx;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Sound effects
const soundManager = {
    swingBuffer: null,
    deflectionBuffer: null,
    backgroundMusic: null,
    load: async function() {
        const swingOsc = audioCtx.createOscillator();
        const swingGain = audioCtx.createGain();
        swingOsc.type = 'square';
        swingOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
        swingGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        swingGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        swingOsc.connect(swingGain).connect(audioCtx.destination);
        swingOsc.start();
        swingOsc.stop(audioCtx.currentTime + 0.1);
        
        const deflectOsc = audioCtx.createOscillator();
        const deflectGain = audioCtx.createGain();
        deflectOsc.type = 'sawtooth';
        deflectOsc.frequency.setValueAtTime(400, audioCtx.currentTime);
        deflectGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        deflectGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        deflectOsc.connect(deflectGain).connect(audioCtx.destination);
        deflectOsc.start();
        deflectOsc.stop(audioCtx.currentTime + 0.1);
    },
    playSwing: function() {
        if (audioCtx && audioCtx.state === 'running') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        }
    },
    playDeflection: function() {
        if (audioCtx && audioCtx.state === 'running') {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        }
    },
    playBackgroundMusic: function() {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }
};

// Game objects
class Player {
    constructor() {
        this.x = width / 2;
        this.y = height - 100;
        this.vx = 0;
        this.vy = 0;
        this.width = 48;
        this.height = 48;
        this.health = 100;
        this.maxHealth = 100;
        this.state = 'IDLE';
        this.swingTimer = 0;
        this.cooldown = 0;
        this.facing = 1;
        this.onGround = true;
    }
    
    update(dt) {
        if (gameState !== GAME_STATES.PLAYING) return;
        
        // Movement input
        if (input.left) {
            this.vx -= 0.3 * dt;
            this.facing = -1;
        }
        if (input.right) {
            this.vx += 0.3 * dt;
            this.facing = 1;
        }
        
        // Apply friction
        this.vx *= 0.985;
        
        // Clamp velocity
        if (this.vx > 5) this.vx = 5;
        if (this.vx < -5) this.vx = -5;
        
        // Jump
        if (input.jump && this.onGround) {
            this.vy = -8;
            this.onGround = false;
        }
        
        // Gravity
        this.vy += 0.5;
        if (this.vy > 10) this.vy = 10;
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Bounds
        if (this.x < 0) this.x = 0;
        if (this.x > width - this.width) this.x = width - this.width;
        if (this.y > height - this.height) {
            this.y = height - this.height;
            this.vy = 0;
            this.onGround = true;
        }
        
        // Cooldown
        if (this.cooldown > 0) this.cooldown -= dt;
        
        // Sword swing
        if (this.swingTimer > 0) this.swingTimer -= dt;
    }
    
    swing() {
        if (this.cooldown > 0 || this.swingTimer > 0) return;
        this.state = 'SWING';
        this.swingTimer = 30;
        this.cooldown = 90; // 1.5 seconds at 60fps
        soundManager.playSwing();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }
    
    heal(amount) {
        this.health += amount;
        if (this.health > this.maxHealth) this.health = this.maxHealth;
    }
    
    render() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Player body
        ctx.fillStyle = '#00FFC5';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Sword swing indicator
        if (this.swingTimer > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, 64, -Math.PI/4, Math.PI/4);
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.lineWidth = 8;
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// Bullet class
class Bullet {
    constructor(x, y, vx, vy, speed) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.speed = speed;
        this.radius = 4;
        this.lifetime = 200;
        this.deflected = false;
    }
    
    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
    }
    
    isAlive() {
        return this.lifetime > 0 && 
               this.x > -50 && this.x < width + 50 && 
               this.y > -50 && this.y < height + 50;
    }
    
    render() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.deflected ? '#FFD700' : '#FF3B30';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius);
        ctx.fill();
        ctx.restore();
    }
}

// Enemy class
class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.type = type;
        this.health = type === 'boss' ? 50 : 3;
        this.vx = 0;
        this.vy = 0;
        this.color = type === 'boss' ? '#FF3B30' : '#FF4500';
    }
    
    update(dt) {
        // Simple AI - move toward player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 0) {
            this.vx = (dx / dist) * 2;
            this.vy = (dy / dist) * 2;
        }
        this.x += this.vx;
        this.y += this.vy;
    }
    
    takeDamage(amount) {
        this.health -= amount;
    }
    
    isDead() {
        return this.health <= 0;
    }
    
    render() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
    }
}

// Power-up class
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 8;
    }
    
    render() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.type === 'shield' ? '#00FFC5' : 
                        this.type === 'rapid' ? '#FF3B30' : 
                        this.type === 'magnet' ? '#FFD700' : '#FF1493';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.type[0].toUpperCase(), 0, 5);
        ctx.restore();
    }
}

// Particle class
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 30;
        this.color = color;
        this.radius = 2;
    }
    
    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    isDead() {
        return this.life <= 0;
    }
    
    render() {
        ctx.save();
        ctx.globalAlpha = this.life / 30;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius);
        ctx.fill();
        ctx.restore();
    }
}

// Input handling
const input = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    touchStart: false
};

window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = true;
    if (e.code === 'Space' || e.code === 'KeyW') input.jump = true;
    if (e.code === 'ShiftLeft' || e.code === 'KeyE') input.attack = true;
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
    if (e.code === 'Space' || e.code === 'KeyW') input.jump = false;
    if (e.code === 'ShiftLeft' || e.code === 'KeyE') input.attack = false;
});

// Touch controls
const touchControls = document.getElementById('touchControls');
const joystick = document.getElementById('joystick');
const attackBtn = document.getElementById('attackBtn');

if (width < 768) {
    touchControls.style.display = 'block';
}

let touchDown = false;
let touchStartX = 0;

attackBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    input.attack = true;
});

attackBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    input.attack = false;
});

attackBtn.addEventListener('mouseenter', () => {
    if (touchDown) input.attack = true;
});

attackBtn.addEventListener('mouseleave', () => {
    input.attack = false;
});

attackBtn.addEventListener('mousedown', () => {
    input.attack = true;
});

attackBtn.addEventListener('mouseup', () => {
    input.attack = false;
});

joystick.addEventListener('touchstart', (e) => {
    touchDown = true;
    touchStartX = e.touches[0].clientX;
});

joystick.addEventListener('touchmove', (e) => {
    if (!touchDown) return;
    const deltaX = e.touches[0].clientX - touchStartX;
    input.left = deltaX < -20;
    input.right = deltaX > 20;
});

joystick.addEventListener('touchend', () => {
    touchDown = false;
    input.left = false;
    input.right = false;
});

// Game initialization
const player = new Player();
const bullets = [];
const enemies = [];
const particles = [];
const powerUps = [];

let score = 0;
let combo = 0;
let gameTime = 0;
let highScore = localStorage.getItem('deflectBladeHighScore') || 0;

// Speedrun timer
let timerStart = 0;
let elapsedTime = 0;

// Enemy spawning
let spawnTimer = 0;
let level = 1;

function spawnEnemy() {
    const x = Math.random() * (width - 100) + 50;
    const y = -50;
    const type = level > 3 ? (Math.random() > 0.7 ? 'boss' : 'basic') : 'basic';
    enemies.push(new Enemy(x, y, type));
}

function spawnBullet(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 4;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    bullets.push(new Bullet(x, y, vx, vy, speed));
}

function spawnPowerUp(x, y) {
    const types = ['shield', 'rapid', 'magnet', 'double'];
    const type = types[Math.floor(Math.random() * types.length)];
    powerUps.push(new PowerUp(x, y, type));
}

// Collision detection
function checkCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    return dist < (a.radius + b.radius);
}

function checkPlayerBulletCollision() {
    const swingRadius = player.swingTimer > 0 ? 64 : 0;
    if (swingRadius === 0) return;
    
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const dx = bullet.x - (player.x + player.width/2);
        const dy = bullet.y - (player.y + player.height/2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < swingRadius) {
            // Deflect bullet
            bullet.deflected = true;
            const angle = Math.atan2(dy, dx);
            const speed = bullet.speed * 1.2;
            bullet.vx = Math.cos(angle) * speed;
            bullet.vy = Math.sin(angle) * speed;
            bullet.lifetime = 200;
            
            // Create particle
            particles.push(new Particle(bullet.x, bullet.y, '#FFD700'));
            
            // Score bonus
            score += 10;
            combo++;
            if (combo % 5 === 0) score += 10;
            
            soundManager.playDeflection();
        }
    }
}

// Main game loop
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    deltaTime = (timestamp - lastTime) / 16.667;
    lastTime = timestamp;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Update game time
    if (gameState === GAME_STATES.PLAYING) {
        gameTime += deltaTime;
        elapsedTime = (timestamp - timerStart) / 1000;
    }
    
    // Update player
    player.update(deltaTime);
    
    // Handle input
    if (input.attack && gameState === GAME_STATES.PLAYING) {
        player.swing();
    }
    input.attack = false;
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update(deltaTime);
        if (!bullets[i].isAlive()) {
            bullets.splice(i, 1);
        }
    }
    
    // Check player-bullet collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        const dx = bullet.x - (player.x + player.width/2);
        const dy = bullet.y - (player.y + player.height/2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < bullet.radius + 4) {
            if (!bullet.deflected) {
                player.takeDamage(10);
                particles.push(new Particle(bullet.x, bullet.y, '#FF3B30'));
            }
            bullets.splice(i, 1);
        }
    }
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update(deltaTime);
        
        // Check enemy-player collision
        const edx = enemies[i].x - (player.x + player.width/2);
        const edy = enemies[i].y - (player.y + player.height/2);
        const edist = Math.sqrt(edx*edx + edy*edy);
        if (edist < 20) {
            player.takeDamage(5);
        }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(deltaTime);
        if (particles[i].isDead()) particles.splice(i, 1);
    }
    
    // Update power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const pu = powerUps[i];
        const pdx = pu.x - (player.x + player.width/2);
        const pdy = pu.y - (player.y + player.height/2);
        const pdist = Math.sqrt(pdx*pdx + pdy*pdy);
        
        if (pdist < pu.radius + 8) {
            if (pu.type === 'shield') {
                player.heal(30);
            }
            powerUps.splice(i, 1);
        }
    }
    
    // Spawn enemies and bullets
    spawnTimer += deltaTime;
    if (spawnTimer > 60) {
        spawnTimer = 0;
        if (Math.random() < 0.3) spawnBullet(width/2, -50);
        if (Math.random() < 0.1) spawnPowerUp(Math.random() * width, -50);
        if (Math.random() < 0.05) spawnEnemy();
    }
    
    // Check game over
    if (player.health <= 0) {
        gameState = GAME_STATES.GAMEOVER;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('deflectBladeHighScore', highScore);
        }
    }
    
    // Render
    player.render();
    bullets.forEach(b => b.render());
    enemies.forEach(e => e.render());
    particles.forEach(p => p.render());
    powerUps.forEach(p => p.render());
    
    // Update HUD
    document.getElementById('health').textContent = player.health;
    document.getElementById('score').textContent = score;
    document.getElementById('timer').textContent = elapsedTime.toFixed(2);
    document.getElementById('highScoreDisplay').textContent = highScore;
    document.getElementById('finalScore').textContent = score;
    
    // Handle overlay
    const overlay = document.getElementById('overlay');
    if (gameState === GAME_STATES.GAMEOVER) {
        overlay.style.display = 'flex';
        overlayTitle.textContent = 'GAME OVER';
    }
    
    requestAnimationFrame(gameLoop);
}

// Initialize
const overlayTitle = document.getElementById('overlayTitle');
document.getElementById('restartBtn').addEventListener('click', () => {
    score = 0;
    combo = 0;
    gameTime = 0;
    elapsedTime = 0;
    player.health = 100;
    player.x = width / 2;
    player.y = height - 100;
    bullets.length = 0;
    enemies.length = 0;
    particles.length = 0;
    powerUps.length = 0;
    timerStart = performance.now();
    gameState = GAME_STATES.PLAYING;
    overlay.style.display = 'none';
    initAudio();
});

document.getElementById('settingsBtn').addEventListener('click', () => {
    alert('Settings not implemented in this version');
});

document.getElementById('quitBtn').addEventListener('click', () => {
    if (confirm('Quit game?')) {
        score = 0;
        combo = 0;
        gameTime = 0;
        elapsedTime = 0;
        player.health = 100;
        player.x = width / 2;
        player.y = height - 100;
        bullets.length = 0;
        enemies.length = 0;
        particles.length = 0;
        powerUps.length = 0;
        gameState = GAME_STATES.MENU;
        overlay.style.display = 'none';
    }
});

// Start game
initAudio();
timerStart = performance.now();
requestAnimationFrame(gameLoop);