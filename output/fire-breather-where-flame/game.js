const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

// --- Config & Palette ---
const PALETTE = {
    bg: '#1a1a2e',
    player: '#00fff5',
    playerAlt: '#ff4500',
    fire: '#ff4500',
    fireGlow: '#ffaa00',
    enemy: '#ff00ff',
    platform: '#e94560',
    fuel: '#ffff00',
    ui: '#00fff5',
    danger: '#ff0000'
};

const GAME_WIDTH = 1200;
const GAME_HEIGHT = 480;
const GRAVITY = 0.6;
const FRICTION = 0.92;
const MAX_SPEED = 5;
const JUMP_FORCE = -7;
const DASH_SPEED = 15;
const DASH_COOLDOWN = 120; // frames
const FUEL_MAX = 100;
const HEALTH_MAX = 100;

// --- Audio System (Web Audio API) ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'jump') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'shoot') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'pickup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    }
}

// --- Input ---
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

let mouseX = 0, mouseY = 0;
window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
});

let touchActive = false;
let touchX = 0, touchY = 0;
window.addEventListener('touchstart', e => {
    touchActive = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    touchX = (e.touches[0].clientX - rect.left) * scaleX;
    touchY = (e.touches[0].clientY - rect.top) * scaleY;
}, {passive: false});
window.addEventListener('touchmove', e => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const scaleY = GAME_HEIGHT / rect.height;
    touchX = (e.touches[0].clientX - rect.left) * scaleX;
    touchY = (e.touches[0].clientY - rect.top) * scaleY;
}, {passive: false});
window.addEventListener('touchend', () => touchActive = false);

// --- Resize ---
function resize() {
    const container = document.getElementById('game-container');
    const aspect = GAME_WIDTH / GAME_HEIGHT;
    let w = container.clientWidth || window.innerWidth;
    let h = container.clientHeight || window.innerHeight;
    if (w / h > aspect) {
        w = h * aspect;
    } else {
        h = w / aspect;
    }
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
}
window.addEventListener('resize', resize);
resize();

// --- Entities ---
class Player {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = 100;
        this.y = 300;
        this.w = 24;
        this.h = 28;
        this.vx = 0;
        this.vy = 0;
        this.fuel = FUEL_MAX;
        this.health = HEALTH_MAX;
        this.dir = 1;
        this.grounded = false;
        this.dashCooldown = 0;
        this.dashing = 0;
        this.breathing = false;
        this.breathCooldown = 0;
        this.invuln = 0;
    }
    update() {
        // Dash
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.dashing > 0) {
            this.dashing--;
            this.vx = this.dir * DASH_SPEED;
        }

        // Movement
        const accel = 0.6;
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.vx -= accel;
            this.dir = -1;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            this.vx += accel;
            this.dir = 1;
        }
        if ((keys['ArrowUp'] || keys['KeyW'] || keys['Space']) && this.grounded && this.dashing <= 0) {
            this.vy = JUMP_FORCE;
            this.grounded = false;
            playSound('jump');
        }

        // Dash input (double tap simplified: Shift or Space while moving)
        if (keys['ShiftLeft'] || keys['ShiftRight']) {
            if (this.dashCooldown === 0 && Math.abs(this.vx) > 0) {
                this.dashing = 10;
                this.dashCooldown = DASH_COOLDOWN;
                playSound('shoot');
            }
        }

        // Breath
        const breathingInput = keys['Space'] || touchActive;
        if (breathingInput && this.breathCooldown <= 0 && this.fuel > 0) {
            this.breathing = true;
            this.fuel -= 0.5;
            if (this.fuel < 0) this.fuel = 0;
        } else {
            this.breathing = false;
        }
        if (this.breathCooldown > 0) this.breathCooldown--;

        // Physics
        this.vy += GRAVITY;
        this.vx *= FRICTION;
        this.x += this.vx;
        this.y += this.vy;

        // Ground check (simple)
        if (this.y > GAME_HEIGHT - 100 - this.h) {
            this.y = GAME_HEIGHT - 100 - this.h;
            this.vy = 0;
            this.grounded = true;
        } else {
            this.grounded = false;
        }

        // Bounds
        if (this.x < 0) this.x = 0;
        if (this.x > GAME_WIDTH - this.w) this.x = GAME_WIDTH - this.w;

        // Regen
        if (this.health < HEALTH_MAX) this.health += 0.05;
        if (this.fuel < FUEL_MAX && !this.breathing) this.fuel += 0.1;

        if (this.invuln > 0) this.invuln--;
    }
    draw() {
        if (this.invuln % 4 < 2) return; // flicker
        ctx.fillStyle = this.breathing ? PALETTE.playerAlt : PALETTE.player;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + (this.dir === 1 ? 16 : 4), this.y + 6, 4, 4);

        // Breath visual
        if (this.breathing && this.fuel > 0) {
            const targetX = touchActive ? touchX : mouseX;
            const targetY = touchActive ? touchY : mouseY;
            const angle = Math.atan2(targetY - (this.y + this.h/2), targetX - (this.x + this.w/2));
            const length = 30 * (this.fuel / FUEL_MAX);
            const endX = this.x + this.w/2 + Math.cos(angle) * length;
            const endY = this.y + this.h/2 + Math.sin(angle) * length;

            ctx.beginPath();
            ctx.moveTo(this.x + this.w/2, this.y + this.h/2);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = PALETTE.fire;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fillStyle = PALETTE.fireGlow;
            ctx.beginPath();
            ctx.arc(endX, endY, 4, 0, Math.PI*2);
            ctx.fill();
        }
    }
    getRect() {
        return {x: this.x, y: this.y, w: this.w, h: this.h};
    }
}

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'imp', 'rider', 'golem', 'phoenix'
        this.w = 32;
        this.h = 32;
        this.vx = 2;
        this.vy = 0;
        this.hp = type === 'golem' ? 60 : type === 'rider' ? 80 : 30;
        this.maxHp = this.hp;
        this.timer = 0;
        this.dir = 1;
        this.startX = x;
    }
    update() {
        this.timer++;
        if (this.type === 'imp') {
            this.x += this.vx * this.dir;
            if (Math.abs(this.x - this.startX) > 150) this.dir *= -1;
            if (this.timer % 120 === 0) projectiles.push(new Projectile(this.x, this.y, player.x, player.y, 'enemy'));
        } else if (this.type === 'rider') {
            this.x += Math.sin(this.timer * 0.05) * 2;
            this.y += Math.cos(this.timer * 0.05) * 1;
            if (this.timer % 100 === 0) projectiles.push(new Projectile(this.x, this.y, player.x, player.y, 'enemy'));
        } else if (this.type === 'phoenix') {
            this.x += this.vx * this.dir;
            this.y += Math.sin(this.timer * 0.05) * 2;
            if (this.x < 0 || this.x > GAME_WIDTH) this.dir *= -1;
        }
        // Golem is stationary
    }
    draw() {
        ctx.fillStyle = this.type === 'golem' ? '#888' : PALETTE.enemy;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 8, this.y + 8, 4, 4);
        ctx.fillRect(this.x + 20, this.y + 8, 4, 4);
    }
    getRect() {
        return {x: this.x, y: this.y, w: this.w, h: this.h};
    }
}

class Projectile {
    constructor(x, y, tx, ty, source) {
        this.x = x;
        this.y = y;
        this.source = source;
        const angle = Math.atan2(ty - y, tx - x);
        this.vx = Math.cos(angle) * 7;
        this.vy = Math.sin(angle) * 7;
        this.w = 8;
        this.h = 8;
        this.dead = false;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > GAME_WIDTH || this.y < 0 || this.y > GAME_HEIGHT) this.dead = true;
    }
    draw() {
        ctx.fillStyle = this.source === 'enemy' ? '#ff0000' : PALETTE.fire;
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
    getRect() {
        return {x: this.x, y: this.y, w: this.w, h: this.h};
    }
}

class FuelPickup {
    constructor(x, y, amount) {
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.w = 16;
        this.h = 16;
        this.dead = false;
        this.timer = 0;
    }
    update() {
        this.timer++;
        this.y += Math.sin(this.timer * 0.1) * 0.5;
    }
    draw() {
        ctx.fillStyle = PALETTE.fuel;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = '#000';
        ctx.fillText('F', this.x + 4, this.y + 12);
    }
    getRect() {
        return {x: this.x, y: this.y, w: this.w, h: this.h};
    }
}

// --- Game State ---
let player = new Player();
let enemies = [];
let projectiles = [];
let fuels = [];
let particles = [];
let score = 0;
let highScore = localStorage.getItem('fireBreatherHighScore') || 0;
let gameTime = 0;
let state = 'MENU'; // MENU, PLAYING, GAMEOVER, VICTORY
let frameCount = 0;

// UI Elements
const uiTimer = document.getElementById('timer');
const uiFuelFill = document.getElementById('fuel-bar-fill');
const uiFuelText = document.getElementById('fuel-text');
const uiHealthFill = document.getElementById('health-bar-fill');
const uiHealthText = document.getElementById('health-text');
const uiScore = document.getElementById('score-container');
const uiHighScore = document.getElementById('highscore-container');
const uiBestDisplay = document.getElementById('best-score-display');

uiHighScore.innerText = 'BEST: ' + highScore;
uiBestDisplay.innerText = 'Best: ' + highScore;

function spawnEnemy() {
    const types = ['imp', 'imp', 'rider', 'phoenix', 'golem'];
    const type = types[Math.floor(Math.random() * types.length)];
    const x = GAME_WIDTH + 100;
    const y = type === 'phoenix' ? 50 : GAME_HEIGHT - 130;
    enemies.push(new Enemy(x, y, type));
}

function spawnFuel(x, y, amount) {
    fuels.push(new FuelPickup(x, y, amount));
}

function addParticle(x, y, color) {
    for(let i=0; i<5; i++) {
        particles.push({x, y, vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4, life: 30, color});
    }
}

function checkCollision(r1, r2) {
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y +r1.h > r2.y;
}

function update() {
    if (state !== 'PLAYING') return;
    frameCount++;
    gameTime += 1/60;
    
    uiTimer.innerText = 'TIME: ' + gameTime.toFixed(1);
    
    player.update();
    
    // Spawn enemies
    if (frameCount % 180 === 0) spawnEnemy();
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.update();
        
        // Collision with player
        if (checkCollision(player.getRect(), e.getRect())) {
            if (player.invuln <= 0) {
                player.health -= 10;
                player.invuln = 60;
                addParticle(e.x + e.w/2, e.y + e.h/2, '#ff0000');
                playSound('hit');
            }
        }
        
        // Remove off-screen
        if (e.x < -100) enemies.splice(i, 1);
    }
    
    // Update projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.update();
        
        if (p.source === 'enemy' && checkCollision(p.getRect(), player.getRect())) {
            if (player.invuln <= 0) {
                player.health -= 5;
                player.invuln = 40;
                addParticle(p.x, p.y, '#ff0000');
                playSound('hit');
            }
            p.dead = true;
        }
        
        if (p.dead) projectiles.splice(i, 1);
    }
    
    // Player breath projectiles
    if (player.breathing && player.breathCooldown <= 0 && player.fuel > 0) {
        player.breathCooldown = 5;
        const angle = Math.atan2((touchActive ? touchY : mouseY) - (player.y + player.h/2), (touchActive ? touchX : mouseX) - (player.x + player.w/2));
        projectiles.push(new Projectile(player.x + player.w/2, player.y + player.h/2, 
            player.x + player.w/2 + Math.cos(angle) * 100, 
            player.y + player.h/2 + Math.sin(angle) * 100, 'player'));
        playSound('shoot');
    }
    
    // Update fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
        let f = fuels[i];
        f.update();
        if (checkCollision(player.getRect(), f.getRect())) {
            player.fuel = Math.min(FUEL_MAX, player.fuel + f.amount);
            score += 10;
            addParticle(f.x, f.y, PALETTE.fuel);
            playSound('pickup');
            fuels.splice(i, 1);
        }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    // Check game over
    if (player.health <= 0) {
        state = 'GAMEOVER';
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('fireBreatherHighScore', highScore);
        }
        document.getElementById('final-score').innerText = 'Score: ' + score;
        document.getElementById('final-time').innerText = 'Time: ' + gameTime.toFixed(1) + 's';
        document.getElementById('game-over-screen').classList.add('active');
        document.getElementById('overlay').style.display = 'flex';
    }
    
    // Update HUD
    uiFuelFill.style.width = (player.fuel / FUEL_MAX * 100) + '%';
    uiFuelText.innerText = Math.floor(player.fuel) + '/' + FUEL_MAX;
    uiHealthFill.style.width = (player.health / HEALTH_MAX * 100) + '%';
    uiHealthText.innerText = Math.floor(player.health) + '/' + HEALTH_MAX;
    uiScore.innerText = 'SCORE: ' + score;
}

function draw() {
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Ground
    ctx.fillStyle = PALETTE.platform;
    ctx.fillRect(0, GAME_HEIGHT - 100, GAME_WIDTH, 100);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, GAME_HEIGHT - 100, GAME_WIDTH, 4);
    
    // Draw fuels
    fuels.forEach(f => f.draw());
    
    // Draw enemies
    enemies.forEach(e => e.draw());
    
    // Draw projectiles
    projectiles.forEach(p => p.draw());
    
    // Draw particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1;
    });
    
    // Draw player
    player.draw();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// --- Mobile Controls ---
const breathBtn = document.getElementById('breath-btn');
breathBtn.addEventListener('touchstart', e => { e.preventDefault(); keys['Space'] = true; touchActive = true; });
breathBtn.addEventListener('touchend', e => { e.preventDefault(); keys['Space'] = false; touchActive = false; });
breathBtn.addEventListener('mousedown', e => { keys['Space'] = true; });
breathBtn.addEventListener('mouseup', e => { keys['Space'] = false; });

// --- UI Events ---
document.getElementById('start-btn').addEventListener('click', () => {
    state = 'PLAYING';
    document.getElementById('overlay').style.display = 'none';
    player.reset();
    enemies = [];
    projectiles = [];
    fuels = [];
    particles = [];
    score = 0;
    gameTime = 0;
    frameCount = 0;
});

document.getElementById('restart-btn').addEventListener('click', () => {
    document.getElementById('game-over-screen').classList.remove('active');
    document.getElementById('overlay').style.display = 'none';
    state = 'PLAYING';
    player.reset();
    enemies = [];
    projectiles = [];
    fuels = [];
    particles = [];
    score = 0;
    gameTime = 0;
    frameCount = 0;
});

document.getElementById('next-btn').addEventListener('click', () => {
    document.getElementById('victory-screen').classList.remove('active');
    document.getElementById('overlay').style.display = 'none';
    state = 'PLAYING';
});

// Start loop
loop();
