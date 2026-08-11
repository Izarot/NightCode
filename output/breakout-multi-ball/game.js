/**
 * NEON BREAKOUT - Core Engine
 */

const CONFIG = {
    baseWidth: 800,
    baseHeight: 600,
    paddleWidth: 120,
    paddleHeight: 20,
    ballRadius: 6,
    brickRows: 8,
    brickCols: 10,
    colors: {
        bg: '#0A0A23',
        paddle: '#00FFFF',
        ball: '#FFFF00',
        bricks: ['#FF0055', '#FF8800', '#FFD700', '#00FF88', '#00CCFF', '#8800FF', '#FF00FF', '#FFFFFF']
    }
};

class SoundEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    play(freq, type = 'ine', duration = 0.1, vol = 0.1) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    bounce() { this.play(440, 'triangle', 0.1, 0.05); }
    break() { this.play(220, 'awtooth', 0.15, 0.1); }
    spawn() { this.play(880, 'ine', 0.3, 0.1); }
    gameOver() { this.play(110, 'awtooth', 0.5, 0.2); }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.03;
    }
}

class Ball {
    constructor(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.radius = CONFIG.ballRadius;
        this.trail = [];
    }
    update() {
        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 6) this.trail.shift();
        this.x += this.dx;
        this.y += this.dy;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.sound = new SoundEngine();
        this.score = 0;
        this.lives = 3;
        this.highScore = localStorage.getItem('breakout_highscore') || 0;
        this.running = false;
        this.balls = [];
        this.bricks = [];
        this.particles = [];
        this.paddle = { x: 0, y: 0, w: CONFIG.paddleWidth, h: CONFIG.paddleHeight };
        this.startTime = 0;
        this.timerInterval = null;
        this.timerElement = document.getElementById('timer');
        
        this.initInput();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        this.updateUI();
    }

    resize() {
        const container = document.getElementById('game-container');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.paddle.y = this.canvas.height * 0.9;
        this.paddle.x = (this.canvas.width - this.paddle.w) / 2;
    }

    initInput() {
        const handleMove = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            let clientX = e.clientX || (e.touches && e.touches[0].clientX);
            let mouseX = (clientX - rect.left) * scaleX;
            this.paddle.x = mouseX - this.paddle.w / 2;
            if (this.paddle.x < 5) this.paddle.x = 5;
            if (this.paddle.x + this.paddle.w > this.canvas.width - 5) 
                this.paddle.x = this.canvas.width - this.paddle.w - 5;
        };
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', (e) => { handleMove(e); e.preventDefault(); }, { passive: false });
    }

    start() {
        this.score = 0;
        this.lives = 3;
        this.balls = [new Ball(this.canvas.width/2, this.paddle.y - 10, 3, -3)];
        this.bricks = [];
        this.particles = [];
        this.running = true;
        this.startTime = Date.now();
        document.getElementById('overlay').style.display = 'none';
        this.initBricks();
        this.updateUI();
        this.gameLoop();
        this.startTimer();
    }
    
    initBricks() {
        const rows = CONFIG.brickRows;
        const cols = CONFIG.brickCols;
        const padding = 10;
        const offsetTop = 60;
        const brickW = (this.canvas.width - (cols + 1) * padding) / cols;
        const brickH = 25;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.bricks.push({
                    x: padding + c * (brickW + padding),
                    y: offsetTop + r * (brickH + padding),
                    w: brickW,
                    h: brickH,
                    hp: Math.floor(Math.random() * 2) + 1,
                    color: CONFIG.colors.bricks[r % CONFIG.colors.bricks.length]
                });
            }
        }
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const sec = Math.floor(elapsed / 1000);
            const ms = Math.floor((elapsed % 1000) / 10);
            this.timerElement.innerText = `${sec.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
        }, 50);
    }

    updateUI() {
        document.getElementById('score-display').innerText = `SCORE: ${this.score}`;
        document.getElementById('lives-display').innerText = '❤️'.repeat(this.lives);
        document.getElementById('high-score-display').innerText = `HIGH SCORE: ${this.highScore}`;
    }

    spawnBall() {
        if (this.balls.length < 5) {
            const angle = (Math.random() - 0.5) * 0.5; // ±15 degrees approx
            const speed = 4;
            this.balls.push(new Ball(this.paddle.x + this.paddle.w/2, this.paddle.y - 10, Math.cos(angle) * speed, -Math.sin(angle) * speed));
            this.sound.spawn();
        }
    }

    update() {
        if (!this.running) return;

        for (let i = this.balls.length - 1; i >= 0; i--) {
            const b = this.balls[i];
            b.update();

            // Wall collisions
            if (b.x - b.radius < 0 || b.x + b.radius > this.canvas.width) {
                b.dx *= -1;
                this.sound.bounce();
            }
            if (b.y - b.radius < 0) {
                b.dy *= -1;
                this.sound.bounce();
            }

            // Paddle collision
            if (b.y + b.radius > this.paddle.y && b.y - b.radius < this.paddle.y + this.paddle.h &&
                b.x > this.paddle.x && b.x < this.paddle.x + this.paddle.w) {
                const hitPoint = (b.x - (this.paddle.x + this.paddle.w/2)) / (this.paddle.w/2);
                b.dy = -Math.abs(b.dy);
                b.dx = hitPoint * 5;
                this.sound.bounce();
            }

            // Brick collision
            for (let j = this.bricks.length - 1; j >= 0; j--) {
                const br = this.bricks[j];
                if (b.x > br.x && b.x < br.x + br.w && b.y > br.y && b.y < br.y + br.h) {
                    b.dy *= -1;
                    br.hp--;
                    if (br.hp <= 0) {
                        this.bricks.splice(j, 1);
                        this.score += 10;
                        this.sound.break();
                        // Particles
                        for(let k=0; k<15; k++) this.particles.push(new Particle(br.x + br.w/2, br.y + br.h/2, br.color));
                        // Multi-ball logic
                        if (Math.random() < 0.05 || this.score % 1000 === 0) {
                            this.spawnBall();
                            this.score += 100;
                        }
                    }
                    this.updateUI();
                    break;
                }
            }

            // Fall off screen
            if (b.y > this.canvas.height) {
                this.balls.splice(i, 1);
                if (this.balls.length === 0) {
                    this.lives--;
                    this.updateUI();
                    if (this.lives <= 0) {
                        this.gameOver();
                    } else {
                        this.balls.push(new Ball(this.canvas.width/2, this.paddle.y - 10, 3, -3));
                    }
                }
            }
        }

        // Particles update
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }

        // Win condition
        if (this.bricks.length === 0) {
            this.gameOver(true);
        }
    }

    gameOver(win = false) {
        this.running = false;
        clearInterval(this.timerInterval);
        if (win) {
            this.sound.spawn();
            document.getElementById('overlay-title').innerText = "YOU WIN!";
        } else {
            this.sound.gameOver();
            document.getElementById('overlay-title').innerText = "GAME OVER";
        }
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('breakout_highscore', this.highScore);
        }
        
        document.getElementById('overlay').style.display = 'flex';
        this.updateUI();
    }

    draw() {
        this.ctx.fillStyle = CONFIG.colors.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Bricks
        this.bricks.forEach(br => {
            this.ctx.fillStyle = br.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = br.color;
            this.ctx.fillRect(br.x, br.y, br.w, br.h);
            this.ctx.shadowBlur = 0;
        });

        // Draw Particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        this.ctx.globalAlpha = 1.0;

        // Draw Paddle
        const grad = this.ctx.createLinearGradient(this.paddle.x, 0, this.paddle.x + this.paddle.w, 0);
        grad.addColorStop(0, '#0088ff');
        grad.addColorStop(0.5, '#00FFFF');
        grad.addColorStop(1, '#0088ff');
        this.ctx.fillStyle = grad;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#00FFFF';
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
        this.ctx.shadowBlur = 0;

        // Draw Balls
        this.balls.forEach(b => {
            // Trail
            b.trail.forEach((t, idx) => {
                this.ctx.globalAlpha = idx / 10;
                this.ctx.fillStyle = CONFIG.colors.ball;
                this.ctx.beginPath();
                this.ctx.arc(t.x, t.y, b.radius, 0, Math.PI * 2);
                this.ctx.fill();
            });
            this.ctx.globalAlpha = 1.0;
            
            this.ctx.fillStyle = CONFIG.colors.ball;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    gameLoop() {
        if (!this.running && this.balls.length === 0) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.onload = () => {
    new Game();
};