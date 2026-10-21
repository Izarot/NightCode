const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const hudTimer = document.getElementById('timer');
const hudScore = document.getElementById('score');
const hudHighscore = document.getElementById('highscore');
const overlayMenu = document.getElementById('overlay-menu');
const overlayPause = document.getElementById('overlay-pause');
const overlayGameOver = document.getElementById('overlay-gameover');
const finalScoreEl = document.getElementById('final-score');
const highscoreBadge = document.getElementById('highscore-badge');

// Audio Context
let audioCtx;

class SoundManager {
    constructor() {
        this.enabled = false;
    }
    init() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    play(type) {
        if (!this.enabled || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'move') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'eat') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'gameover') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now); osc.stop(now + 0.5);
        } else if (type === 'levelup') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        }
    }
}

const sound = new SoundManager();

// Game Config
const COLORS = {
    bg: '#0a0a0a',
    snakeHead: '#00ff88',
    snakeBody: '#00cc66',
    food: '#ff0055',
    ui: '#ffffff',
    accent: '#00ffff'
};

class Game {
    constructor() {
        this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER
        this.cellSize = 20;
        this.cols = 0;
        this.rows = 0;
        this.snake = [];
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.food = { x: 0, y: 0 };
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snake-cylinder-hs') || '0');
        this.foodsEaten = 0;
        this.interval = 150;
        this.lastTime = 0;
        this.accumulator = 0;
        this.timerStart = 0;
        this.timerElapsed = 0;
        this.pausedTime = 0;
        this.powerUpActive = false;
        this.powerUpEnd = 0;

        hudHighscore.textContent = `Best: ${this.highScore}`;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInput();
        this.bindUI();
        this.loop(0);
    }

    resize() {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        // Cap size for performance on huge screens
        const maxW = Math.min(rect.width, 800);
        const maxH = Math.min(rect.height, 600);
        canvas.width = maxW;
        canvas.height = maxH;
        this.cellSize = Math.floor(Math.min(maxW / 40, maxH / 30));
        if (this.cellSize < 10) this.cellSize = 10;
        this.cols = Math.floor(canvas.width / this.cellSize);
        this.rows = Math.floor(canvas.height / this.cellSize);
        if (this.state === 'MENU') this.draw();
    }

    setupInput() {
        window.addEventListener('keydown', (e) => {
            if (this.state !== 'PLAYING') return;
            switch(e.key) {
                case 'ArrowUp': case 'w': case 'W': this.trySetDir(0, -1); break;
                case 'ArrowDown': case 's': case 'S': this.trySetDir(0, 1); break;
                case 'ArrowLeft': case 'a': case 'A': this.trySetDir(-1, 0); break;
                case 'ArrowRight': case 'd': case 'D': this.trySetDir(1, 0); break;
            }
        });

        let touchStartX = 0;
        let touchStartY = 0;
        canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].clientX;
            touchStartY = e.changedTouches[0].clientY;
        }, {passive: false});

        canvas.addEventListener('touchend', (e) => {
            if (this.state !== 'PLAYING') return;
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            const dx = endX - touchStartX;
            const dy = endY - touchStartY;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > 30) this.trySetDir(dx > 0 ? 1 : -1, 0);
            } else {
                if (Math.abs(dy) > 30) this.trySetDir(0, dy > 0 ? 1 : -1);
            }
        }, {passive: false});
    }

    trySetDir(dx, dy) {
        // Prevent 180 turn
        if (dx === -this.dir.x && dy === -this.dir.y) return;
        // Prevent same direction
        if (dx === this.dir.x && dy === this.dir.y) return;
        this.nextDir = { x: dx, y: dy };
    }

    bindUI() {
        document.getElementById('btn-start').onclick = () => this.start();
        document.getElementById('btn-restart').onclick = () => this.start();
        document.getElementById('btn-resume').onclick = () => this.resume();
        document.getElementById('btn-menu-pause').onclick = () => this.goMenu();
        document.getElementById('btn-menu-gameover').onclick = () => this.goMenu();
        document.getElementById('btn-settings').onclick = () => {
            sound.init();
            sound.enabled = true;
        };
    }

    start() {
        this.resetGame();
        this.state = 'PLAYING';
        overlayMenu.classList.remove('active');
        overlayPause.classList.remove('active');
        overlayGameOver.classList.remove('active');
        sound.init();
        sound.enabled = true;
        this.timerStart = Date.now();
        this.timerElapsed = 0;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    resume() {
        this.state = 'PLAYING';
        overlayPause.classList.remove('active');
        // Adjust timer start to account for pause duration
        const pauseDuration = Date.now() - this.pauseStart;
        this.timerStart += pauseDuration;
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    goMenu() {
        this.state = 'MENU';
        overlayPause.classList.remove('active');
        overlayGameOver.classList.remove('active');
        overlayMenu.classList.add('active');
        this.draw();
    }

    resetGame() {
        this.snake = [
            { x: Math.floor(this.cols / 2), y: Math.floor(this.rows / 2) },
            { x: Math.floor(this.cols / 2) - 1, y: Math.floor(this.rows / 2) },
            { x: Math.floor(this.cols / 2) - 2, y: Math.floor(this.rows / 2) }
        ];
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.score = 0;
        this.foodsEaten = 0;
        this.interval = 150;
        this.powerUpActive = false;
        hudScore.textContent = 'Score: 0';
        this.spawnFood();
    }

    spawnFood() {
        let valid = false;
        while (!valid) {
            this.food.x = Math.floor(Math.random() * this.cols);
            this.food.y = Math.floor(Math.random() * this.rows);
            valid = !this.snake.some(s => s.x === this.food.x && s.y === this.food.y);
        }
    }

    gameOver() {
        this.state = 'GAMEOVER';
        sound.play('gameover');
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snake-cylinder-hs', this.highScore.toString());
            highscoreBadge.style.display = 'block';
        } else {
            highscoreBadge.style.display = 'none';
        }
        finalScoreEl.textContent = `Score: ${this.score}`;
        hudHighscore.textContent = `Best: ${this.highScore}`;
        overlayGameOver.classList.add('active');
    }

    pause() {
        if (this.state !== 'PLAYING') return;
        this.state = 'PAUSED';
        this.pauseStart = Date.now();
        overlayPause.classList.add('active');
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        this.accumulator += dt;
        if (this.accumulator < this.interval) return;
        this.accumulator = 0;

        this.dir = this.nextDir;

        const head = { ...this.snake[0] };
        head.x += this.dir.x;
        head.y += this.dir.y;

        // Horizontal Wrap (Cylinder)
        if (head.x < 0) head.x = this.cols - 1;
        if (head.x >= this.cols) head.x = 0;

        // Vertical Wall Collision
        if (head.y < 0 || head.y >= this.rows) {
            this.gameOver();
            return;
        }

        // Self Collision
        // Tail moves, so we check against body excluding tail if not growing
        const willGrow = (head.x === this.food.x && head.y === this.food.y);
        const bodyToCheck = willGrow ? this.snake : this.snake.slice(0, -1);
        if (bodyToCheck.some(s => s.x === head.x && s.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        if (willGrow) {
            this.score++;
            this.foodsEaten++;
            sound.play('eat');
            hudScore.textContent = `Score: ${this.score}`;

            // Speed up every 5 foods
            if (this.foodsEaten % 5 === 0) {
                this.interval = Math.max(80, this.interval - 15);
                sound.play('levelup');
            }

            this.spawnFood();
        } else {
            this.snake.pop();
            sound.play('move');
        }

        // Power up timer logic (simplified for this build)
        if (this.powerUpActive && Date.now() > this.powerUpEnd) {
            this.powerUpActive = false;
        }
    }

    draw() {
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Grid (Subtle)
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.cols; i++) {
            ctx.beginPath(); ctx.moveTo(i * this.cellSize, 0); ctx.lineTo(i * this.cellSize, canvas.height); ctx.stroke();
        }
        for (let j = 0; j <= this.rows; j++) {
            ctx.beginPath(); ctx.moveTo(0, j * this.cellSize); ctx.lineTo(canvas.width, j * this.cellSize); ctx.stroke();
        }

        // Draw Food
        ctx.beginPath();
        const foodColor = this.foodsEaten % 20 === 0 && this.foodsEaten > 0 ? '#fbc02d' : COLORS.food;
        ctx.fillStyle = foodColor;
        ctx.arc(
            this.food.x * this.cellSize + this.cellSize / 2,
            this.food.y * this.cellSize + this.cellSize / 2,
            this.cellSize / 3,
            0, Math.PI * 2
        );
        ctx.fill();

        // Draw Snake
        this.snake.forEach((segment, index) => {
            const isHead = index === 0;
            ctx.fillStyle = isHead ? COLORS.snakeHead : COLORS.snakeBody;
            const x = segment.x * this.cellSize;
            const y = segment.y * this.cellSize;
            const size = this.cellSize;
            const r = isHead ? 4 : 2;
            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, size - 2, size - 2, r);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.stroke();
        });
    }

    updateTimer() {
        if (this.state !== 'PLAYING') return;
        const now = Date.now();
        const elapsed = now - this.timerStart;
        const mins = Math.floor(elapsed / 60000);
        const secs = Math.floor((elapsed % 60000) / 1000);
        const ms = Math.floor((elapsed % 1000) / 10);
        hudTimer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
    }

    loop(timestamp) {
        if (this.state === 'PLAYING') {
            const dt = timestamp - this.lastTime;
            this.lastTime = timestamp;
            this.update(dt);
            this.updateTimer();
        }
        this.draw();
        if (this.state !== 'MENU') {
            requestAnimationFrame((t) => this.loop(t));
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});