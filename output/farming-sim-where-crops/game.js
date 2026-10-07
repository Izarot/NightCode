const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Audio Context
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;
function initAudio() { if (!audioCtx) audioCtx = new AudioCtx(); }
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

// Game State
const GRID_COLS = 20, GRID_ROWS = 15, TILE = 32;
let grid = [];
let farmer = { x: 320, y: 240, vx: 0, vy: 0, facing: 0, moving: false, plantMode: false };
let resources = { lp: 100, cycles: 0, debug: 5 };
let highScore = parseInt(localStorage.getItem('codefarmer_hs') || '0');
let speedrunStart = Date.now();
let dayTime = 0;
let particles = [];
let input = { up: false, down: false, left: false, right: false };

// Snippet Library
const snippets = [
    { id: 0, code: "return 'carrot';", cp: 1, name: 'Carrot Seed' },
    { id: 1, code: "return 'wheat';", cp: 1, name: 'Wheat Seed' },
    { id: 2, code: "return Math.random()>0.5?'carrot':'wheat';", cp: 2, name: 'Mixed Crop' },
    { id: 3, code: "for(let i=0;i<3;i++)yield i; return 'potato';", cp: 3, name: 'Potato Loop' },
    { id: 4, code: "return Math.floor(Math.random()*10)>5?'gold':'iron';", cp: 4, name: 'Ore Finder' },
    { id: 5, code: "if(Math.random()>0.8)throw 'disease'; return 'tomato';", cp: 3, name: 'Risky Tomato' }
];

// Sandbox Compiler
function compileSnippet(code) {
    const blocked = /function|var|let|const|eval|constructor|prototype|import|export|require|process|window|document/i;
    if (blocked.test(code)) return { error: 'Blocked keyword detected' };
    try {
        const fn = new Function('Math', 'return ' + code.replace(/yield/g, 'return'));
        const result = fn({ random: Math.random, floor: Math.floor, abs: Math.abs });
        return { success: true, output: result };
    } catch (e) {
        return { error: e.message };
    }
}

// Plot Class
class Plot {
    constructor(x, y) {
        this.x = x; this.y = y; this.tilled = false; this.moisture = 0;
        this.snippet = null; this.compileTimer = 0; this.stage = 0; // 0=empty, 1=seedling, 2=sprout, 3=mature, 4=overgrown
        this.watered = 0;
    }
    update(dt) {
        if (this.stage === 4) return; // Overgrown, blocked
        if (this.snippet && this.compileTimer > 0) {
            const moistureMod = 1 - (this.moisture / 200);
            this.compileTimer -= dt * moistureMod;
            if (this.compileTimer <= 0) this.mature();
        }
        if (this.moisture > 0 && !this.snippet) this.moisture -= dt * 0.5;
        if (this.snippet && this.stage < 4 && Date.now() - this.watered > 30000) {
            this.stage = 4; // Overgrown from neglect
        }
    }
    mature() {
        this.stage = 3;
        const result = compileSnippet(this.snippet.code);
        if (result.success) {
            resources.lp += 10;
            resources.cycles += 5;
            spawnParticles(this.x, this.y, '#00d9ff', 10);
            playSound(800, 'sine', 0.2);
        } else {
            spawnParticles(this.x, this.y, '#ff4444', 5);
            playSound(100, 'sawtooth', 0.3);
        }
        this.watered = Date.now();
    }
    draw(ctx) {
        const sx = this.x * TILE, sy = this.y * TILE;
        // Soil
        ctx.fillStyle = this.tilled ? '#8b6f47' : '#5c4033';
        ctx.fillRect(sx, sy, TILE, TILE);
        // Moisture
        if (this.moisture > 0) {
            ctx.fillStyle = `rgba(0,100,200,${this.moisture/200})`;
            ctx.fillRect(sx, sy, TILE, TILE);
        }
        // Plant
        if (this.snippet && this.stage > 0) {
            const colors = ['#50fa7b', '#f1fa8c', '#ff79c6', '#bd93f9'];
            ctx.fillStyle = colors[this.stage - 1];
            const h = this.stage * 8;
            ctx.fillRect(sx + 12, sy + 16 - h, 8, h);
            // Code glyph
            ctx.fillStyle = '#fff';
            ctx.font = '8px monospace';
            ctx.fillText(this.snippet.code.substring(0, 3), sx + 4, sy + 12);
        }
        // Compile timer
        if (this.snippet && this.compileTimer > 0) {
            const pct = this.compileTimer / 8;
            ctx.strokeStyle = '#00d9ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx + 16, sy + 16, 14, -Math.PI/2, -Math.PI/2 + Math.PI*2*(1-pct));
            ctx.stroke();
        }
    }
}

// Init
function init() {
    resizeCanvas();
    for (let y = 0; y < GRID_ROWS; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_COLS; x++) {
            grid[y][x] = new Plot(x, y);
        }
    }
    loop();
}

function resizeCanvas() {
    const container = document.getElementById('game-container');
    const w = window.innerWidth, h = window.innerHeight;
    const ratio = Math.min(w / 1280, h / 720);
    canvas.width = 1280; canvas.height = 720;
    canvas.style.width = (1280 * ratio) + 'px';
    canvas.style.height = (720 * ratio) + 'px';
}

// Input
window.addEventListener('keydown', e => {
    if (e.key === 'w' || e.key === 'ArrowUp') input.up = true;
    if (e.key === 's' || e.key === 'ArrowDown') input.down = true;
    if (e.key === 'a' || e.key === 'ArrowLeft') input.left = true;
    if (e.key === 'd' || e.key === 'ArrowRight') input.right = true;
    if (e.key === 'e') togglePlantMode();
    if (e.key === '1') useTool(0);
    if (e.key === '2') useTool(1);
    if (e.key === '3') useTool(2);
    if (e.key === '4') useTool(3);
    if (e.key === '5') useTool(4);
    initAudio();
});
window.addEventListener('keyup', e => {
    if (e.key === 'w' || e.key === 'ArrowUp') input.up = false;
    if (e.key === 's' || e.key === 'ArrowDown') input.down = false;
    if (e.key === 'a' || e.key === 'ArrowLeft') input.left = false;
    if (e.key === 'd' || e.key === 'ArrowRight') input.right = false;
});

function togglePlantMode() {
    farmer.plantMode = !farmer.plantMode;
    document.getElementById('left-panel').classList.toggle('hidden', !farmer.plantMode);
}

function useTool(tool) {
    const gx = Math.floor(farmer.x / TILE);
    const gy = Math.floor(farmer.y / TILE);
    const plot = grid[gy]?.[gx];
    if (!plot) return;
    if (tool === 0) { // Hoe
        plot.tilled = !plot.tilled;
        if (plot.tilled) plot.moisture = 50;
    }
    if (tool === 1 && plot.tilled) { // Water
        plot.moisture = Math.min(100, plot.moisture + 25);
        plot.watered = Date.now();
        spawnParticles(gx * TILE, gy * TILE, '#4488ff', 5);
        playSound(400, 'sine', 0.1);
    }
    if (tool === 2 && plot.tilled) { // Fertilize
        plot.moisture = Math.min(100, plot.moisture + 30);
    }
    if (tool === 3) { // Debug
        if (plot.snippet && plot.stage === 0) {
            const res = compileSnippet(plot.snippet.code);
            if (res.error) {
                resources.debug--;
                spawnParticles(gx * TILE, gy * TILE, '#ffb86c', 8);
            }
        }
    }
    if (tool === 4 && plot.stage === 3) { // Harvest
        plot.snippet = null; plot.stage = 0; plot.moisture = 50;
        resources.lp += 15;
        spawnParticles(gx * TILE, gy * TILE, '#50fa7b', 15);
        playSound(600, 'sine', 0.15);
    }
}

// Physics
function updateFarmer(dt) {
    if (farmer.plantMode) { farmer.vx = 0; farmer.vy = 0; return; }
    let ax = 0, ay = 0;
    if (input.up) ay = -0.8;
    if (input.down) ay = 0.8;
    if (input.left) ax = -0.8;
    if (input.right) ax = 0.8;
    
    // Diagonal normalization
    if (ax !== 0 && ay !== 0) { ax /= Math.SQRT2; ay /= Math.SQRT2; }
    
    farmer.vx += ax;
    farmer.vy += ay;
    farmer.vx *= 0.95; // Friction
    farmer.vy *= 0.95;
    
    // Max velocity
    const maxV = 4;
    const speed = Math.sqrt(farmer.vx * farmer.vx + farmer.vy * farmer.vy);
    if (speed > maxV) { farmer.vx = (farmer.vx/speed)*maxV; farmer.vy = (farmer.vy/speed)*maxV; }
    
    // Collision
    const newX = farmer.x + farmer.vx;
    const newY = farmer.y + farmer.vy;
    const gx = Math.floor(newX / TILE);
    const gy = Math.floor(newY / TILE);
    
    if (gx >= 0 && gx < GRID_COLS && gy >= 0 && gy < GRID_ROWS) {
        const plot = grid[gy][gx];
        if (!plot.tilled || (plot.snippet && plot.stage < 3)) {
            // Blocked by untilled or growing plant
        } else {
            farmer.x = newX;
            farmer.y = newY;
        }
    }
    
    farmer.x = Math.max(16, Math.min(GRID_COLS * TILE - 16, farmer.x));
    farmer.y = Math.max(16, Math.min(GRID_ROWS * TILE - 16, farmer.y));
    
    // Planting
    if (input.up && grid[gy]?.[gx]?.tilled && !grid[gy][gx].snippet && resources.lp >= 2) {
        const snippet = snippets[0]; // Simple default
        grid[gy][gx].snippet = snippet;
        grid[gy][gx].compileTimer = 8;
        grid[gy][gx].stage = 1;
        resources.lp -= snippet.cp;
        playSound(200, 'square', 0.1);
    }
}

// Particles
function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y, vx: (Math.random()-0.5)*4, vy: -Math.random()*3-1,
            life: 30 + Math.random()*20, color, size: 2 + Math.random()*3
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.1;
        p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// Day/Night
function updateDayNight(dt) {
    dayTime += dt * 0.0001; // 10 min real time = 1 day
    if (dayTime > 1) dayTime = 0;
}

// Render
function draw() {
    // Clear
    ctx.fillStyle = '#1a1b26';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Day/Night overlay
    const nightAlpha = Math.sin(dayTime * Math.PI) * 0.3;
    ctx.fillStyle = `rgba(20,20,50,${nightAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid
    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            grid[y][x].draw(ctx);
        }
    }
    
    // Farmer
    ctx.fillStyle = '#f8f8f2';
    ctx.fillRect(farmer.x - 8, farmer.y - 8, 16, 16);
    // Eyes
    ctx.fillStyle = '#00d9ff';
    ctx.fillRect(farmer.x + (farmer.vx > 0 ? 2 : -2), farmer.y - 4, 3, 3);
    
    // Particles
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 50;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
    
    // Update UI
    document.getElementById('lp').textContent = resources.lp;
    document.getElementById('debug').textContent = resources.debug;
    document.getElementById('day').textContent = Math.floor(dayTime * 10) + 1;
    const elapsed = Math.floor((Date.now() - speedrunStart) / 1000);
    document.getElementById('speedrun').textContent = `${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`;
}

// Main Loop
let lastTime = 0;
function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    updateFarmer(dt);
    updateParticles();
    updateDayNight(dt);
    // Update plots
    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            grid[y][x].update(dt);
        }
    }
    draw();
    requestAnimationFrame(loop);
}

// Save High Score
window.addEventListener('beforeunload', () => {
    if (resources.lp > highScore) {
        localStorage.setItem('codefarmer_hs', resources.lp.toString());
    }
});

window.addEventListener('resize', resizeCanvas);
init();