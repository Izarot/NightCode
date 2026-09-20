class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.init();
        window.addEventListener('resize', () => this.resize());
        this.gameLoop();
    }

    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    init() {
        this.paddle = new Paddle(this);
        this.ball = new Ball(this);
        this.bricks = [];
        this.powerUps = [];
        this.particles = [];
        this.score = 0;
        this.lives = 3;
        this.boostMeter = 100;
        this.combo = 1;
        this.lastComboTime = 0;
        this.level = 1;
        this.state = 'MENU';
        this.highScore = localStorage.getItem('breakoutHighScore') || 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.createBricks();
        this.audio = new AudioSystem();
        this.hud = new HUD(this);
    }

    createBricks() {
        const cols = 13, rows = 10;
        const bw = 48, bh = 24;
        const gap = 2;
        const startX = (this.canvas.width - (cols * (bw + gap)) + gap) / 2;
        const startY = 60;

        this.bricks = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = startX + col * (bw + gap);
                const y = startY + row * (bh + gap);
                const type = this.getBrickType(row, col);
                this.bricks.push(new Brick(this, x, y, type));
            }
        }
    }

    getBrickType(row, col) {
        if (row < 2) return 'heavy';
        if (row < 4) return 'tough';
        if (Math.random() < 0.1) return 'gold';
        if (Math.random() < 0.05) return 'explosive';
        if (Math.random() < 0.03) return 'indestructible';
        return 'standard';
    }

    gameLoop() {
        const now = performance.now();
        const dt = (now - (this.lastTime || now)) / 1000;
        this.lastTime = now;

        this.update(dt);
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update(dt) {
        if (this.state === 'PLAYING') {
            this.elapsedTime += dt;
            this.paddle.update(dt);
            this.ball.update(dt);
            this.checkCollisions();
            this.updatePowerUps(dt);
            this.updateParticles(dt);
            this.updateCombo(dt);
            this.boostMeter = Math.min(100, this.boostMeter + 15 * dt);
        }
    }

    checkCollisions() {
        // Paddle collision
        if (this.ball.state === 'IN_PLAY' && this.ball.collidesWith(this.paddle)) {
            this.ball.bounceOffPaddle();
            this.audio.play('paddle');
            this.paddle.trail = [];
        }

        // Wall collisions
        if (this.ball.x <= 0 || this.ball.x >= this.canvas.width) {
            this.ball.vx *= -1;
        }
        if (this.ball.y <= 0) {
            this.ball.vy *= -1;
        }

        // Brick collisions
        for (let i = this.bricks.length - 1; i >= 0; i--) {
            if (this.ball.collidesWith(this.bricks[i])) {
                this.bricks[i].hit();
                this.ball.bounceOffBrick(this.bricks[i]);
                this.audio.play('brick');
                this.checkCombo();
                break;
            }
        }

        // Ball lost
        if (this.ball.y > this.canvas.height) {
            this.lives--;
            if (this.lives > 0) {
                this.ball.reset();
            } else {
                this.state = 'GAME_OVER';
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('breakoutHighScore', this.highScore);
                }
            }
        }
    }

    checkCombo() {
        const now = Date.now();
        if (now - this.lastComboTime < 2000) {
            this.combo = Math.min(10, this.combo + 0.5);
        } else {
            this.combo = 1;
        }
        this.lastComboTime = now;
    }

    updateCombo(dt) {
        if (this.combo > 1 && Date.now() - this.lastComboTime > 2000) {
            this.combo = 1;
        }
    }

    updatePowerUps(dt) {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const pu = this.powerUps[i];
            pu.y += pu.speed * dt;
            if (pu.y > this.canvas.height) {
                this.powerUps.splice(i, 1);
            } else if (this.paddle.collidesWith(pu)) {
                this.activatePowerUp(pu.type);
                this.powerUps.splice(i, 1);
            }
        }
    }

    activatePowerUp(type) {
        switch (type) {
            case 'WIDE':
                this.paddle.width = 144;
                setTimeout(() => this.paddle.width = 96, 10000);
                break;
            case 'MULTI':
                // Implement multi-ball
                break;
            case 'SHIELD':
                this.paddle.shield = true;
                setTimeout(() => this.paddle.shield = false, 10000);
                break;
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderBackground();
        this.renderBricks();
        this.paddle.draw(this.ctx);
        this.ball.draw(this.ctx);
        this.renderPowerUps();
        this.renderParticles();
        this.hud.render(this.ctx);
    }

    renderBackground() {
        const grad = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        grad.addColorStop(0, 'rgba(10, 10, 46, 0.3)');
        grad.addColorStop(1, 'rgba(22, 33, 62, 0.5)');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderBricks() {
        this.bricks.forEach(b => b.draw(this.ctx));
    }

    renderPowerUps() {
        this.powerUps.forEach(pu => pu.draw(this.ctx));
    }

    renderParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
}

class Paddle {
    constructor(game) {
        this.game = game;
        this.width = 96;
        this.height = 16;
        this.x = (game.canvas.width - this.width) / 2;
        this.y = game.canvas.height * 0.85;
        this.vx = 0;
        this.maxSpeed = 800;
        this.boostMaxSpeed = 1400;
        this.boosting = false;
        this.trail = [];
    }

    update(dt) {
        const targetX = this.getMouseX();
        const targetVel = (targetX - this.x) * 0.2;
        this.vx += targetVel * 0.35;
        this.vx *= this.boosting ? 0.5 : 0.85;
        this.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vx));
        this.x += this.vx * dt;
        this.x = Math.max(0, Math.min(this.game.canvas.width - this.width, this.x));

        if (this.boosting) {
            this.boostMeter -= 50 * dt;
            if (this.boostMeter <= 0) this.boosting = false;
        } else {
            this.boostMeter = Math.min(100, this.boostMeter + 15 * dt);
        }

        this.trail.push({x: this.x, y: this.y});
        if (this.trail.length > 10) this.trail.shift();
    }

    getMouseX() {
        return this.mouseX || this.x;
    }

    draw(ctx) {
        // Trail
        this.trail.forEach((p, i) => {
            ctx.globalAlpha = (i / this.trail.length) * 0.3;
            ctx.fillStyle = '#00ffff';
            ctx.fillRect(p.x, p.y, this.width, this.height);
        });
        ctx.globalAlpha = 1;

        // Paddle
        ctx.fillStyle = '#003366';
        ctx.strokeStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Core
        ctx.fillStyle = this.boosting ? '#ffffff' : '#00ffff';
        ctx.fillRect(this.x + this.width/2 - 2, this.y + 4, 4, 8);
    }

    collidesWith(other) {
        return !(this.x + this.width < other.x ||
                 this.x > other.x + other.width ||
                 this.y + this.height < other.y ||
                 this.y > other.y + other.height);
    }
}

class Ball {
    constructor(game) {
        this.game = game;
        this.radius = 6;
        this.reset();
    }

    reset() {
        this.x = this.game.paddle.x + this.game.paddle.width/2;
        this.y = this.game.paddle.y - 10;
        this.vx = 0;
        this.vy = 0;
        this.speed = 350;
        this.state = 'STUCK';
    }

    launch() {
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -1;
        const mag = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
        this.vx = this.vx / mag * this.speed;
        this.vy = this.vy / mag * this.speed;
        this.state = 'IN_PLAY';
    }

    update(dt) {
        if (this.state === 'STUCK') {
            this.x = this.game.paddle.x + this.game.paddle.width/2;
            this.y = this.game.paddle.y - 10;
            return;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, this.radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#00ffff');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    collidesWith(other) {
        const dx = this.x - (other.x + other.width/2);
        const dy = this.y - (other.y + other.height/2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        return dist < this.radius + (other.width || other.height)/2;
    }

    bounceOffPaddle() {
        const hitPos = (this.x - this.game.paddle.x) / this.game.paddle.width - 0.5;
        this.vy = -Math.abs(this.vy);
        this.vx = hitPos * 3;
        const mag = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
        this.vx = this.vx / mag * this.speed;
        this.vy = this.vy / mag * this.speed;
        this.speed = Math.min(700, this.speed * 1.02);
    }

    bounceOffBrick(brick) {
        this.vy *= -1;
        if (Math.abs(this.vx) < 200) {
            this.vx += (Math.random() - 0.5) * 100;
        }
    }
}

class Brick {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 24;
        this.type = type;
        this.hp = this.getHP();
        this.maxHp = this.hp;
    }

    getHP() {
        switch (this.type) {
            case 'standard': return 1;
            case 'tough': return 2;
            case 'heavy': return 3;
            case 'indestructible': return Infinity;
            case 'explosive': return 1;
            case 'gold': return 1;
            default: return 1;
        }
    }

    hit() {
        if (this.type === 'indestructible') return;
        this.hp--;
        if (this.hp <= 0) {
            this.destroy();
        }
    }

    destroy() {
        this.game.score += this.getPoints() * this.game.combo;
        this.createParticles();
        if (this.type === 'explosive') this.explode();
        if (Math.random() < 0.15) {
            this.game.powerUps.push(new PowerUp(this.x + this.width/2, this.y + this.height/2));
        }
        this.game.bricks = this.game.bricks.filter(b => b !== this);
    }

    getPoints() {
        switch (this.type) {
            case 'standard': return 100;
            case 'tough': return 200;
            case 'heavy': return 300;
            case 'explosive': return 150;
            case 'gold': return 500;
            default: return 100;
        }
    }

    explode() {
        const dirs = [[-1,0], [1,0], [0,-1], [0,1]];
        dirs.forEach(([dx, dy]) => {
            this.game.bricks = this.game.bricks.filter(b => {
                if (b !== this && Math.abs(b.x - this.x) < 50 && Math.abs(b.y - this.y) < 50) {
                    b.destroy();
                    return false;
                }
                return true;
            });
        });
    }

    createParticles() {
        for (let i = 0; i < 20; i++) {
            this.game.particles.push(new Particle(
                this.x + this.width/2,
                this.y + this.height/2,
                Math.random() * 100 - 50,
                Math.random() * 100 - 50,
                this.getColor()
            ));
        }
    }

    getColor() {
        switch (this.type) {
            case 'standard': return '#ff4444';
            case 'tough': return '#ff8800';
            case 'heavy': return '#4444ff';
            case 'explosive': return '#ff00ff';
            case 'gold': return '#ffff00';
            default: return '#888888';
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.getColor();
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 100;
        this.type = ['WIDE', 'MULTI', 'SHIELD'][Math.floor(Math.random() * 3)];
    }

    draw(ctx) {
        ctx.fillStyle = '#00ffff';
        ctx.font = '12px monospace';
        ctx.fillText(this.type[0], this.x, this.y);
    }
}

class Particle {
    constructor(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = 1;
    }
}

class AudioSystem {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    play(sound) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        switch (sound) {
            case 'paddle':
                osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
                gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.05);
                break;
            case 'brick':
                osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
                gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
                break;
        }

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }
}

class HUD {
    constructor(game) {
        this.game = game;
    }

    render(ctx) {
        ctx.fillStyle = '#00ffff';
        ctx.font = '16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${String(this.game.score).padStart(6, '0')}`, 10, 25);
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL: ${this.game.level}`, this.game.canvas.width/2, 25);
        ctx.textAlign = 'right';
        ctx.fillText(`LIVES: ${this.game.lives}`, this.game.canvas.width - 10, 25);

        // Boost meter
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.game.canvas.width - 220, 50, 200, 12);
        ctx.fillStyle = this.game.boostMeter > 50 ? '#00ff00' : '#ff0000';
        ctx.fillRect(this.game.canvas.width - 220, 50, 200 * this.game.boostMeter / 100, 12);

        // Timer
        const time = Math.floor(this.game.elapsedTime);
        ctx.textAlign = 'center';
        ctx.fillText(`TIME: ${time}s`, this.game.canvas.width/2, 50);
    }
}

window.addEventListener('load', () => {
    const game = new Game();
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ') game.ball.launch();
        if (e.key === 'p' || e.key === 'Escape') game.state = 'PAUSED';
        if (e.key === 'Shift') game.paddle.boosting = true;
    });
    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') game.paddle.boosting = false;
    });
    document.addEventListener('mousemove', (e) => {
        const rect = game.canvas.getBoundingClientRect();
        game.paddle.mouseX = e.clientX - rect.left;
    });
});