const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let audioCtx;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playSound(freq, duration, type = 'sine') {
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

let state = {
    coins: 0,
    growth: 0,
    stage: 0,
    tapPower: 1,
    growthMultiplier: 1,
    autoTaps: 0,
    highScore: parseInt(localStorage.getItem('treeTapperHigh') || '0'),
    startTime: Date.now(),
    elapsed: 0,
    particles: [],
    floatingTexts: [],
    pulseScale: 1,
    sway: 0
};

const stages = [
    { name: 'Seedling', req: 0, leaves: 2, trunkH: 20, color: '#8B4513' },
    { name: 'Sapling', req: 100, leaves: 4, trunkH: 40, color: '#654321' },
    { name: 'Young Tree', req: 250, leaves: 8, trunkH: 60, color: '#5D3A1A' },
    { name: 'Mature Tree', req: 500, leaves: 15, trunkH: 80, color: '#4A2C17' },
    { name: 'Ancient Tree', req: 1000, leaves: 25, trunkH: 100, color: '#3E2723' }
];

const production = [1, 2, 5, 10, 20];

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function getCoinRate() {
    return production[state.stage] * state.growthMultiplier;
}

function addGrowth(amount) {
    state.growth += amount;
    checkStageUp();
}

function checkStageUp() {
    for (let i = stages.length - 1; i >= 0; i--) {
        if (state.growth >= stages[i].req && i > state.stage) {
            state.stage = i;
            spawnSparkles();
            playSound(800, 0.2, 'square');
            setTimeout(() => playSound(1000, 0.3, 'square'), 100);
            document.getElementById('stage-text').textContent = stages[i].name;
            document.getElementById('stage-text').style.opacity = 1;
            setTimeout(() => document.getElementById('stage-text').style.opacity = 0, 1000);
            break;
        }
    }
}

function spawnSparkles() {
    for (let i = 0; i < 20; i++) {
        state.particles.push({
            x: canvas.width / 2,
            y: canvas.height * 0.6,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 5,
            life: 1,
            color: `hsl(${Math.random() * 60 + 40}, 100%, 50%)`
        });
    }
}

function tapTree(x, y) {
    initAudio();
    const treeX = canvas.width / 2;
    const treeY = canvas.height * 0.6;
    const dist = Math.hypot(x - treeX, y - treeY);
    if (dist < 100) {
        addGrowth(state.tapPower);
        state.pulseScale = 1.2;
        state.floatingTexts.push({ x, y: y - 20, text: `+${state.tapPower}`, life: 1 });
        state.coins += 0.1;
        playSound(400 + Math.random() * 200, 0.1);
    }
}

canvas.addEventListener('click', (e) => tapTree(e.clientX, e.clientY));
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    tapTree(touch.clientX, touch.clientY);
});

document.getElementById('tapPower').onclick = () => {
    if (state.coins >= 50) {
        state.coins -= 50;
        state.tapPower++;
        playSound(600, 0.1);
        updateButtons();
    }
};

document.getElementById('growthSpeed').onclick = () => {
    if (state.coins >= 100) {
        state.coins -= 100;
        state.growthMultiplier += 0.25;
        playSound(600, 0.1);
        updateButtons();
    }
};

document.getElementById('autoTapper').onclick = () => {
    if (state.coins >= 200) {
        state.coins -= 200;
        state.autoTaps++;
        playSound(600, 0.1);
        updateButtons();
    }
};

function updateButtons() {
    document.getElementById('tapPower').disabled = state.coins < 50;
    document.getElementById('growthSpeed').disabled = state.coins < 100;
    document.getElementById('autoTapper').disabled = state.coins < 200;
}

function update() {
    if (state.autoTaps > 0) {
        addGrowth(state.autoTaps * 0.1);
    }
    state.coins += getCoinRate() / 60;
    state.pulseScale += (1 - state.pulseScale) * 0.2;
    state.sway = Math.sin(Date.now() / 1000) * 2;
    state.particles = state.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= 0.02;
        return p.life > 0;
    });
    state.floatingTexts = state.floatingTexts.filter(t => {
        t.y -= 1;
        t.life -= 0.02;
        return t.life > 0;
    });
    state.elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    if (state.coins > state.highScore) {
        state.highScore = Math.floor(state.coins);
        localStorage.setItem('treeTapperHigh', state.highScore);
    }
    updateButtons();
}

function draw() {
    const width = canvas.width;
    const height = canvas.height;
    const stageData = stages[state.stage];
    const treeX = width / 2;
    const treeY = height * 0.6;
    const trunkH = stageData.trunkH;
    const trunkW = 16 + state.stage * 4;
    const canopyR = 35 + state.stage * 13;

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#101b3f');
    sky.addColorStop(0.65, '#263b70');
    sky.addColorStop(1, '#10182d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    for (let i = 0; i < 35; i++) {
        const x = (i * 97) % width;
        const y = (i * 53) % (height * 0.55);
        const r = (i % 3) + 0.5;
        ctx.globalAlpha = 0.25 + (i % 5) * 0.12;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#123f24';
    ctx.beginPath();
    ctx.ellipse(treeX, height * 0.88, width * 0.48, height * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(treeX, treeY + 8, canopyR * 1.15, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(treeX, treeY);
    ctx.scale(state.pulseScale, state.pulseScale);

    ctx.fillStyle = stageData.color;
    ctx.beginPath();
    ctx.moveTo(-trunkW / 2, 0);
    ctx.quadraticCurveTo(-trunkW * 0.28, -trunkH * 0.5, -trunkW * 0.12, -trunkH);
    ctx.lineTo(trunkW * 0.12, -trunkH);
    ctx.quadraticCurveTo(trunkW * 0.28, -trunkH * 0.5, trunkW / 2, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = stageData.color;
    ctx.lineWidth = Math.max(3, trunkW * 0.28);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -trunkH * 0.35);
    ctx.lineTo(-canopyR * 0.62, -trunkH * 0.78);
    ctx.moveTo(0, -trunkH * 0.5);
    ctx.lineTo(canopyR * 0.62, -trunkH * 0.86);
    ctx.moveTo(0, -trunkH * 0.65);
    ctx.lineTo(0, -trunkH * 1.08);
    ctx.stroke();

    for (let i = 0; i < stageData.leaves; i++) {
        const angle = i * 2.399963;
        const lx = Math.cos(angle) * canopyR * 0.68 + state.sway * (i % 2 ? 1 : -1);
        const ly = -trunkH + Math.sin(angle) * canopyR * 0.42 - canopyR * 0.08;
        const radius = canopyR * (0.34 + (i % 3) * 0.06);
        const green = 95 + (i % 4) * 18;

        ctx.fillStyle = `hsl(${105 + i % 20}, ${55 + i % 25}%, ${green}%)`;
        ctx.beginPath();
        ctx.arc(lx, ly, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,180,0.18)';
        ctx.beginPath();
        ctx.arc(lx - radius * 0.28, ly - radius * 0.3, radius * 0.38, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();

    for (const p of state.particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 + p.life * 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const text of state.floatingTexts) {
        ctx.globalAlpha = Math.max(0, text.life);
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ff9d00';
        ctx.shadowBlur = 10;
        ctx.fillText(text.text, text.x, text.y);
        ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'start';

    const minutes = String(Math.floor(state.elapsed / 60)).padStart(2, '0');
    const seconds = String(state.elapsed % 60).padStart(2, '0');
    document.getElementById('timer').textContent = `${minutes}:${seconds}`;
    document.getElementById('hud').textContent = `💰 ${Math.floor(state.coins)}  |  Best: ${state.highScore}`;

    let progress = 100;
    if (state.stage < stages.length - 1) {
        const current = stages[state.stage];
        const next = stages[state.stage + 1];
        progress = Math.max(0, Math.min(100, (state.growth - current.req) / (next.req - current.req) * 100));
    }
    document.getElementById('progress-bar').style.width = `${progress}%`;
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

updateButtons();
loop();
