const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const overlay = document.getElementById('overlay');
const nextBtn = document.getElementById('nextBtn');
const undoBtn = document.getElementById('undoBtn');
const hintBtn = document.getElementById('hintBtn');
const restartBtn = document.getElementById('restartBtn');

// --- Audio Engine ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type = 'ine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// --- Game Constants & State ---
const COLORS = {
    bg: '#16213e',
    accent: '#e9450f',
    seesaw: '#8d6e63',
    pivot: '#222',
    weights: ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93']
};

let gameState = {
    level: 0,
    score: 0,
    moves: 0,
    maxMoves: 5,
    startTime: 0,
    elapsedTime: 0,
    timerInterval: null,
    weights: [],
    placedWeights: [],
    seesawAngle: 0,
    angularVelocity: 0,
    pivotX: 0,
    pivotY: 0,
    seesawWidth: 400,
    isDragging: false,
    draggedWeight: null,
    dragX: 0,
    dragY: 0,
    highScore: localStorage.getItem('seesawHighScore') || 0,
    isBalanced: false
};

const levels = [
    { width: 400, weights: [3, 5, 7], maxMoves: 5 },
    { width: 350, weights: [2, 4, 6, 8], maxMoves: 6 },
    { width: 450, weights: [1, 3, 5, 7, 9], maxMoves: 7 }
];

// --- Physics Engine ---
function updatePhysics(dt) {
    if (gameState.isDragging) return;

    let netTorque = 0;
    let momentOfInertia = 0;
    const g = 9.81;
    const friction = 0.05;

    gameState.placedWeights.forEach(w => {
        const dist = w.x - gameState.pivotX;
        netTorque += w.mass * dist * g * 0.01;
        momentOfInertia += w.mass * Math.pow(dist, 2) * 0.01;
    });

    if (momentOfInertia > 0) {
        const angularAccel = netTorque / momentOfInertia;
        gameState.angularVelocity += angularAccel * dt;
        gameState.angularVelocity *= (1 - friction);
    }

    gameState.seesawAngle += gameState.angularVelocity * dt;
    
    // Clamp angle
    if (Math.abs(gameState.seesawAngle) > Math.PI / 3) {
        gameState.seesawAngle = Math.sign(gameState.seesawAngle) * Math.PI / 3;
        gameState.angularVelocity *= -0.5;
    }

    // Check Balance
    const isNowBalanced = Math.abs(gameState.seesawAngle) < 0.01;
    if (isNowBalanced &&!gameState.isBalanced) {
        gameState.isBalanced = true;
        playSound(660, 'triangle', 0.3);
        checkWin();
    } else if (!isNowBalanced) {
        gameState.isBalanced = false;
    }
}

// --- Rendering ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Pivot
    ctx.fillStyle = COLORS.pivot;
    ctx.beginPath();
    ctx.arc(gameState.pivotX, gameState.pivotY, 15, 0, Math.PI * 2);
    ctx.fill();

    // Draw Seesaw
    ctx.save();
    ctx.translate(gameState.pivotX, gameState.pivotY);
    ctx.rotate(gameState.seesawAngle);
    ctx.fillStyle = COLORS.seesaw;
    ctx.fillRect(-gameState.seesawWidth / 2, -5, gameState.seesawWidth, 10);
    
    // Draw Placed Weights
    gameState.placedWeights.forEach(w => {
        drawWeight(w.x - gameState.pivotX, w.y - gameState.pivotY, w.mass, w.color);
    });
    ctx.restore();

    // Draw Dragging Weight
    if (gameState.isDragging && gameState.draggedWeight) {
        drawWeight(gameState.dragX - gameState.pivotX, gameState.dragY - gameState.pivotY, gameState.draggedWeight.mass, gameState.draggedWeight.color);
    }

    // Draw Available Weights
    const weightY = canvas.height - 60;
    gameState.weights.forEach((m, i) => {
        const x = 60 + i * 60;
        drawWeight(x - gameState.pivotX, weightY - gameState.pivotY, m, COLORS.weights[i % COLORS.weights.length]);
    });

    // Balance Indicator
    if (gameState.isBalanced) {
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, gameState.pivotY);
        ctx.lineTo(canvas.width, gameState.pivotY);
        ctx.stroke();
    }
}

function drawWeight(relX, relY, mass, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(relX, relY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'iddle';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(mass + 'kg', relX, relY);
}

// --- Game Logic ---
function initLevel(idx) {
    const lvl = levels[idx];
    gameState.level = idx;
    gameState.weights = lvl.weights;
    gameState.maxMoves = lvl.maxMoves;
    gameState.placedWeights = [];
    gameState.seesawAngle = 0;
    gameState.angularVelocity = 0;
    gameState.isBalanced = false;
    gameState.moves = 0;
    gameState.elapsedTime = 0;
    
    updateHUD();
    overlay.classList.add('hidden');
    
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(() => {
        gameState.elapsedTime = (Date.now() - gameState.startTime) / 1000;
        timerEl.innerText = gameState.elapsedTime.toFixed(1);
    }, 100);
}

function updateHUD() {
    scoreEl.innerText = gameState.score;
    movesEl.innerText = `${gameState.maxMoves - gameState.moves} / ${gameState.maxMoves}`;
}

function checkWin() {
    if (gameState.moves <= gameState.maxMoves) {
        const bonus = Math.max(0, (gameState.maxMoves - gameState.moves) * 100);
        gameState.score += 1000 + bonus;
        
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('seesawHighScore', gameState.highScore);
        }

        document.getElementById('overlay-title').innerText = "Level Complete!";
        document.getElementById('overlay-stats').innerText = `Score: ${gameState.score} | Time: ${gameState.elapsedTime.toFixed(1)}s`;
        overlay.classList.remove('hidden');
        if (gameState.level < levels.length - 1) {
            nextBtn.innerText = "Next Level";
        } else {
            nextBtn.innerText = "Play Again";
        }
    } else {
        document.getElementById('overlay-title').innerText = "Out of Moves!";
        document.getElementById('overlay-stats').innerText = "Try again!";
        overlay.classList.remove('hidden');
        nextBtn.innerText = "Restart";
    }
}

// --- Input Handling ---
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches? e.touches[0].clientX : e.clientX;
    const clientY = e.touches? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - rect.left) * (canvas.width / rect.width),
        y: (clientY - rect.top) * (canvas.height / rect.height)
    };
}

canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    // Check weights
    for (let i = 0; i < gameState.weights.length; i++) {
        const w = gameState.weights[i];
        const x = 60 + i * 60;
        const y = canvas.height - 60;
        if (Math.hypot(pos.x - x, pos.y - y) < 30) {
            gameState.isDragging = true;
            gameState.draggedWeight = { mass: w, color: COLORS.weights[i % COLORS.weights.length] };
            playSound(440, 'ine', 0.05);
            return;
        }
    }
    // Check placed weights
    for (let i = gameState.placedWeights.length - 1; i >= 0; i--) {
        const w = gameState.placedWeights[i];
        const rx = w.x - gameState.pivotX;
        const ry = w.y - gameState.pivotY;
        // Simple rotation-aware hit detection approximation
        const cos = Math.cos(-gameState.seesawAngle);
        const sin = Math.sin(-gameState.seesawAngle);
        const unrotX = rx * cos - ry * sin + gameState.pivotX;
        const unrotY = rx * sin + ry * cos + gameState.pivotY;
        
        if (Math.hypot(pos.x - unrotX, pos.y - unrotY) < 30) {
            gameState.isDragging = true;
            gameState.draggedWeight = w;
            gameState.draggedWeight.originalIndex = i;
            playSound(440, 'ine', 0.05);
            return;
        }
    }
});

window.addEventListener('mousemove', (e) => {
    if (!gameState.isDragging) return;
    const pos = getMousePos(e);
    gameState.dragX = pos.x;
    gameState.dragY = pos.y;
});

window.addEventListener('mouseup', (e) => {
    if (!gameState.isDragging) return;
    
    const pos = getMousePos(e);
    
    // Check if released on seesaw
    // Transform mouse pos to seesaw local space
    const dx = pos.x - gameState.pivotX;
    const dy = pos.y - gameState.pivotY;
    const cos = Math.cos(-gameState.seesawAngle);
    const sin = Math.sin(-gameState.seesawAngle);
    const localX = dx * cos - dy * sin + gameState.pivotX;
    const localY = dx * sin + dy * cos + gameState.pivotY;

    const halfWidth = gameState.seesawWidth / 2;
    if (Math.abs(localY - gameState.pivotY) < 20 && Math.abs(localX - gameState.pivotX) < halfWidth) {
        // Place weight
        if (gameState.draggedWeight.originalIndex!== undefined) {
            // Moving existing weight
            gameState.placedWeights[gameState.draggedWeight.originalIndex] = {
                ..gameState.draggedWeight,
                x: localX,
                y: localY
            };
            gameState.draggedWeight.originalIndex = undefined;
        } else {
            // Adding new weight
            gameState.moves++;
            gameState.placedWeights.push({
                mass: gameState.draggedWeight.mass,
                color: gameState.draggedWeight.color,
                x: localX,
                y: localY
            });
            gameState.weights.splice(gameState.weights.indexOf(gameState.draggedWeight.mass), 1);
            playSound(330, 'ine', 0.1);
        }
        updateHUD();
    } else if (gameState.draggedWeight.originalIndex === undefined) {
        // Dropped in void, return weight to tray
        gameState.weights.push(gameState.draggedWeight.mass);
        playSound(150, 'ine', 0.1);
    }

    gameState.isDragging = false;
    gameState.draggedWeight = null;
});

// --- UI Events ---
undoBtn.addEventListener('click', () => {
    if (gameState.placedWeights.length > 0) {
        const removed = gameState.placedWeights.pop();
        gameState.weights.push(removed.mass);
        gameState.moves++;
        gameState.seesawAngle = 0;
        gameState.angularVelocity = 0;
        updateHUD();
        playSound(220, 'ine', 0.1);
    }
});

hintBtn.addEventListener('click', () => {
    // Simple hint: place first available weight at a random valid position
    if (gameState.weights.length > 0) {
        const m = gameState.weights[0];
        const side = Math.random() > 0.5? 1 : -1;
        const dist = (gameState.seesawWidth / 2) * (0.2 + Math.random() * 0.6);
        gameState.placedWeights.push({
            mass: m,
            color: COLORS.weights[0],
            x: gameState.pivotX + (dist * side),
            y: gameState.pivotY
        });
        gameState.weights.splice(0, 1);
        gameState.moves++;
        updateHUD();
        playSound(880, 'ine', 0.2);
    }
});

restartBtn.addEventListener('click', () => initLevel(gameState.level));
nextBtn.addEventListener('click', () => {
    if (gameState.level < levels.length - 1) {
        initLevel(gameState.level + 1);
    } else {
        initLevel(0);
    }
});

// --- Main Loop ---
function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gameState.pivotX = canvas.width / 2;
    gameState.pivotY = canvas.height / 2 + 50;
}

window.addEventListener('resize', resize);
resize();

let lastTime = 0;
function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.03);
    lastTime = timestamp;
    updatePhysics(dt);
    draw();
    requestAnimationFrame(loop);
}

// Start Game
initLevel(0);
requestAnimationFrame(loop);
