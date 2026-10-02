const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Audio Context
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function initAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
}

function playSound(freq, type, duration) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Canvas Setup
function resizeCanvas() {
    const maxWidth = window.innerWidth * 0.95;
    const maxHeight = window.innerHeight * 0.95;
    const scale = Math.min(maxWidth / 1280, maxHeight / 720);
    canvas.width = 1280 * scale;
    canvas.height = 720 * scale;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game State
const STATE = {
    MENU: 0, PLAYING: 1, PAUSED: 2, GAMEOVER: 3
};
let gameState = STATE.MENU;
let score = 0;
let highScore = parseInt(localStorage.getItem('neonHighScore')) || 0;
let startTime = Date.now();
let speedrunTime = 0;

// Player
const player = {
    x: 100, y: 500, w: 32, h: 32,
    vx: 0, vy: 0,
    speed: 150, accel: 800, friction: 600,
    jumpForce: -460, gravity: 1200, maxFall: 400,
    health: 4, maxHealth: 8,
    abilities: { doubleJump: false, dash: false, wallClimb: false },
    canDoubleJump: false, isDashing: false, dashCooldown: 0,
    invincible: 0, coyoteTime: 0, jumpBuffer: 0,
    onGround: false, facing: 1,
    color: '#0ff'
};

// Input
const keys = {};
const touchControls = { left: false, right: false, jump: false, dash: false };

document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') e.preventDefault();
    initAudio();
});
document.addEventListener('keyup', e => keys[e.code] = false);

// Touch Controls
['btn-left','btn-right','btn-jump','btn-dash'].forEach(id => {
    const btn = document.getElementById(id);
    const key = id.replace('btn-', '');
    btn.addEventListener('touchstart', e => { e.preventDefault(); touchControls[key] = true; initAudio(); });
    btn.addEventListener('touchend', e => { e.preventDefault(); touchControls[key] = false; });
});

// Tilemap (32px tiles)
const TILE_SIZE = 32;
const mapWidth = 100;
const mapHeight = 30;
let tilemap = [];

function generateMap() {
    tilemap = [];
    for (let y = 0; y < mapHeight; y++) {
        tilemap[y] = [];
        for (let x = 0; x < mapWidth; x++) {
            if (y === mapHeight - 1) {
                tilemap[y][x] = 1; // Floor
            } else if (x === 50 && y > 5 && y < 20) {
                tilemap[y][x] = 2; // Wall
            } else if (x === 80 && y > 10 && y < 25) {
                tilemap[y][x] = 2; // Wall
            } else if (y < 5 && x > 10 && x < 90) {
                tilemap[y][x] = 1; // Platforms
            } else {
                tilemap[y][x] = 0; // Empty
            }
        }
    }
    // Add collectibles
    for (let i = 0; i < 20; i++) {
        const cx = Math.floor(Math.random() * (mapWidth - 2)) + 1;
        const cy = Math.floor(Math.random() * (mapHeight - 6)) + 5;
        if (tilemap[cy][cx] === 0) tilemap[cy][cx] = 3; // Collectible
    }
}

// Enemies
let enemies = [];
function spawnEnemies() {
    enemies = [];
    for (let i = 0; i < 10; i++) {
        enemies.push({
            x: Math.random() * 3000 + 200,
            y: 500,
            w: 24, h: 24,
            vx: (Math.random() - 0.5) * 100,
            health: 2,
            type: 'patrol',
            color: '#f0f'
        });
    }
}

// Particles
let particles = [];
function addParticle(x, y, color) {
    particles.push({
        x, y, vx: (Math.random() - 0.5) * 200,
        vy: (Math.random() - 0.5) * 200 - 100,
        life: 1, color, size: Math.random() * 4 + 2
    });
}

// Collision
function collides(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

function isSolid(x, y) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (tx < 0 || tx >= mapWidth || ty < 0 || ty >= mapHeight) return false;
    return tilemap[ty][tx] === 1 || tilemap[ty][tx] === 2;
}

// Update
function update(dt) {
    if (gameState !== STATE.PLAYING) return;

    // Timer
    speedrunTime = (Date.now() - startTime) / 1000;

    // Input
    const left = keys['ArrowLeft'] || keys['KeyA'] || touchControls.left;
    const right = keys['ArrowRight'] || keys['KeyD'] || touchControls.right;
    const jump = keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || touchControls.jump;
    const dash = keys['ShiftLeft'] || keys['KeyE'] || touchControls.dash;

    // Movement
    if (left) { player.vx -= player.accel * dt; player.facing = -1; }
    if (right) { player.vx += player.accel * dt; player.facing = 1; }
    if (!left && !right) {
        if (player.vx > 0) player.vx = Math.max(0, player.vx - player.friction * dt);
        else player.vx = Math.min(0, player.vx + player.friction * dt);
    }

    // Gravity
    player.vy += player.gravity * dt;
    if (player.vy > player.maxFall) player.vy = player.maxFall;

    // Jump
    if (jump && player.onGround) {
        player.vy = player.jumpForce;
        player.onGround = false;
        player.canDoubleJump = true;
        playSound(400, 'square', 0.1);
    } else if (jump && player.canDoubleJump && player.abilities.doubleJump) {
        player.vy = player.jumpForce;
        player.canDoubleJump = false;
        playSound(500, 'square', 0.1);
        for (let i = 0; i < 5; i++) addParticle(player.x + 16, player.y + 32, '#0ff');
    }

    // Dash
    if (dash && player.abilities.dash && player.dashCooldown <= 0 && !player.isDashing) {
        player.isDashing = true;
        player.dashCooldown = 1;
        player.vx = player.facing * 600;
        player.vy = 0;
        player.invincible = 0.15;
        playSound(200, 'sawtooth', 0.15);
    }
    if (player.isDashing) {
        player.dashCooldown -= dt;
        if (player.dashCooldown <= 0) player.isDashing = false;
    }

    // Apply velocity
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Collision X
    if (isSolid(player.x, player.y) || isSolid(player.x + player.w, player.y)) {
        if (player.vx > 0) player.x = Math.floor(player.x / TILE_SIZE) * TILE_SIZE - player.w;
        else player.x = Math.floor((player.x + player.w) / TILE_SIZE) * TILE_SIZE;
        player.vx = 0;
    }

    // Collision Y
    player.onGround = false;
    if (isSolid(player.x, player.y + player.h) && player.vy >= 0) {
        player.y = Math.floor(player.y / TILE_SIZE) * TILE_SIZE - player.h;
        player.vy = 0;
        player.onGround = true;
        player.canDoubleJump = true;
    } else if (isSolid(player.x, player.y) && player.vy < 0) {
        player.y = Math.floor((player.y + player.h) / TILE_SIZE) * TILE_SIZE;
        player.vy = 0;
    }

    // Coyote time & jump buffer
    if (player.onGround) player.coyoteTime = 0.12;
    else player.coyoteTime -= dt;

    // Invincibility
    if (player.invincible > 0) player.invincible -= dt;

    // Collectibles
    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            if (tilemap[y][x] === 3) {
                const cx = x * TILE_SIZE + 16;
                const cy = y * TILE_SIZE + 16;
                if (collides(player.x, player.y, player.w, player.h, cx - 8, cy - 8, 16, 16)) {
                    tilemap[y][x] = 0;
                    score += 100;
                    playSound(800, 'sine', 0.1);
                    for (let i = 0; i < 8; i++) addParticle(cx, cy, '#ff0');
                }
            }
        }
    }

    // Enemies
    enemies.forEach(e => {
        e.x += e.vx * dt;
        if (isSolid(e.x, e.y) || isSolid(e.x + e.w, e.y)) e.vx *= -1;
        
        // Player collision
        if (player.invincible <= 0 && collides(player.x, player.y, player.w, player.h, e.x, e.y, e.w, e.h)) {
            if (player.vy > 0 && player.y + player.h < e.y + e.h/2) {
                // Stomp
                e.health--;
                player.vy = -300;
                score += 50;
                playSound(300, 'square', 0.1);
            } else {
                // Damage player
                player.health--;
                player.invincible = 0.3;
                player.vx = (player.x < e.x ? -200 : 200);
                player.vy = -200;
                playSound(100, 'sawtooth', 0.2);
                if (player.health <= 0) {
                    gameState = STATE.GAMEOVER;
                    if (score > highScore) {
                        highScore = score;
                        localStorage.setItem('neonHighScore', highScore);
                    }
                }
            }
        }
    });

    // Update particles
    particles = particles.filter(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 2;
        return p.life > 0;
    });

    // Camera
    const camX = player.x - canvas.width / 2;
    const camY = player.y - canvas.height / 2;

    // Render
    render(camX, camY);
}

// Render
function render(camX, camY) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camX * 0.5, -camY * 0.5); // Parallax
    
    // Tiles
    const startX = Math.floor(camX / TILE_SIZE) - 1;
    const endX = startX + canvas.width / TILE_SIZE + 2;
    const startY = Math.floor(camY / TILE_SIZE) - 1;
    const endY = startY + canvas.height / TILE_SIZE + 2;

    for (let y = Math.max(0, startY); y < Math.min(mapHeight, endY); y++) {
        for (let x = Math.max(0, startX); x < Math.min(mapWidth, endX); x++) {
            const tile = tilemap[y][x];
            if (tile === 1) {
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#0ff';
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (tile === 2) {
                ctx.fillStyle = '#2d2d44';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#f0f';
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (tile === 3) {
                ctx.fillStyle = '#ff0';
                ctx.shadowColor = '#ff0';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(x * TILE_SIZE + 16, y * TILE_SIZE + 16, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    // Enemies
    enemies.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.w, e.h);
    });

    // Player
    if (player.invincible <= 0 || Math.floor(Date.now() / 100) % 2) {
        ctx.fillStyle = player.color;
        ctx.shadowColor = player.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(player.x, player.y, player.w, player.h);
        ctx.shadowBlur = 0;
    }

    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    // HUD Update
    updateHUD();
}

function updateHUD() {
    // Timer
    const mins = Math.floor(speedrunTime / 60);
    const secs = Math.floor(speedrunTime % 60);
    const ms = Math.floor((speedrunTime % 1) * 100);
    document.getElementById('timer').textContent = 
        `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}.${String(ms).padStart(2,'0')}`;

    // Health
    const healthBar = document.getElementById('health-bar');
    healthBar.innerHTML = '';
    for (let i = 0; i < player.maxHealth; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart' + (i >= player.health ? ' empty' : '');
        healthBar.appendChild(heart);
    }

    // Abilities
    const abilitiesDiv = document.getElementById('abilities');
    abilitiesDiv.innerHTML = '';
    const abilityList = [
        { key: 'doubleJump', icon: '⬆️', name: 'Double Jump' },
        { key: 'dash', icon: '💨', name: 'Dash' }
    ];
    abilityList.forEach(ab => {
        const icon = document.createElement('div');
        icon.className = 'ability-icon' + (player.abilities[ab.key] ? '' : ' locked');
        icon.textContent = ab.icon;
        icon.title = ab.name;
        abilitiesDiv.appendChild(icon);
    });

    // Score
    document.getElementById('score').textContent = `Score: ${score} | Best: ${highScore}`;
}

// Game Loop
let lastTime = 0;
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    if (gameState === STATE.PLAYING) {
        update(dt);
    } else if (gameState === STATE.MENU) {
        // Simple menu render
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0ff';
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NEON METROIDVANIA', canvas.width/2, canvas.height/2 - 50);
        ctx.fillStyle = '#ff0';
        ctx.font = '20px monospace';
        ctx.fillText('Press SPACE or tap to start', canvas.width/2, canvas.height/2 + 20);
        ctx.fillStyle = '#0f0';
        ctx.fillText(`High Score: ${highScore}`, canvas.width/2, canvas.height/2 + 60);
    } else if (gameState === STATE.GAMEOVER) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f00';
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2 + 20);
        ctx.fillText('Press R to restart', canvas.width/2, canvas.height/2 + 60);
    }

    requestAnimationFrame(gameLoop);
}

// Start
function startGame() {
    gameState = STATE.PLAYING;
    score = 0;
    player.x = 100;
    player.y = 500;
    player.vx = 0;
    player.vy = 0;
    player.health = 4;
    player.abilities = { doubleJump: false, dash: false, wallClimb: false };
    startTime = Date.now();
    generateMap();
    spawnEnemies();
    particles = [];
}

document.addEventListener('keydown', e => {
    if (e.code === 'Space' && gameState === STATE.MENU) startGame();
    if (e.code === 'KeyR' && gameState === STATE.GAMEOVER) startGame();
    if (e.code === 'Escape') {
        gameState = gameState === STATE.PLAYING ? STATE.PAUSED : STATE.PLAYING;
    }
});

canvas.addEventListener('click', () => {
    initAudio();
    if (gameState === STATE.MENU) startGame();
    if (gameState === STATE.GAMEOVER) startGame();
});

// Unlock abilities at score thresholds
setInterval(() => {
    if (gameState === STATE.PLAYING) {
        if (score >= 500 && !player.abilities.doubleJump) {
            player.abilities.doubleJump = true;
            showNotification('Double Jump Unlocked!');
            playSound(600, 'sine', 0.3);
        }
        if (score >= 1500 && !player.abilities.dash) {
            player.abilities.dash = true;
            showNotification('Dash Unlocked!');
            playSound(800, 'sine', 0.3);
        }
    }
}, 1000);

function showNotification(text) {
    const notif = document.createElement('div');
    notif.style.cssText = 'position:fixed;bottom:20px;left:20px;background:rgba(0,255,255,0.9);color:#000;padding:10px;border-radius:5px;font-weight:bold;z-index:100;';
    notif.textContent = text;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2000);
}

generateMap();
spawnEnemies();
requestAnimationFrame(gameLoop);