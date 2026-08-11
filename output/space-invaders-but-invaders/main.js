/**
 * EVO-STRIKE - Core Engine
 */

const CONFIG = {
    WIDTH: 800,
    HEIGHT: 600,
    PLAYER_SPEED: 5,
    ENEMY_BASE_SPEED: 2,
    COLORS: {
        BG: '#050505',
        PLAYER: '#00FFFF',
        ENEMY: '#FF00FF',
        BULLET: '#FFBF00',
        PARTICLE: '#FF00FF'
    }
};

// Audio Engine
const AudioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, duration, vol = 0.1) {
    const osc = AudioCtx.createOscillator();
    const gain = AudioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, AudioCtx.currentTime);
    gain.gain.setValueAtTime(vol, AudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, AudioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(AudioCtx.destination);
    osc.start();
    osc.stop(AudioCtx.currentTime + duration);
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');
const timerEl = document.getElementById('timer');
const highScoreEl = document.getElementById('high-score-display');

let gameState = 'MENU';
let score = 0;
let highScore = localStorage.getItem('evo_strike_highscore') || 0;
let wave = 1;
let startTime = 0;
let lastTime = 0;
let shakeTime = 0;

highScoreEl.innerText = `HIGH SCORE: ${highScore}`;

// Input Handling
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('resize', resize);

function resize() {
    const scale = Math.min(window.innerWidth / CONFIG.WIDTH, window.innerHeight / CONFIG.HEIGHT);
    canvas.width = CONFIG.WIDTH;
    canvas.height = CONFIG.HEIGHT;
    canvas.style.width = (CONFIG.WIDTH * scale) + 'px';
    canvas.style.height = (CONFIG.HEIGHT * scale) + 'px';
}
resize();

// Entities
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.color = color;
    }
    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 3, 3);
        ctx.globalAlpha = 1.0;
    }
}

class Projectile {
    constructor(x, y, vx, vy, owner) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.owner = owner; // 'player' or 'enemy'
        this.radius = 4;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }
    draw() {
        ctx.fillStyle = this.owner === 'player'? CONFIG.COLORS.BULLET : CONFIG.COLORS.ENEMY;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Enemy {
    constructor(waveNum) {
        this.x = Math.random() * (CONFIG.WIDTH - 40) + 20;
        this.y = -50;
        this.width = 30;
        this.height = 30;
        this.hp = 1 + Math.floor(waveNum / 2);
        this.maxHp = this.hp;
        this.speed = CONFIG.ENEMY_BASE_SPEED + (waveNum * 0.5);
        this.type = waveNum >= 3? 'apex' : (waveNum >= 2? 'adaptive' : 'base');
        this.vx = (Math.random() - 0.5) * 2;
        this.timer = 0;
    }
    update(dt) {
        this.y += this.speed * dt;
        this.x += this.vx * dt;
        if (this.x < 0 || this.x > CONFIG.WIDTH - this.width) this.vx *= -1;
        
        this.timer += dt;
        if (this.type === 'apex' && this.timer > 2) {
            this.timer = 0;
        }
    }
    draw() {
        ctx.fillStyle = '#FF00FF';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Health bar
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x, this.y - 10, this.width, 4);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(this.x, this.y - 10, (this.hp / this.maxHp) * this.width, 4);
    }
}

class Player {
    constructor() {
        this.x = CONFIG.WIDTH / 2;
        this.y = CONFIG.HEIGHT - 50;
        this.w = 30;
        this.h = 30;
        this.hp = 3;
        this.cooldown = 0;
    }
    update(dt) {
        if (keys['ArrowLeft'] || keys['KeyA']) this.x -= CONFIG.PLAYER_SPEED * dt;
        if (keys['ArrowRight'] || keys['KeyD']) this.x += CONFIG.PLAYER_SPEED * dt;
        if (keys['ArrowUp'] || keys['KeyW']) this.y -= CONFIG.PLAYER_SPEED * dt;
        if (keys['ArrowDown'] || keys['KeyS']) this.y += CONFIG.PLAYER_SPEED * dt;

        this.x = Math.max(0, Math.min(CONFIG.WIDTH - this.w, this.x));
        this.y = Math.max(0, Math.min(CONFIG.HEIGHT - this.h, this.y));

        if (keys['Space'] && this.cooldown <= 0) {
            projectiles.push(new Projectile(this.x + this.w/2, this.y, 0, -7, 'player'));
            this.cooldown = 15;
            playSound(440, 'quare', 0.05, 0.05);
        }
        if (this.cooldown > 0) this.cooldown--;
    }
    draw() {
        ctx.fillStyle = CONFIG.COLORS.PLAYER;
        ctx.beginPath();
        ctx.moveTo(this.x + this.w/2, this.y);
        ctx.lineTo(this.x, this.y + this.h);
        ctx.lineTo(this.x + this.w, this.y + this.h);
        ctx.closePath();
        ctx.fill();
    }
}

// Game State Variables
let player = new Player();
let enemies = [];
let projectiles = [];
let particles = [];
let enemySpawnTimer = 0;

window.startGame = function() {
    score = 0;
    wave = 1;
    player = new Player();
    enemies = [];
    projectiles = [];
    particles = [];
    gameState = 'PLAYING';
    startTime = Date.now();
    menu.style.display = 'none';
    AudioCtx.resume();
};

function gameOver() {
    gameState = 'GAMEOVER';
    menu.style.display = 'flex';
    menu.querySelector('h1').innerText = 'MISSION FAILED';
    menu.querySelector('p').innerText = `FINAL SCORE: ${score}`;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('evo_strike_highscore', highScore);
        highScoreEl.innerText = `HIGH SCORE: ${highScore}`;
    }
}

function update(dt) {
    if (gameState!== 'PLAYING') return;

    player.update(dt);

    // Spawn Enemies
    enemySpawnTimer -= dt;
    if (enemySpawnTimer <= 0) {
        enemies.push(new Enemy(wave));
        enemySpawnTimer = Math.max(20, 100 - (wave * 5));
    }

    // Update Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.update(dt);
        if (p.y < 0 || p.y > CONFIG.HEIGHT) projectiles.splice(i, 1);
    }

    // Update Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        e.update(dt);

        // Collision: Enemy vs Player
        if (e.x < player.x + player.w && e.x + e.width > player.x && e.y < player.y + player.h && e.y + e.height > player.y) {
            player.hp--;
            enemies.splice(i, 1);
            shakeTime = 10;
            playSound(100, 'awtooth', 0.3);
            if (player.hp <= 0) gameOver();
            continue;
        }

        // Collision: Projectile vs Enemy
        for (let j = projectiles.length - 1; j >= 0; j--) {
            const p = projectiles[j];
            if (p.owner === 'player' && p.x > e.x && p.x < e.x + e.width && p.y > e.y && p.y < e.y + e.height) {
                e.hp--;
                projectiles.splice(j, 1);
                if (e.hp <= 0) {
                    // Explosion
                    for(let k=0; k<10; k++) particles.push(new Particle(e.x + e.width/2, e.y + e.height/2, CONFIG.COLORS.ENEMY));
                    enemies.splice(i, 1);
                    score += 100 * wave;
                    playSound(200, 'ine', 0.1);
                    // Wave progression
                    if (score > wave * 2000) {
                        wave++;
                        playSound(880, 'ine', 0.5);
                    }
                    break;
                }
            }
        }

        // Enemy out of bounds
        if (e.y > CONFIG.HEIGHT) {
            enemies.splice(i, 1);
            player.hp--;
            if (player.hp <= 0) gameOver();
        }
    }

    // Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    // Timer
    const elapsed = (Date.now() - startTime) / 1000;
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const secs = (elapsed % 60).toFixed(2).padStart(5, '0');
    timerEl.innerText = `${mins}:${secs}`;
}

function draw() {
    // Motion Trails
    ctx.fillStyle = 'rgba(5, 5, 5, 0.3)';
    ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

    ctx.save();
    if (shakeTime > 0) {
        ctx.translate(Math.random() * 5 - 2.5, Math.random() * 5 - 2.5);
        shakeTime--;
    }

    player.draw();
    enemies.forEach(e => e.draw());
    projectiles.forEach(p => p.draw());
    particles.forEach(p => p.draw());

    ctx.restore();

    // HUD
    ctx.fillStyle = '#00FFFF';
    ctx.font = '20px Courier New';
    ctx.fillText(`SCORE: ${score}`, 20, 580);
    
    // Health segments
    for(let i=0; i<player.hp; i++) {
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(20 + (i * 25), 585, 20, 5);
    }

    // Wave indicator
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FF00FF';
    ctx.fillText(`WAVE ${wave}`, CONFIG.WIDTH/2, 30);
    ctx.textAlign = 'left';
}

function loop(timestamp) {
    const dt = (timestamp - lastTime) / 16.67;
    lastTime = timestamp;
    
    update(dt || 1);
    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);