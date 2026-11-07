const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score-display');
const comboEl = document.getElementById('combo-display');
const timerEl = document.getElementById('timer-display');
const highscoreEl = document.getElementById('highscore-display');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayStats = document.getElementById('overlay-stats');
const startScreen = document.getElementById('start-screen');
const restartBtn = document.getElementById('restart-btn');
const startBtn = document.getElementById('start-btn');

// --- CONFIG & PALETTE ---
const CONFIG = {
    beatInterval: 0.6, // seconds
    lookahead: 0.1,
    scheduleAhead: 0.2,
    maxSpeed: 800,
    acceleration: 2000,
    friction: 1800,
    snapThreshold: 40,
    snapRadius: 20,
    perfectDist: 15,
    goodDist: 40,
    componentSpeed: 300,
    spawnRate: 1 // per beat
};

const COLORS = {
    bg: '#05050a',
    grid: '#1a1a2e',
    cursor: '#00f2ff',
    cursorCore: '#ffffff',
    slotEmpty: '#333344',
    slotFill: '#00ff9f',
    miss: '#ff0055',
    perfect: '#00f2ff',
    good: '#ffcc00',
    text: '#00f2ff',
    comboHigh: '#ff00ff'
};

// --- STATE ---
let audioCtx = null;
let isRunning = false;
let isStarted = false;
let lastBeatTime = 0;
let nextBeatTime = 0;
let timerStart = 0;
let elapsedTime = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem('rhythm_highscore') || '0', 10);
let combo = 0;
let instrumentIndex = 0;
let componentsPlaced = 0;
let totalSlots = 4;

highscoreEl.textContent = highScore;

const keys = {};
const mouse = { x: 0, y: 0, down: false };
const touch = { x: 0, y: 0, active: false };

// --- AUDIO ---
const Audio = {
    ctx: null,
    masterGain: null,
    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);
    },
    play(type, time = null) {
        if (!this.ctx) return;
        const t = time || this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);

        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);

        if (type === 'place') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        } else if (type === 'miss') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
            gain.gain.setValueAtTime(0.2, now);
        } else if (type === 'beat') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(100, now);
            gain.gain.setValueAtTime(0.05, now);
        }
    }
};

// --- CLASSES ---
class Vector {
    constructor(x, y) { this.x = x; this.y = y; }
    add(v) { return new Vector(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vector(this.x - v.x, this.y - v.y); }
    mult(n) { return new Vector(this.x * n, this.y * n); }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() { const m = this.mag(); return m === 0 ? new Vector(0,0) : new Vector(this.x/m, this.y/m); }
    dist(v) { return Math.sqrt((this.x-v.x)**2 + (this.y-v.y)**2); }
}

class Particle {
    constructor(x, y, color) {
        this.pos = new Vector(x, y);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.vel = new Vector(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.015;
        this.color = color;
    }
    update() {
        this.pos = this.pos.add(this.vel);
        this.life -= this.decay;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Component {
    constructor(type, x, y, targetX, targetY) {
        this.type = type; // 'strings', 'drums', 'keys', 'cymbals'
        this.pos = new Vector(x, y);
        this.target = new Vector(targetX, targetY);
        this.vel = this.target.sub(this.pos).normalize().mult(CONFIG.componentSpeed);
        this.radius = 15;
        this.grabbed = false;
        this.offset = new Vector(0,0);
        this.floatOffset = Math.random() * Math.PI * 2;
    }
    update(dt) {
        if (!this.grabbed) {
            this.pos = this.pos.add(this.vel.mult(dt));
            // float
            this.pos.y += Math.sin(Date.now() * 0.005 + this.floatOffset) * 0.5;
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.globalAlpha = this.grabbed ? 0.6 : 1;
        ctx.strokeStyle = COLORS.cursor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        if (this.type === 'strings') {
            ctx.beginPath();
            ctx.moveTo(-8, -15); ctx.lineTo(-8, 15);
            ctx.moveTo(0, -15); ctx.lineTo(0, 15);
            ctx.moveTo(8, -15); ctx.lineTo(8, 15);
            ctx.stroke();
        } else if (this.type === 'drums') {
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI*2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI*2);
            ctx.stroke();
        } else if (this.type === 'keys') {
            ctx.strokeRect(-10, -10, 20, 20);
            ctx.beginPath(); ctx.moveTo(-5, -10); ctx.lineTo(-5, 10); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(5, -10); ctx.lineTo(5, 10); ctx.stroke();
        } else if (this.type === 'cymbals') {
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI);
            ctx.stroke();
        }
        ctx.restore();
    }
}

class Slot {
    constructor(x, y, type) {
        this.pos = new Vector(x, y);
        this.type = type;
        this.filled = false;
        this.flash = 0;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
        ctx.strokeStyle = this.filled ? COLORS.slotFill : COLORS.slotEmpty;
        ctx.lineWidth = this.filled ? 4 : 2;
        ctx.globalAlpha = this.filled ? 1 : 0.4 + pulse * 0.3;
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.stroke();
        if (this.flash > 0) {
            ctx.fillStyle = COLORS.perfect;
            ctx.globalAlpha = this.flash;
            ctx.beginPath();
            ctx.arc(0, 0, 10 * this.flash, 0, Math.PI * 2);
            ctx.fill();
            this.flash -= 0.05;
        }
        ctx.restore();
    }
}

class Cursor {
    constructor() {
        this.pos = new Vector(canvas.width / 2, canvas.height / 2);
        this.vel = new Vector(0, 0);
        this.radius = 12;
        this.trail = [];
    }
    update(dt, slots, components) {
        // Input
        let ax = 0, ay = 0;
        if (keys['ArrowUp'] || keys['w']) ay = -1;
        if (keys['ArrowDown'] || keys['s']) ay = 1;
        if (keys['ArrowLeft'] || keys['a']) ax = -1;
        if (keys['ArrowRight'] || keys['d']) ax = 1;

        // Normalize diagonal
        if (ax !== 0 || ay !== 0) {
            const len = Math.sqrt(ax*ax + ay*ay);
            ax /= len; ay /= len;
        }

        this.vel.x += ax * CONFIG.acceleration * dt;
        this.vel.y += ay * CONFIG.acceleration * dt;

        // Mouse drag override
        if (mouse.down && !touch.active) {
            this.vel.x = (mouse.x - this.pos.x) * 10;
            this.vel.y = (mouse.y - this.pos.y) * 10;
        } else if (touch.active) {
            this.vel.x = (touch.x - this.pos.x) * 10;
            this.vel.y = (touch.y - this.pos.y) * 10;
        }

        // Friction
        this.vel.x *= (1 - CONFIG.friction * dt);
        this.vel.y *= (1 - CONFIG.friction * dt);

        // Cap speed
        const speed = Math.sqrt(this.vel.x**2 + this.vel.y**2);
        if (speed > CONFIG.maxSpeed) {
            this.vel.x = (this.vel.x / speed) * CONFIG.maxSpeed;
            this.vel.y = (this.vel.y / speed) * CONFIG.maxSpeed;
        }

        this.pos = this.pos.add(this.vel.mult(dt));

        // Trail
        this.trail.push({x: this.pos.x, y: this.pos.y, alpha: 1});
        if (this.trail.length > 10) this.trail.shift();
        this.trail.forEach(t => t.alpha -= 0.1);
        this.trail = this.trail.filter(t => t.alpha > 0);

        // Magnetic Snapping
        let snapped = false;
        for (let slot of slots) {
            if (!slot.filled) {
                const d = this.pos.dist(slot.pos);
                if (d < CONFIG.snapThreshold) {
                    const dir = slot.pos.sub(this.pos).normalize();
                    const force = (CONFIG.snapThreshold - d) / CONFIG.snapThreshold;
                    this.vel.x += dir.x * force * 500 * dt;
                    this.vel.y += dir.y * force * 500 * dt;
                    if (d < CONFIG.snapRadius) {
                        this.pos.x = slot.pos.x;
                        this.pos.y = slot.pos.y;
                        this.vel.x = 0;
                        this.vel.y = 0;
                        snapped = true;
                    }
                }
            }
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        // Trail
        ctx.globalCompositeOperation = 'lighter';
        this.trail.forEach(t => {
            ctx.fillStyle = `rgba(0, 242, 255, ${t.alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(t.x - this.pos.x, t.y - this.pos.y, 4, 0, Math.PI*2);
            ctx.fill();
        });
        // Ring
        ctx.strokeStyle = COLORS.cursor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        // Core
        ctx.fillStyle = COLORS.cursorCore;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// --- GAME OBJECTS ---
const cursor = new Cursor();
const particles = [];
let slots = [];
let components = [];
let beatPulseRadius = 0;
let beatPulseMax = 0;
let beatActive = false;

function initSlots() {
    slots = [];
    const types = ['strings', 'drums', 'keys', 'cymbals'];
    const radius = 120;
    const count = totalSlots;
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = canvas.width / 2 + Math.cos(angle) * radius;
        const y = canvas.height / 2 + Math.sin(angle) * radius;
        slots.push(new Slot(x, y, types[i % types.length]));
    }
}

function spawnComponent() {
    const types = ['strings', 'drums', 'keys', 'cymbals'];
    const type = types[Math.floor(Math.random() * types.length)];
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = -30; y = Math.random() * canvas.height; }
    else if (side === 1) { x = canvas.width + 30; y = Math.random() * canvas.height; }
    else if (side === 2) { x = Math.random() * canvas.width; y = -30; }
    else { x = Math.random() * canvas.width; y = canvas.height + 30; }
    components.push(new Component(type, x, y, canvas.width/2, canvas.height/2));
}

function checkAssembly() {
    // Check cursor against slots
    for (let slot of slots) {
        if (!slot.filled) {
            const d = cursor.pos.dist(slot.pos);
            if (d < CONFIG.snapRadius) {
                // Find matching component near cursor
                for (let i = components.length - 1; i >= 0; i--) {
                    const comp = components[i];
                    if (!comp.grabbed && comp.pos.dist(cursor.pos) < 40) {
                        if (comp.type === slot.type) {
                            // Success
                            slot.filled = true;
                            slot.flash = 1;
                            components.splice(i, 1);
                            componentsPlaced++;
                            const distBonus = d < CONFIG.perfectDist ? 100 : 50;
                            const comboMult = 1 + Math.floor(combo / 10) * 0.1;
                            score += Math.floor(distBonus * comboMult);
                            combo++;
                            Audio.play('place');
                            for(let j=0; j<10; j++) particles.push(new Particle(slot.pos.x, slot.pos.y, COLORS.perfect));
                            updateHUD();
                            checkInstrumentComplete();
                            return;
                        }
                    }
                }
            }
        }
    }
}

function checkInstrumentComplete() {
    const filled = slots.filter(s => s.filled).length;
    if (filled === totalSlots) {
        instrumentIndex++;
        totalSlots = Math.min(8, totalSlots + 2);
        componentsPlaced = 0;
        initSlots();
    }
}

function handleMiss() {
    combo = 0;
    score = Math.max(0, score - 20);
    Audio.play('miss');
    for(let j=0; j<5; j++) particles.push(new Particle(canvas.width/2, canvas.height/2, COLORS.miss));
    updateHUD();
}

function updateHUD() {
    scoreEl.textContent = score;
    comboEl.textContent = combo;
    comboEl.style.color = combo >= 10 ? COLORS.comboHigh : COLORS.text;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('rhythm_highscore', highScore.toString());
        highscoreEl.textContent = highScore;
    }
}

// --- AUDIO SCHEDULER ---
function scheduleBeat(beatTime) {
    if (audioCtx && audioCtx.state === 'running') {
        Audio.play('beat', beatTime);
    }
}

function audioLoop() {
    if (!isRunning || !audioCtx) return;
    const currentTime = audioCtx.currentTime;
    while (nextBeatTime < currentTime + CONFIG.scheduleAhead) {
        scheduleBeat(nextBeatTime);
        lastBeatTime = nextBeatTime;
        nextBeatTime += CONFIG.beatInterval;
        // Trigger visual pulse
        beatPulseMax = 300;
        beatPulseRadius = 0;
        beatActive = true;
        // Check miss if no assembly happened by beat time
        // We check assembly on click/drag, but if beat passes and slot empty, it's a miss
        // Simple logic: if beat happens and any slot empty, it's a miss for that beat?
        // Spec: "Miss: Beat pulse reaches center without assembly"
        // We will trigger miss if no successful assembly occurred exactly at beat.
        // For simplicity, we check if any component is currently being held over a slot?
        // Let's just mark beatActive and let the frame logic handle miss if no placement.
        // Actually, let's trigger miss if no slot was filled in the last beat window.
        // Simplified: If beat happens, check if any slot was filled recently? No.
        // Let's just say: if beat happens, and player hasn't placed anything this beat, it's a miss.
        // We track 'placedThisBeat'.
    }
    requestAnimationFrame(audioLoop);
}

let placedThisBeat = false;

function gameLoop(timestamp) {
    if (!isRunning) return;
    const dt = Math.min(0.1, (timestamp - lastFrame) / 1000);
    lastFrame = timestamp;

    // Timer
    if (timerStart) {
        elapsedTime = timestamp - timerStart;
        const ms = elapsedTime % 1000;
        const s = Math.floor(elapsedTime / 1000) % 60;
        const m = Math.floor(elapsedTime / 60000);
        timerEl.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}.${Math.floor(ms/10).toString().padStart(2,'0')}`;
    }

    // Beat Pulse Visual
    if (beatActive) {
        beatPulseRadius += 1000 * dt;
        if (beatPulseRadius >= beatPulseMax) {
            beatActive = false;
            if (!placedThisBeat) {
                handleMiss();
            }
            placedThisBeat = false;
        }
    }

    cursor.update(dt, slots, components);

    // Update components
    for (let i = components.length -1; i >= 0; i--) {
        const comp = components[i];
        comp.update(dt);
        if (comp.pos.x < -100 || comp.pos.x > canvas.width + 100 || comp.pos.y < -100 || comp.pos.y > canvas.height + 100) {
            components.splice(i, 1);
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    // Draw
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); }
    for (let y = 0; y < canvas.height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); }
    ctx.stroke();

    // Beat pulse
    if (beatActive) {
        ctx.strokeStyle = `rgba(0, 242, 255, ${1 - beatPulseRadius/beatPulseMax})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvas.width/2, canvas.height/2, beatPulseRadius, 0, Math.PI*2);
        ctx.stroke();
    }

    // Slots
    for (let slot of slots) slot.draw(ctx);

    // Components
    for (let comp of components) comp.draw(ctx);

    // Cursor
    cursor.draw(ctx);

    // Particles
    for (let p of particles) p.draw(ctx);

    lastFrame = timestamp;
    requestAnimationFrame(gameLoop);
}

let lastFrame = 0;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initSlots();
}
window.addEventListener('resize', resize);
resize();

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

canvas.addEventListener('mousedown', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.down = true;
    if (!isRunning && !isStarted) {
        startGame();
    }
});

window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mouseup', () => mouse.down = false);

canvas.addEventListener('touchstart', e => {
    touch.x = e.touches[0].clientX;
    touch.y = e.touches[0].clientY;
    touch.active = true;
    if (!isRunning && !isStarted) startGame();
}, {passive: false});

window.addEventListener('touchmove', e => {
    touch.x = e.touches[0].clientX;
    touch.y = e.touches[0].clientY;
}, {passive: false});

window.addEventListener('touchend', () => touch.active = false);

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    startGame();
});

function startGame() {
    if (isStarted) return;
    isStarted = true;
    isRunning = true;
    startScreen.classList.add('hidden');
    overlay.classList.add('hidden');
    Audio.init();
    audioCtx = Audio.ctx;
    audioCtx.resume();
    lastBeatTime = audioCtx.currentTime;
    nextBeatTime = lastBeatTime + CONFIG.beatInterval;
    timerStart = performance.now();
    elapsedTime = 0;
    score = 0;
    combo = 0;
    instrumentIndex = 0;
    totalSlots = 4;
    componentsPlaced = 0;
    highscoreEl.textContent = highScore;
    updateHUD();
    initSlots();
    components = [];
    particles = [];
    lastFrame = performance.now();
    placedThisBeat = false;
    requestAnimationFrame(gameLoop);
    requestAnimationFrame(audioLoop);
}

gameLoop(0);
