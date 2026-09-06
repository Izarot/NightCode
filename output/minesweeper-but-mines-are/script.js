// ============ GAME CONFIGURATION ============
const CONFIG = {
    easy: { cols: 9, rows: 9, mines: 10, interval: 4000 },
    medium: { cols: 16, rows: 16, mines: 40, interval: 3000 },
    hard: { cols: 30, rows: 16, mines: 99, interval: 2000 }
};

const COLORS = {
    background: '#1a1a2e',
    gridLine: '#2d2d44',
    unrevealed: '#3d3d5c',
    revealed: '#252538',
    hover: '#4a4a6a',
    flag: '#dc2626',
    mine: '#ef4444',
    explosion: '#ff4500',
    numbers: ['#00d4ff', '#00ff88', '#ff6b6b', '#a855f7', '#ff8c00', '#14b8a6', '#f0f0f0', '#888888']
};

// ============ GAME STATE ============
let game = {
    cols: 16,
    rows: 16,
    mines: 40,
    interval: 3000,
    grid: [],
    minePositions: [],
    revealed: [],
    flagged: [],
    gameOver: false,
    gameWon: false,
    gameStarted: false,
    firstClick: true,
    timer: 0,
    timerInterval: null,
    mineMoveInterval: null,
    cellSize: 32,
    padding: 2,
    canvasWidth: 0,
    canvasHeight: 0,
    animations: [],
    particles: [],
    hoveredCell: null,
    shakeOffset: { x: 0, y: 0 },
    shakeTime: 0,
    speedrunStart: 0,
    speedrunElapsed: 0,
    difficulty: 'medium'
};

// ============ DOM ELEMENTS ============
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const mineCountEl = document.getElementById('mineCount');
const timerDisplayEl = document.getElementById('timerDisplay');
const speedrunDisplayEl = document.getElementById('speedrunDisplay');
const highScoreBadgeEl = document.getElementById('highScoreBadge');
const overlay = document.getElementById('overlay');
const modalTitle = document.getElementById('modalTitle');
const modalStats = document.getElementById('modalStats');
const modalHighScore = document.getElementById('modalHighScore');

// ============ HIGH SCORE (LOCAL STORAGE) ============
function getHighScore(difficulty) {
    try {
        const scores = JSON.parse(localStorage.getItem('movingMinesweeperHighScores') || '{}');
        return scores[difficulty] || null;
    } catch (e) {
        return null;
    }
}

function saveHighScore(difficulty, timeSeconds) {
    try {
        const scores = JSON.parse(localStorage.getItem('movingMinesweeperHighScores') || '{}');
        if (!scores[difficulty] || timeSeconds < scores[difficulty]) {
            scores[difficulty] = timeSeconds;
            localStorage.setItem('movingMinesweeperHighScores', JSON.stringify(scores));
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
}

function formatHighScore(seconds) {
    if (seconds == null) return '--';
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

function updateHighScoreBadge() {
    const hs = getHighScore(game.difficulty);
    highScoreBadgeEl.textContent = `🏆 Best: ${formatHighScore(hs)}`;
}

// ============ AUDIO SYSTEM ============
const AudioSystem = {
    ctx: null,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    play(type) {
        try {
            if (!this.ctx) this.init();
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            switch(type) {
                case 'reveal':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
                    gain.gain.setValueAtTime(0.08, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                    osc.start(now);
                    osc.stop(now + 0.05);
                    break;
                case 'flag':
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.setValueAtTime(900, now + 0.05);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    osc.start(now);
                    osc.stop(now + 0.1);
                    break;
                case 'mine':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(150, now);
                    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                    osc.start(now);
                    osc.stop(now + 0.3);
                    break;
                case 'win':
                    [400, 500, 600, 800].forEach((freq, i) => {
                        const o = this.ctx.createOscillator();
                        const g = this.ctx.createGain();
                        o.connect(g);
                        g.connect(this.ctx.destination);
                        o.type = 'sine';
                        o.frequency.value = freq;
                        g.gain.setValueAtTime(0.1, now + i * 0.1);
                        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
                        o.start(now + i * 0.1);
                        o.stop(now + i * 0.1 + 0.2);
                    });
                    return;
                case 'lose':
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(200, now);
                    osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
                    gain.gain.setValueAtTime(0.25, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    osc.start(now);
                    osc.stop(now + 0.5);
                    break;
                case 'move':
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(80, now);
                    gain.gain.setValueAtTime(0.04, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    osc.start(now);
                    osc.stop(now + 0.1);
                    break;
                case 'number':
                    osc.type = 'sine';
                    const freq = 440 + (parseInt(arguments[1] || '1') - 1) * 70;
                    osc.frequency.setValueAtTime(freq, now);
                    gain.gain.setValueAtTime(0.06, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                    osc.start(now);
                    osc.stop(now + 0.08);
                    break;
            }
        } catch (e) {
            // Silently fail if audio not supported
        }
    }
};

// ============ INITIALIZATION ============
function initGame(difficulty = 'medium') {
    const config = CONFIG[difficulty];
    game.difficulty = difficulty;

    if (game.timerInterval) clearInterval(game.timerInterval);
    if (game.mineMoveInterval) clearInterval(game.mineMoveInterval);

    game = {
        cols: config.cols,
        rows: config.rows,
        mines: config.mines,
        interval: config.interval,
        grid: [],
        minePositions: [],
        revealed: Array(config.cols).fill(null).map(() => Array(config.rows).fill(false)),
        flagged: Array(config.cols).fill(null).map(() => Array(config.rows).fill(false)),
        gameOver: false,
        gameWon: false,
        gameStarted: false,
        firstClick: true,
        timer: 0,
        timerInterval: null,
        mineMoveInterval: null,
        cellSize: 32,
        padding: 2,
        canvasWidth: 0,
        canvasHeight: 0,
        animations: [],
        particles: [],
        hoveredCell: null,
        shakeOffset: { x: 0, y: 0 },
        shakeTime: 0,
        speedrunStart: 0,
        speedrunElapsed: 0,
        difficulty: difficulty
    };

    resizeCanvas();
    updateMineCounter();
    updateTimer();
    updateSpeedrun();
    updateHighScoreBadge();
    overlay.classList.remove('active');

    document.querySelectorAll('.btn-difficulty').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
    });
}

function resizeCanvas() {
    const maxWidth = Math.min(window.innerWidth - 40, 800);
    const maxHeight = window.innerHeight - 320;
    const cellW = Math.floor(maxWidth / game.cols);
    const cellH = Math.floor(maxHeight / game.rows);
    game.cellSize = Math.max(20, Math.min(40, Math.min(cellW, cellH)));

    game.canvasWidth = game.cols * game.cellSize;
    game.canvasHeight = game.rows * game.cellSize;

    canvas.width = game.canvasWidth;
    canvas.height = game.canvasHeight;
    canvas.style.width = game.canvasWidth + 'px';
    canvas.style.height = game.canvasHeight + 'px';
}

function placeMines(safeX, safeY) {
    game.grid = Array(game.cols).fill(null).map(() => Array(game.rows).fill(0));
    game.minePositions = [];

    const safeZone = new Set();
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const nx = safeX + dx, ny = safeY + dy;
            if (nx >= 0 && nx < game.cols && ny >= 0 && ny < game.rows) {
                safeZone.add(`${nx},${ny}`);
            }
        }
    }

    let placed = 0;
    let attempts = 0;
    while (placed < game.mines && attempts < 10000) {
        attempts++;
        const x = Math.floor(Math.random() * game.cols);
        const y = Math.floor(Math.random() * game.rows);
        const key = `${x},${y}`;

        if (!safeZone.has(key) && !game.minePositions.some(m => m.x === x && m.y === y)) {
            game.minePositions.push({ x, y });
            game.grid[x][y] = -1;
            placed++;
        }
    }

    for (let x = 0; x < game.cols; x++) {
        for (let y = 0; y < game.rows; y++) {
            if (game.grid[x][y] !== -1) {
                game.grid[x][y] = countAdjacentMines(x, y);
            }
        }
    }
}

function countAdjacentMines(x, y) {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < game.cols && ny >= 0 && ny < game.rows) {
                if (game.grid[nx][ny] === -1) count++;
            }
        }
    }
    return count;
}

// ============ GAME LOGIC ============
function revealCell(x, y) {
    if (game.gameOver || game.gameWon) return;
    if (x < 0 || x >= game.cols || y < 0 || y >= game.rows) return;
    if (game.revealed[x][y] || game.flagged[x][y]) return;

    if (game.firstClick) {
        game.firstClick = false;
        game.gameStarted = true;
        placeMines(x, y);
        startTimer();
        startMineMovement();
        game.speedrunStart = performance.now();
    }

    if (game.grid[x][y] === -1) {
        triggerGameOver(x, y);
        return;
    }

    game.revealed[x][y] = true;
    addRevealAnimation(x, y);

    if (game.grid[x][y] > 0) {
        AudioSystem.play('number', game.grid[x][y]);
    } else {
        AudioSystem.play('reveal');
    }

    if (game.grid[x][y] === 0) {
        const queue = [[x, y]];
        const visited = new Set();
        visited.add(`${x},${y}`);

        while (queue.length > 0) {
            const [cx, cy] = queue.shift();
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = cx + dx, ny = cy + dy;
                    if (nx < 0 || nx >= game.cols || ny < 0 || ny >= game.rows) continue;
                    const key = `${nx},${ny}`;
                    if (visited.has(key)) continue;
                    visited.add(key);

                    if (!game.flagged[nx][ny] && !game.revealed[nx][ny]) {
                        game.revealed[nx][ny] = true;
                        addRevealAnimation(nx, ny);

                        if (game.grid[nx][ny] === 0) {
                            queue.push([nx, ny]);
                        }
                    }
                }
            }
        }
    }

    checkWinCondition();
}

function toggleFlag(x, y) {
    if (game.gameOver || game.gameWon) return;
    if (x < 0 || x >= game.cols || y < 0 || y >= game.rows) return;
    if (game.revealed[x][y]) return;
    if (!game.gameStarted) return;

    game.flagged[x][y] = !game.flagged[x][y];
    updateMineCounter();
    AudioSystem.play('flag');
}

function checkWinCondition() {
    let revealedCount = 0;
    for (let x = 0; x < game.cols; x++) {
        for (let y = 0; y < game.rows; y++) {
            if (game.revealed[x][y]) revealedCount++;
        }
    }

    const totalSafe = game.cols * game.rows - game.mines;
    if (revealedCount >= totalSafe) {
        triggerWin();
    }
}

// ============ MINE MOVEMENT ============
function startMineMovement() {
    if (game.mineMoveInterval) clearInterval(game.mineMoveInterval);
    game.mineMoveInterval = setInterval(moveMines, game.interval);
}

function moveMines() {
    if (game.gameOver || game.gameWon) return;

    const newPositions = [];
    let triggeredLoss = null;

    game.minePositions.forEach(mine => {
        const validMoves = getValidMoves(mine.x, mine.y);
        if (validMoves.length > 0) {
            const newPos = validMoves[Math.floor(Math.random() * validMoves.length)];
            newPositions.push(newPos);

            if (game.revealed[newPos.x][newPos.y]) {
                triggeredLoss = { x: newPos.x, y: newPos.y, from: mine };
            }

            addMineMoveAnimation(mine.x, mine.y, newPos.x, newPos.y);
            AudioSystem.play('move');
        } else {
            newPositions.push(mine);
        }
    });

    if (triggeredLoss) {
        triggerGameOver(triggeredLoss.x, triggeredLoss.y);
        return;
    }

    game.minePositions = newPositions;

    game.grid = Array(game.cols).fill(null).map(() => Array(game.rows).fill(0));
    game.minePositions.forEach(m => game.grid[m.x][m.y] = -1);

    for (let x = 0; x < game.cols; x++) {
        for (let y = 0; y < game.rows; y++) {
            if (game.grid[x][y] !== -1) {
                game.grid[x][y] = countAdjacentMines(x, y);
            }
        }
    }
}

function getValidMoves(x, y) {
    const moves = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0&& ny < game.rows) {
                const occupied = game.minePositions.some(m => m.x === nx && m.y === ny);
                if (!occupied && !game.revealed[nx][ny]) {
                    moves.push({ x: nx, y: ny });
                }
            }
        }
    }
    return moves;
}

// ============ TIMER ============
function startTimer() {
    if (game.timerInterval) clearInterval(game.timerInterval);
    game.startTime = Date.now();
    game.timerInterval = setInterval(() => {
        game.timer = Math.floor((Date.now() - game.startTime) / 1000);
        updateTimer();
        updateSpeedrun();
    }, 200);
}

function updateTimer() {
    const mins = Math.floor(game.timer / 60).toString().padStart(2, '0');
    const secs = (game.timer % 60).toString().padStart(2, '0');
    timerDisplayEl.textContent = `${mins}:${secs}`;
}

function updateSpeedrun() {
    if (game.gameStarted && !game.gameOver && !game.gameWon) {
        game.speedrunElapsed = (performance.now() - game.speedrunStart) / 1000;
    }
    const mins = Math.floor(game.speedrunElapsed / 60).toString().padStart(2, '0');
    const secs = Math.floor(game.speedrunElapsed % 60).toString().padStart(2, '0');
    const ms = Math.floor((game.speedrunElapsed % 1) * 100).toString().padStart(2, '0');
    speedrunDisplayEl.textContent = `${mins}:${secs}.${ms}`;
}

function updateMineCounter() {
    let flagCount = 0;
    for (let x = 0; x < game.cols; x++) {
        for (let y = 0; y < game.rows; y++) {
            if (game.flagged[x][y]) flagCount++;
        }
    }
    mineCountEl.textContent = game.mines - flagCount;
}

// ============ GAME OVER ============
function triggerGameOver(mineX, mineY) {
    game.gameOver = true;
    game.gameStarted = false;
    clearInterval(game.timerInterval);
    clearInterval(game.mineMoveInterval);

    addExplosionAnimation(mineX, mineY);
    addShake(20, 500);

    game.minePositions.forEach(m => {
        game.revealed[m.x][m.y] = true;
    });

    AudioSystem.play('mine');
    setTimeout(() => AudioSystem.play('lose'), 400);

    setTimeout(() => showModal(false), 1200);
}

function triggerWin() {
    game.gameWon = true;
    game.gameStarted = false;
    clearInterval(game.timerInterval);
    clearInterval(game.mineMoveInterval);

    game.speedrunElapsed = (performance.now() - game.speedrunStart) / 1000;

    const isNewBest = saveHighScore(game.difficulty, game.speedrunElapsed);

    for (let i = 0; i < 30; i++) {
        addConfettiParticle();
    }

    AudioSystem.play('win');
    setTimeout(() => showModal(true, isNewBest), 800);
}

function showModal(won, isNewBest = false) {
    modalTitle.textContent = won ? 'YOU WIN!' : 'GAME OVER';
    modalTitle.className = 'modal-title ' + (won ? 'win' : 'lose');

    let revealedCount = 0;
    for (let x = 0; x < game.cols; x++) {
        for (let y = 0; y < game.rows; y++) {
            if (game.revealed[x][y]) revealedCount++;
        }
    }
    const totalSafe = game.cols * game.rows - game.mines;

    const mins = Math.floor(game.timer / 60).toString().padStart(2, '0');
    const secs = (game.timer % 60).toString().padStart(2, '0');
    modalStats.textContent = `Time: ${mins}:${secs} | Cells: ${revealedCount}/${totalSafe}`;

    if (won) {
        const srMins = Math.floor(game.speedrunElapsed / 60).toString().padStart(2, '0');
        const srSecs = Math.floor(game.speedrunElapsed % 60).toString().padStart(2, '0');
        const srMs = Math.floor((game.speedrunElapsed % 1) * 100).toString().padStart(2, '0');
        modalHighScore.textContent = isNewBest
            ? `🎉 NEW BEST! ${srMins}:${srSecs}.${srMs}`
            : `⏱️ Time: ${srMins}:${srSecs}.${srMs}`;
    } else {
        const hs = getHighScore(game.difficulty);
        modalHighScore.textContent = `🏆 Best: ${formatHighScore(hs)}`;
    }

    overlay.classList.add('active');
}

// ============ ANIMATIONS ============
function addRevealAnimation(x, y) {
    game.animations.push({
        type: 'reveal',
        x, y,
        startTime: performance.now(),
        duration: 250
    });
}

function addMineMoveAnimation(fromX, fromY, toX, toY) {
    game.animations.push({
        type: 'mineMove',
        fromX, fromY, toX, toY,
        startTime: performance.now(),
        duration: 400
    });
}

function addExplosionAnimation(x, y) {
    game.animations.push({
        type: 'explosion',
        x, y,
        startTime: performance.now(),
        duration: 1000
    });
    for (let i = 0; i < 25; i++) {
        addExplosionParticle(x, y);
    }
}

function addShake(intensity, duration) {
    game.shakeTime = performance.now() + duration;
    game.shakeIntensity = intensity;
}

function addExplosionParticle(x, y) {
    const cx = x * game.cellSize + game.cellSize / 2;
    const cy = y * game.cellSize + game.cellSize / 2;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    game.particles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
        size: 2 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#ef4444' : '#ff8c00',
        type: 'explosion'
    });
}

function addConfettiParticle() {
    const x = Math.random() * game.canvasWidth;
    const y = -10;
    game.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3,
        life: 1,
        decay: 0.005 + Math.random() * 0.01,
        size: 3 + Math.random() * 4,
        color: COLORS.numbers[Math.floor(Math.random() * COLORS.numbers.length)],
        type: 'confetti'
    });
}

function updateParticles() {
    game.particles = game.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.type === 'confetti') {
            p.vy += 0.05;
        }
        p.life -= p.decay;
        return p.life > 0 && p.y < game.canvasHeight + 20;
    });
}

// ============ RENDERING ============
function render() {
    const now = performance.now();

    if (game.shakeTime > now) {
        game.shakeOffset.x = (Math.random() - 0.5) * game.shakeIntensity;
        game.shakeOffset.y = (Math.random() - 0.5) * game.shakeIntensity;
    } else {
        game.shakeOffset.x = 0;
        game.shakeOffset.y = 0;
    }

    ctx.save();
    ctx.translate(game.shakeOffset.x, game.shakeOffset.y);

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, game.canvasWidth, game.canvasHeight);

    for (let x = 0; x < game.cols; x++) {
        for (let y = 0; y < game.rows; y++) {
            drawCell(x, y);
        }
    }

    game.minePositions.forEach(m => {
        drawMine(m.x, m.y);
    });

    game.animations = game.animations.filter(anim => {
        const progress = Math.min(1, (now - anim.startTime) / anim.duration);
        if (anim.type === 'mineMove') {
            const t = progress;
            const ix = anim.fromX + (anim.toX - anim.fromX) * t;
            const iy = anim.fromY + (anim.toY - anim.fromY) * t;
            drawMine(ix, iy, true);
        } else if (anim.type === 'explosion') {
            drawExplosion(anim.x, anim.y, progress);
        } else if (anim.type === 'reveal') {
            drawRevealPulse(anim.x, anim.y, progress);
        }
        return progress < 1;
    });

    updateParticles();
    game.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    requestAnimationFrame(render);
}

function drawCell(x, y) {
    const px = x * game.cellSize;
    const py = y * game.cellSize;
    const size = game.cellSize;

    if (game.revealed[x][y]) {
        ctx.fillStyle = COLORS.revealed;
        ctx.fillRect(px, py, size, size);

        ctx.strokeStyle = COLORS.gridLine;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, size - 1, size - 1);

        if (game.grid[x][y] > 0 && (!game.gameOver || game.grid[x][y] !== -1)) {
            const val = game.grid[x][y];
            ctx.fillStyle = COLORS.numbers[val - 1];
            ctx.font = `bold ${Math.floor(size * 0.6)}px JetBrains Mono, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(val.toString(), px + size / 2, py + size / 2 + 1);
        }
    } else {
        const isHovered = game.hoveredCell && game.hoveredCell.x === x && game.hoveredCell.y === y;
        ctx.fillStyle = isHovered ? COLORS.hover : COLORS.unrevealed;
        ctx.fillRect(px, py, size, size);

        const gradient = ctx.createLinearGradient(px, py, px, py + size);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        ctx.fillStyle = gradient;
        ctx.fillRect(px, py, size, size);

        if (game.flagged[x][y]) {
            ctx.fillStyle = COLORS.flag;
            ctx.font = `bold ${Math.floor(size * 0.7)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🚩', px + size / 2, py + size / 2 + 1);
        }
    }
}

function drawMine(x, y, moving = false) {
    const px = x * game.cellSize + game.cellSize / 2;
    const py = y * game.cellSize + game.cellSize / 2;
    const radius = game.cellSize * 0.32;

    const showMine = game.gameOver || !game.revealed[x][y];

    if (!showMine && !moving) return;

    if (moving) {
        ctx.globalAlpha = 0.7;
    }

    ctx.fillStyle = COLORS.mine;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(px - radius * 0.3, py - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.mine;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const spikeLen = radius * 0.6;
    ctx.beginPath();
    ctx.moveTo(px, py - radius - spikeLen);
    ctx.lineTo(px, py - radius);
    ctx.moveTo(px, py + radius);
    ctx.lineTo(px, py + radius + spikeLen);
    ctx.moveTo(px - radius - spikeLen, py);
    ctx.lineTo(px - radius, py);
    ctx.moveTo(px + radius, py);
    ctx.lineTo(px + radius + spikeLen, py);
    ctx.stroke();

    ctx.globalAlpha = 1;
}

function drawExplosion(x, y, progress) {
    const px = x * game.cellSize + game.cellSize / 2;
    const py = y * game.cellSize + game.cellSize / 2;
    const radius = game.cellSize * (0.5 + progress * 2);

    const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
    gradient.addColorStop(0, `rgba(255, 200, 0, ${1 - progress})`);
    gradient.addColorStop(0.5, `rgba(255, 100, 0, ${(1 - progress) * 0.8})`);
    gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawRevealPulse(x, y, progress) {
    const px = x * game.cellSize + game.cellSize / 2;
    const py = y * game.cellSize + game.cellSize / 2;
    const radius = game.cellSize * (0.5 + progress * 0.8);

    ctx.strokeStyle = `rgba(0, 255, 136, ${(1 - progress) * 0.6})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.stroke();
}

// ============ INPUT HANDLING ============
function getCellFromMouse(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / game.cellSize);
    const y = Math.floor((e.clientY - rect.top) / game.cellSize);
    return { x, y };
}

canvas.addEventListener('mousemove', (e) => {
    const cell = getCellFromMouse(e);
    if (cell.x >= 0 && cell.x < game.cols && cell.y >= 0 && cell.y < game.rows) {
        game.hoveredCell = cell;
    } else {
        game.hoveredCell = null;
    }
});

canvas.addEventListener('mouseleave', () => {
    game.hoveredCell = null;
});

canvas.addEventListener('mousedown', (e) => {
    AudioSystem.init();
    const cell = getCellFromMouse(e);
    if (cell.x < 0 || cell.x >= game.cols || cell.y < 0 || cell.y >= game.rows) return;

    if (e.button === 0) {
        revealCell(cell.x, cell.y);
    } else if (e.button === 2) {
        e.preventDefault();
        toggleFlag(cell.x, cell.y);
    }
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    AudioSystem.init();
    const touch = e.touches[0];
    const cell = getCellFromMouse(touch);
    if (cell.x >= 0 && cell.x < game.cols && cell.y >= 0 && cell.y < game.rows) {
        revealCell(cell.x, cell.y);
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
});

// ============ BUTTONS ============
document.getElementById('restartBtn').addEventListener('click', () => {
    initGame(game.difficulty);
});

document.getElementById('playAgainBtn').addEventListener('click', () => {
    initGame(game.difficulty);
});

document.querySelectorAll('.btn-difficulty').forEach(btn => {
    btn.addEventListener('click', () => {
        const diff = btn.dataset.difficulty;
        const interval = btn.dataset.interval || CONFIG[diff].interval;
        CONFIG[diff].interval = parseInt(interval) || CONFIG[diff].interval;
        initGame(diff);
    });
});

document.querySelectorAll('.btn-speed').forEach(btn => {
    btn.addEventListener('click', () => {
        const speed = btn.dataset.speed;
        let newInterval;
        switch(speed) {
            case 'slow': newInterval = 4000; break;
            case 'normal': newInterval = 3000; break;
            case 'fast': newInterval = 2000; break;
        }
        game.interval = newInterval;
        if (game.mineMoveInterval && game.gameStarted) {
            clearInterval(game.mineMoveInterval);
            game.mineMoveInterval = setInterval(moveMines, newInterval);
        }
        document.querySelectorAll('.btn-speed').forEach(b => {
            b.classList.toggle('active', b.dataset.speed === speed);
        });
    });
});

window.addEventListener('resize', () => {
    resizeCanvas();
});

// ============ START GAME ============
initGame('medium');
render();
