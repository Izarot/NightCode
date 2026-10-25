const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const waveEl = document.getElementById('wave');
const highscoreEl = document.getElementById('highscore');
const gameOverEl = document.getElementById('gameOver');
const finalScoreEl = document.getElementById('finalScore');

// --- CONFIG & PALETTE ---
const COLORS = {
    bg: '#0a0a12',
    player: '#00f0ff',
    playerAccent: '#ffffff',
    enemy: '#ff0055',
    enemyAccent: '#ffffff',
    ammo: '#ffaa00',
    text: '#00f0ff',
    wall: '#333344'
};

const CONFIG = {
    playerMaxSpeed: 350,
    playerAccel: 2000,
    playerFriction: 1800,
    playerRadius: 16,
    playerHp: 5,
    bulletSpeed: 800,
    bulletLife: 1.5,
    shootCooldown: 0.25,
    cellRegenRate: 0.01 // 1% per second
};

// --- STATE ---
let width, height;
let gameActive = true;
let gameOver = false;
let score = 0;
let wave = 1;
let waveTimer = 0;
let waveSpawnInterval = 2;
let startTime = Date.now();
let highScore = parseInt(localStorage.getItem('neo_mineral_highscore') || '0', 10);
highscoreEl.textContent = `BEST: ${highScore}`;

let screenShake = 0;
let particles = [];
let bullets = [];
let enemies = [];
let cells = 0;
let ammo = 10;
let maxAmmo = 10;

// --- INPUT ---
const keys = {};
const mouse = { x: 0, y: 0, down: false };

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});
window.addEventListener('mousedown', () => mouse.down = true);
window.addEventListener('mouseup', e => mouse.down = false);
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.touches[0].clientX - rect.left;
    mouse.y = e.touches[0].clientY - rect.top;
    mouse.down = true;
}, {passive: false});
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.touches[0].clientX - rect.left;
    mouse.y = e.touches[0].clientY - rect.top;
}, {passive: false});
canvas.addEventListener('touchend', () => mouse.down = false);

// --- AUDIO (WEB AUDIO API) ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();

function playSfx(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'explode') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'collect') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    }
}

// --- RESIZE ---
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resize);
resize();

// --- CLASSES ---
class Player {
    constructor() {
        this.x = width / 2;
        this.y = height / 2;
        this.vx = 0;
        this.vy = 0;
        this.radius = CONFIG.playerRadius;
        this.hp = CONFIG.playerHp;
        this.maxHp = CONFIG.playerHp;
        this.angle = 0;
        this.shootTimer = 0;
        this.invuln = 0;
    }
    update(dt) {
        // Movement
        let ax = 0, ay = 0;
        if (keys['KeyW'] || keys['ArrowUp']) ay = -1;
        if (keys['KeyS'] || keys['ArrowDown']) ay = 1;
        if (keys['KeyA'] || keys['ArrowLeft']) ax = -1;
        if (keys['KeyD'] || keys['ArrowRight']) ax = 1;

        const len = Math.sqrt(ax*ax + ay*ay);
        if (len > 0) {
            ax /= len; ay /= len;
        }

        const accel = CONFIG.playerAccel;
        this.vx += ax * accel * dt;
        this.vy += ay * accel * dt;

        // Friction
        const friction = CONFIG.playerFriction;
        this.vx *= (1 - friction * dt);
        this.vy *= (1 - friction * dt);

        // Clamp speed
        const speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
        if (speed > CONFIG.playerMaxSpeed) {
            this.vx = (this.vx / speed) * CONFIG.playerMaxSpeed;
            this.vy = (this.vy / speed) * CONFIG.playerMaxSpeed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Bounds
        this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));

        // Aim
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        this.angle = Math.atan2(dy, dx);

        // Shooting
        if (this.shootTimer > 0) this.shootTimer -= dt;
        if (mouse.down && this.shootTimer <= 0 && ammo > 0) {
            this.shoot();
        }

        // Passive ammo regen
        if (ammo < maxAmmo) {
            ammo += CONFIG.cellRegenRate * maxAmmo * dt;
            if (ammo > maxAmmo) ammo = maxAmmo;
        }

        if (this.invuln > 0) this.invuln -= dt;
    }
    shoot() {
        ammo--;
        this.shootTimer = CONFIG.shootCooldown;
        playSfx('shoot');
        bullets.push(new Bullet(this.x, this.y, this.angle, 'player'));
        screenShake = 0.1;
    }
    draw() {
        if (this.invuln > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        // Body
        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        // Cockpit
        ctx.fillStyle = COLORS.playerAccent;
        ctx.beginPath();
        ctx.arc(10, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        // Thruster
        ctx.fillStyle = '#0044ff';
        ctx.beginPath();
        ctx.arc(-12, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Health Bar
        const barW = 40;
        const barH = 6;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barW/2, this.y - this.radius - 12, barW, barH);
        ctx.fillStyle = COLORS.player;
        ctx.fillRect(this.x - barW/2, this.y - this.radius - 12, (this.hp / this.maxHp) * barW, barH);
    }
}

class Enemy {
    constructor(type) {
        this.type = type; // 'swarmer', 'shooter', 'heavy'
        this.spawn();
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.shootTimer = 0;
    }
    spawn() {
        // Spawn outside screen
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { this.x = Math.random() * width; this.y = -50; }
        else if (side === 1) { this.x = width + 50; this.y = Math.random() * height; }
        else if (side === 2) { this.x = Math.random() * width; this.y = height + 50; }
        else { this.x = -50; this.y = Math.random() * height; }

        if (this.type === 'swarmer') {
            this.radius = 14;
            this.hp = 1;
            this.maxHp = 1;
            this.speed = 150 + (wave * 10);
            this.damage = 1;
            this.color = COLORS.enemy;
        } else if (this.type === 'shooter') {
            this.radius = 16;
            this.hp = 2;
            this.maxHp = 2;
            this.speed = 100 + (wave * 5);
            this.damage = 1;
            this.color = '#ff00aa';
        } else if (this.type === 'heavy') {
            this.radius = 24;
            this.hp = 5 + wave;
            this.maxHp = this.hp;
            this.speed = 60 + (wave * 2);
            this.damage = 2;
            this.color = '#aa00ff';
        }
    }
    update(dt, player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        this.angle = Math.atan2(dy, dx);

        if (this.type === 'shooter' && dist > 200) {
            // Move towards but stop at range
            const moveSpeed = this.speed;
            this.vx = (dx / dist) * moveSpeed;
            this.vy = (dy / dist) * moveSpeed;
            this.shootTimer -= dt;
            if (this.shootTimer <= 0 && dist < 400) {
                this.shootTimer = 1.5;
                bullets.push(new Bullet(this.x, this.y, this.angle, 'enemy'));
            }
        } else {
            const moveSpeed = this.speed;
            this.vx = (dx / dist) * moveSpeed;
            this.vy = (dy / dist) * moveSpeed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Collision with player
        if (dist < this.radius + player.radius && player.invuln <= 0) {
            player.hp -= this.damage * dt * 2;
            player.invuln = 0.5;
            screenShake = 0.2;
            if (player.hp <= 0) endGame();
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.enemyAccent;
        ctx.lineWidth = 2;
        ctx.stroke();
        // Eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(8, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, angle, owner) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner = owner;
        this.life = CONFIG.bulletLife;
        this.speed = CONFIG.bulletSpeed;
        this.radius = 4;
    }
    update(dt) {
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
        this.life -= dt;
    }
    draw() {
        ctx.fillStyle = this.owner === 'player' ? COLORS.ammo : '#ff4444';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 300;
        this.vy = (Math.random() - 0.5) * 300;
        this.life = 0.5;
        this.maxLife = 0.5;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }
    draw() {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 4, 4);
        ctx.globalAlpha = 1;
    }
}

// --- GAME LOGIC ---
const player = new Player();

function spawnEnemy() {
    const types = ['swarmer', 'swarmer', 'shooter', 'heavy'];
    const type = types[Math.floor(Math.random() * types.length)];
    if (wave > 3 && Math.random() < 0.3) type ='heavy';
    enemies.push(new Enemy(type));
}

function endGame() {
    gameOver = true;
    gameActive = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neo_mineral_highscore', highScore.toString());
        highscoreEl.textContent = `BEST: ${highScore}`;
    }
    finalScoreEl.textContent = `TOTAL CELLS: ${score}`;
    gameOverEl.style.display = 'block';
    screenShake = 0;
}

function resetGame() {
    score = 0;
    wave = 1;
    waveTimer = 0;
    waveSpawnInterval = 2;
    cells = 0;
    ammo = maxAmmo;
    bullets = [];
    enemies = [];
    particles = [];
    player.x = width / 2;
    player.y = height / 2;
    player.vx = 0;
    player.vy = 0;
    player.hp = player.maxHp;
    gameOver = false;
    gameActive = true;
    gameOverEl.style.display = 'none';
    startTime = Date.now();
    scoreEl.textContent = `CELLS: ${score}`;
    waveEl.textContent = `WAVE: ${wave}`;
    timerEl.textContent = `00:00`;
}

function update(dt) {
    if (!gameActive) return;
    
    player.update(dt);
    
    // Wave timer
    waveTimer += dt;
    if (waveTimer >= waveSpawnInterval) {
        waveTimer = 0;
        waveSpawnInterval = Math.max(0.5, waveSpawnInterval - 0.05);
        spawnEnemy();
        if (Math.random() < 0.3) spawnEnemy();
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update(dt);
        if (bullets[i].life <= 0) {
            bullets.splice(i, 1);
            continue;
        }
    }
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].update(dt, player);
        if (enemies[i].hp <= 0) {
            for (let j = 0; j < 8; j++) {
                particles.push(new Particle(enemies[i].x, enemies[i].y, enemies[i].color));
            }
            playSfx('explode');
            score += 10;
            cells += 1;
            ammo = Math.min(maxAmmo, ammo + 1);
            enemies.splice(i, 1);
            scoreEl.textContent = `CELLS: ${cells}`;
            continue;
        }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
    
    // Bullet collisions
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (b.owner === 'player') {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                const dx = b.x - e.x;
                const dy = b.y - e.y;
                if (dx*dx + dy*dy < (b.radius + e.radius)*(b.radius + e.radius)) {
                    e.hp--;
                    b.life = 0;
                    playSfx('hit');
                    break;
                }
            }
        } else {
            const dx = b.x - player.x;
            const dy = b.y - player.y;
            if (dx*dx + dy*dy < (b.radius + player.radius)*(b.radius + player.radius) && player.invuln <= 0) {
                player.hp -= 1;
                player.invuln = 1;
                b.life = 0;
                screenShake = 0.3;
                playSfx('hit');
                if (player.hp <= 0) endGame();
            }
        }
    }
    
    // Timer
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
    
    waveEl.textContent = `WAVE: ${wave}`;
}

function draw() {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);
    
    // Apply screen shake
    if (screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake * 20;
        const shakeY = (Math.random() - 0.5) * screenShake * 20;
        ctx.translate(shakeX, shakeY);
        screenShake *= 0.9;
        if (screenShake < 0.01) screenShake = 0;
    }
    
    // Draw grid
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    const gridSize = 50;
    const offsetX = (player.x * 0.5) % gridSize;
    const offsetY = (player.y * 0.5) % gridSize;
    for (let x = offsetX; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = offsetY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Draw bullets
    bullets.forEach(b => b.draw());
    
    // Draw enemies
    enemies.forEach(e => e.draw());
    
    // Draw player
    player.draw();
    
    // Draw particles
    particles.forEach(p => p.draw());
}

function loop() {
    const now = Date.now();
    const dt = Math.min((now - (loop.last || now)) / 1000, 0.1);
    loop.last = now;
    
    update(dt);
    draw();
    
    requestAnimationFrame(loop);
}

loop();
