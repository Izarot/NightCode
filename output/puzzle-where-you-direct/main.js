const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = {
    isRunning: true,
    timeRemaining: 60,
    activeLoadCounter: 0,
    totalLights: 12,
    lastTime: 0,
    player: { x: 400, y: 300, speed: 5 },
    keys: {},
    wires: [],
    lights: [],
    sources: []
};

function init() {
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', e => gameState.keys[e.code] = true);
    window.addEventListener('keyup', e => gameState.keys[e.code] = false);
    canvas.addEventListener('mousedown', handleMouseDown);

    // Generate Lights
    for(let i=0; i<gameState.totalLights; i++) {
        gameState.lights.push({ x: Math.random()*(canvas.width-100)+50, y: Math.random()*(canvas.height-100)+50, on: false });
    }
    // Generate Sources
    for(let i=0; i<3; i++) {
        gameState.sources.push({ x: Math.random()*(canvas.width-100)+50, y: Math.random()*(canvas.height-100)+50 });
    }

    requestAnimationFrame(gameLoop);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    // Simple wire placement: connect player to click
    gameState.wires.push({
        x1: gameState.player.x, y1: gameState.player.y,
        x2: mx, y2: my
    });

    // Check if wire hits a light
    gameState.lights.forEach(l => {
        if (distToSegment({x: l.x, y: l.y}, {x: mx, y: my}, {x: gameState.player.x, y: gameState.player.y}) < 10) {
            l.on = true;
        }
    });
}

function distToSegment(p, v, w) {
    const l2 = Math.pow(v.x - w.x, 2) + Math.pow(v.y - w.y, 2);
    if (l2 == 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

function update(dt) {
    if (!gameState.isRunning) return;
    
    if (gameState.keys['ArrowUp'] || gameState.keys['KeyW']) gameState.player.y -= gameState.player.speed;
    if (gameState.keys['ArrowDown'] || gameState.keys['KeyS']) gameState.player.y += gameState.player.speed;
    if (gameState.keys['ArrowLeft'] || gameState.keys['KeyA']) gameState.player.x -= gameState.player.speed;
    if (gameState.keys['ArrowRight'] || gameState.keys['KeyD']) gameState.player.x += gameState.player.speed;

    gameState.timeRemaining -= dt / 1000;
    if (gameState.timeRemaining <= 0) gameState.isRunning = false;

    const litCount = gameState.lights.filter(l => l.on).length;
    gameState.activeLoadCounter = litCount;

    document.getElementById('timerDisplay').textContent = Math.max(0, Math.ceil(gameState.timeRemaining)) + 's';
    document.getElementById('activeLoadCounter').textContent = `${litCount}/${gameState.totalLights}`;
}

function draw() {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Wires
    ctx.strokeStyle = '#00b4d8';
    ctx.lineWidth = 3;
    gameState.wires.forEach(w => {
        ctx.beginPath();
        ctx.moveTo(w.x1, w.y1);
        ctx.lineTo(w.x2, w.y2);
        ctx.stroke();
    });

    // Draw Sources
    ctx.fillStyle = '#ffd700';
    gameState.sources.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 15, 0, Math.PI*2);
        ctx.fill();
    });

    // Draw Lights
    gameState.lights.forEach(l => {
        ctx.fillStyle = l.on ? '#fff8cc' : '#333';
        ctx.beginPath();
        ctx.arc(l.x, l.y, 12, 0, Math.PI*2);
        ctx.fill();
        if (l.on) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffd700';
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
    });

    // Draw Player
    ctx.fillStyle = '#00f5ff';
    ctx.beginPath();
    ctx.arc(gameState.player.x, gameState.player.y, 10, 0, Math.PI*2);
    ctx.fill();
}

function gameLoop(timestamp) {
    const dt = timestamp - gameState.lastTime;
    gameState.lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}

init();