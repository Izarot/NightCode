// Main entry point - initializes game systems
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const miniMapCtx = document.getElementById('miniMapCanvas').getContext('2d');
const zoneCtx = document.getElementById('zoneCanvas').getContext('2d');

// Game configuration
const CONFIG = {
    mapSize: 3000,
    playerCount: 20,
    zoneShrinkRate: 0.8,
    maxSpeed: 220,
    acceleration: 0.45,
    friction: 0.95,
    bulletSpeed: 800,
    fireRate: 150,
    spread: 0.05
};

// Game state
let gameState = 'menu';
let lastTime = 0;
let gameTime = 0;
let players = [];
let bullets = [];
let loot = [];
let particles = [];
let zone = null;
let localPlayer = null;
let camera = { x: 0, y: 0 };
let keys = {};
let mouse = { x: 0, y: 0, down: false };
let killFeed = [];
let highScore = parseInt(localStorage.getItem('br_highscore')) || 0;

// Color palette
const PALETTE = {
    bg: '#1a1a2e',
    grass: '#2d5a27',
    dirt: '#4a3728',
    water: '#1e3a5f',
    wall: '#3d3d3d',
    zone: '#00ffff',
    zoneDanger: '#ff0066',
    player: '#00ff88',
    enemy: '#ff3366',
    bullet: '#ffff00',
    loot: '#ffcc00',
    armor: '#00ffff',
    health: '#00ff44',
    text: '#ffffff',
    ui: '#00ffff',
    uiDanger: '#ff3366'
};

// Initialize audio context
audio.init();

// Load high score
document.getElementById('highScoreVal').textContent = highScore;

// Event listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

window.addEventListener('keydown', e => { keys[e.code] = true; if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault(); });
window.addEventListener('keyup', e => { keys[e.code] = false; });
canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width) + camera.x;
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height) + camera.y;
});
canvas.addEventListener('mousedown', e => { if (e.button === 0) mouse.down = true; });
canvas.addEventListener('mouseup', e => { if (e.button === 0) mouse.down = false; });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Touch controls for mobile
let touchStart = null;
canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    touchStart = { x: touch.clientX, y: touch.clientY };
    mouse.x = (touch.clientX - rect.left) * (canvas.width / rect.width) + camera.x;
    mouse.y = (touch.clientY - rect.top) * (canvas.height / rect.height) + camera.y;
    mouse.down = true;
}, { passive: false });
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    mouse.x = (touch.clientX - rect.left) * (canvas.width / rect.width) + camera.x;
    mouse.y = (touch.clientY - rect.top) * (canvas.height / rect.height) + camera.y;
}, { passive: false });
canvas.addEventListener('touchend', e => { mouse.down = false; touchStart = null; });

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function resizeCanvas() {
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080) * 0.95;
    canvas.width = Math.floor(1920 * scale);
    canvas.height = Math.floor(1080 * scale);
    document.getElementById('miniMapCanvas').width = 150;
    document.getElementById('miniMapCanvas').height = 150;
    document.getElementById('zoneCanvas').width = 60;
    document.getElementById('zoneCanvas').height = 60;
}

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
    gameState = 'playing';
    gameTime = 0;
    players = [];
    bullets = [];
    loot = [];
    particles = [];
    killFeed = [];
    
    // Create local player
    localPlayer = new Player(CONFIG.mapSize / 2, CONFIG.mapSize / 2, true);
    players.push(localPlayer);
    
    // Create AI enemies
    for (let i = 0; i < CONFIG.playerCount - 1; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = CONFIG.mapSize * 0.3 + Math.random() * CONFIG.mapSize * 0.2;
        const x = CONFIG.mapSize / 2 + Math.cos(angle) * dist;
        const y = CONFIG.mapSize / 2 + Math.sin(angle) * dist;
        players.push(new Player(x, y, false));
    }
    
    // Initialize zone
    zone = new Zone(CONFIG.mapSize / 2, CONFIG.mapSize / 2, CONFIG.mapSize * 0.4);
    
    // Spawn initial loot
    for (let i = 0; i < 50; i++) {
        loot.push(new LootItem(
            Math.random() * CONFIG.mapSize,
            Math.random() * CONFIG.mapSize,
            Math.floor(Math.random() * 4)
        ));
    }
    
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (gameState !== 'playing') return;
    
    const delta = Math.min(timestamp - lastTime, 50) / 1000;
    lastTime = timestamp;
    gameTime += delta;
    
    update(delta);
    render();
    
    requestAnimationFrame(gameLoop);
}

function update(delta) {
    // Update local player
    localPlayer.update(delta, keys, mouse);
    
    // Update camera to follow player
    camera.x = localPlayer.x - canvas.width / 2;
    camera.y = localPlayer.y - canvas.height / 2;
    camera.x = Math.max(0, Math.min(CONFIG.mapSize - canvas.width, camera.x));
    camera.y = Math.max(0, Math.min(CONFIG.mapSize - canvas.height, camera.y));
    
    // Update enemies
    for (let i = players.length - 1; i >= 0; i--) {
        if (!players[i].isLocal) {
            players[i].updateAI(delta, players, zone, loot);
        }
        players[i].updatePhysics(delta);
        
        if (players[i].health <= 0) {
            if (!players[i].isLocal) {
                addKillFeed(`You eliminated ${players[i].name}`);
                localPlayer.kills++;
                localPlayer.score += 100;
                spawnLootOnDeath(players[i]);
            }
            createDeathParticles(players[i].x, players[i].y, players[i].color);
            players.splice(i, 1);
        }
    }
    
    // Check if local player died
    if (localPlayer.health <= 0) {
        gameOver(false);
        return;
    }
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update(delta);
        if (bullets[i].shouldRemove) bullets.splice(i, 1);
    }
    
    // Update loot
    for (let i = loot.length - 1; i >= 0; i--) {
        loot[i].update(delta);
        if (loot[i].collected) loot.splice(i, 1);
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(delta);
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
    
    // Update zone
    zone.update(delta, players.length);
    
    // Check zone damage
    if (!zone.isInside(localPlayer.x, localPlayer.y)) {
        localPlayer.takeDamage(zone.damagePerSecond * delta, 'zone');
    }
    
    // Check victory
    if (players.length === 1 && players[0].isLocal) {
        gameOver(true);
    }
    
    // Update UI
    updateUI();
}

function render() {
    // Clear canvas
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Save context for camera transform
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    
    // Draw map background
    drawMap();
    
    // Draw zone
    zone.render(ctx);
    
    // Draw loot
    loot.forEach(item => item.render(ctx));
    
    // Draw bullets
    bullets.forEach(bullet => bullet.render(ctx));
    
    // Draw players
    players.forEach(player => player.render(ctx));
    
    // Draw particles
    particles.forEach(p => p.render(ctx));
    
    ctx.restore();
    
    // Render mini-map
    renderMiniMap();
    
    // Render zone timer
    renderZoneTimer();
}

function drawMap() {
    // Simple procedural map
    const gridSize = 200;
    for (let x = 0; x < CONFIG.mapSize; x += gridSize) {
        for (let y = 0; y < CONFIG.mapSize; y += gridSize) {
            const noise = Math.sin(x * 0.01) * Math.cos(y * 0.01);
            ctx.fillStyle = noise > 0 ? PALETTE.grass : PALETTE.dirt;
            ctx.fillRect(x, y, gridSize, gridSize);
        }
    }
    
    // Draw some walls/obstacles
    ctx.fillStyle = PALETTE.wall;
    for (let i = 0; i < 30; i++) {
        const x = (i * 97 + 123) % CONFIG.mapSize;
        const y = (i * 157 + 456) % CONFIG.mapSize;
        const w = 60 + (i * 13) % 100;
        const h = 60 + (i * 17) % 100;
        ctx.fillRect(x, y, w, h);
    }
    
    // Map boundary
    ctx.strokeStyle = PALETTE.zone;
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, CONFIG.mapSize, CONFIG.mapSize);
}

function renderMiniMap() {
    const mapCanvas = document.getElementById('miniMapCanvas');
    const scale = mapCanvas.width / CONFIG.mapSize;
    
    miniMapCtx.fillStyle = 'rgba(0,0,0,0.8)';
    miniMapCtx.fillRect(0, 0, mapCanvas.width, mapCanvas.height);
    
    // Zone
    miniMapCtx.strokeStyle = PALETTE.zone;
    miniMapCtx.lineWidth = 2;
    miniMapCtx.beginPath();
    miniMapCtx.arc(zone.x * scale, zone.y * scale, zone.radius * scale, 0, Math.PI * 2);
    miniMapCtx.stroke();
    
    // Players
    players.forEach(p => {
        miniMapCtx.fillStyle = p.isLocal ? PALETTE.player : PALETTE.enemy;
        miniMapCtx.beginPath();
        miniMapCtx.arc(p.x * scale, p.y * scale, 3, 0, Math.PI * 2);
        miniMapCtx.fill();
    });
    
    // Loot
    loot.forEach(item => {
        miniMapCtx.fillStyle = PALETTE.loot;
        miniMapCtx.fillRect(item.x * scale - 1, item.y * scale - 1, 2, 2);
    });
    
    // Camera view indicator
    miniMapCtx.strokeStyle = 'rgba(255,255,255,0.5)';
    miniMapCtx.strokeRect(camera.x * scale, camera.y * scale, canvas.width * scale, canvas.height * scale);
}

function renderZoneTimer() {
    const canvas = document.getElementById('zoneCanvas');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 25;
    
    zoneCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background circle
    zoneCtx.beginPath();
    zoneCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    zoneCtx.fillStyle = 'rgba(0,0,0,0.5)';
    zoneCtx.fill();
    
    // Zone progress
    const progress = zone.shrinkProgress;
    zoneCtx.beginPath();
    zoneCtx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    zoneCtx.lineWidth = 6;
    zoneCtx.strokeStyle = progress < 0.5 ? PALETTE.zone : PALETTE.zoneDanger;
    zoneCtx.stroke();
    
    // Time text
    zoneCtx.fillStyle = '#fff';
    zoneCtx.font = '10px Arial';
    zoneCtx.textAlign = 'center';
    zoneCtx.fillText(Math.ceil(zone.timeToShrink), centerX, centerY + 3);
}

function updateUI() {
    // Health bar
    const healthPct = localPlayer.health / localPlayer.maxHealth;
    document.getElementById('healthFill').style.width = (healthPct * 100) + '%';
    
    // Armor bar
    const armorPct = localPlayer.armor / localPlayer.maxArmor;
    document.getElementById('armorFill').style.width = (armorPct * 100) + '%';
    
    // Timer
    const mins = Math.floor(gameTime / 60);
    const secs = Math.floor(gameTime % 60);
    document.getElementById('timer').textContent = `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
    
    // Inventory
    const slots = document.querySelectorAll('.slot');
    localPlayer.inventory.forEach((item, i) => {
        if (item) {
            slots[i].innerHTML = `<span>${item.icon}</span><span class="count">${item.count || ''}</span>`;
        } else {
            slots[i].innerHTML = `<span>${['🔫','🛡️','💊','💥','📦','🔑','⚡','💎'][i]}</span><span class="count"></span>`;
        }
        slots[i].classList.toggle('active', i === localPlayer.selectedSlot);
    });
    
    // Kill feed
    const feed = document.getElementById('killFeed');
    feed.innerHTML = killFeed.map((msg, i) => `<div class="killMsg" style="opacity:${1 - i * 0.2}">${msg}</div>`).join('');
}

function addKillFeed(msg) {
    killFeed.unshift(msg);
    if (killFeed.length > 5) killFeed.pop();
}

function spawnLootOnDeath(player) {
    const types = ['ammo', 'armor', 'health', 'grenade'];
    for (let i = 0; i < 3; i++) {
        loot.push(new LootItem(
            player.x + (Math.random() - 0.5) * 40,
            player.y + (Math.random() - 0.5) * 40,
            Math.floor(Math.random() * 4)
        ));
    }
}

function createDeathParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y, color));
    }
    audio.play('explosion');
}

function gameOver(victory) {
    gameState = 'gameover';
    
    const overDiv = document.getElementById('gameOver');
    const title = overDiv.querySelector('h1');
    title.textContent = victory ? 'VICTORY ROYALE!' : 'ELIMINATED';
    title.className = victory ? 'victory' : 'defeat';
    
    document.getElementById('survivalTime').textContent = 
        `${Math.floor(gameTime / 60).toString().padStart(2,'0')}:${Math.floor(gameTime % 60).toString().padStart(2,'0')}`;
    document.getElementById('finalKills').textContent = localPlayer.kills;
    document.getElementById('finalDamage').textContent = localPlayer.damageDealt;
    
    // Update high score
    const score = localPlayer.score + Math.floor(gameTime * 10) + localPlayer.kills * 50;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('br_highscore', highScore);
        document.getElementById('highScoreVal').textContent = highScore;
    }
    
    overDiv.style.display = 'flex';
    audio.play(victory ? 'victory' : 'defeat');
}

// Start the render loop for menu
function menuLoop() {
    if (gameState === 'menu') {
        ctx.fillStyle = PALETTE.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Animated background
        const t = performance.now() * 0.001;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(
                canvas.width / 2 + Math.sin(t + i) * 200,
                canvas.height / 2 + Math.cos(t * 0.7 + i) * 150,
                50 + Math.sin(t * 0.5 + i) * 30,
                0, Math.PI * 2
            );
            ctx.fillStyle = `hsla(${t * 50 + i * 70}, 80%, 50%, 0.1)`;
            ctx.fill();
        }
        requestAnimationFrame(menuLoop);
    }
}
menuLoop();