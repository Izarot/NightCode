class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.state = 'menu';
        this.score = 0;
        this.health = 3;
        this.timeLeft = 30;
        this.player = null;
        this.enemies = [];
        this.platforms = [];
        this.collectibles = [];
        this.particles = [];
        this.camera = { x: 0, y: 0 };
        this.keys = {};
        this.highScore = localStorage.getItem('fishJumpHighScore') || 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createPlayer();
        this.createLevel();
        this.setupAudio();
        this.gameLoop();
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' || e.key === 'Enter' || e.key === 'w' || e.key === 'W') {
                if (this.player && this.player.grounded) {
                    this.player.jump();
                    this.playSound('jump');
                }
            }
        });
        window.addEventListener('keyup', (e) => { this.keys[e.key] = false; });
    }

    createPlayer() {
        this.player = {
            x: 100,
            y: 500,
            width: 40,
            height: 40,
            vx: 0,
            vy: 0,
            grounded: false,
            speed: 0.6,
            jumpPower: -14,
            gravity: 0.8,
            maxFall: 12,
            health: 3,
            invulnerable: 0,
            jump() {
                if (this.grounded) {
                    this.vy = this.jumpPower;
                    this.grounded = false;
                }
            },
            update() {
                this.vy += this.gravity;
                if (this.vy > this.maxFall) this.vy = this.maxFall;
                
                if (this.keys['ArrowLeft'] || this.keys['a']) this.vx = -this.speed;
                if (this.keys['ArrowRight'] || this.keys['d']) this.vx = this.speed;
                if (!this.keys['ArrowLeft'] && !this.keys['ArrowRight']) this.vx *= 0.8;
                
                this.x += this.vx;
                this.y += this.vy;
                
                if (this.y > this.height + 50) {
                    this.health--;
                    this.x = 100;
                    this.y = 500;
                    this.vy = 0;
                }
                
                if (this.invulnerable > 0) this.invulnerable--;
            },
            draw(ctx) {
                ctx.save();
                if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2) {
                    ctx.globalAlpha = 0.5;
                }
                ctx.fillStyle = '#FF6B9D';
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.width/2, this.height/2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(this.x - 10, this.y - 5, 5, 0, Math.PI * 2);
                ctx.arc(this.x + 10, this.y - 5, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.arc(this.x - 10, this.y - 5, 2, 0, Math.PI * 2);
                ctx.arc(this.x + 10, this.y - 5, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };
    }

    createLevel() {
        for (let i = 0; i < 5; i++) {
            this.platforms.push({
                x: i * 300 + 200,
                y: 600,
                width: 100,
                height: 20
            });
        }
        
        for (let i = 0; i < 10; i++) {
            this.collectibles.push({
                x: Math.random() * 800 + 200,
                y: Math.random() * 400 + 100,
                type: 'gem',
                collected: false
            });
        }
        
        this.enemies.push({
            x: 400,
            y: 580,
            width: 50,
            height: 30,
            vx: 1,
            type: 'shark'
        });
    }

    setupAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
    }

    playSound(type) {
        if (!this.audioContext) return;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        switch(type) {
            case 'jump':
                oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.1);
                break;
            case 'collect':
                oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1046, this.audioContext.currentTime + 0.1);
                break;
            case 'damage':
                oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
                break;
        }
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.health = 3;
        this.timeLeft = 30;
        document.getElementById('menu').style.display = 'none';
        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            if (this.timeLeft <= 0) this.gameOver();
        }, 1000);
    }

    update() {
        if (this.state !== 'playing') return;
        
        this.player.update();
        this.checkCollisions();
        this.updateEnemies();
        this.updateCollectibles();
        this.updateParticles();
        this.updateCamera();
        
        if (this.health <= 0) this.gameOver();
    }

    checkCollisions() {
        this.platforms.forEach(platform => {
            if (this.player.x < platform.x + platform.width &&
                this.player.x + this.player.width > platform.x &&
                this.player.y + this.player.height <= platform.y + 5 &&
                this.player.vy >= 0) {
                this.player.y = platform.y - this.player.height;
                this.player.vy = 0;
                this.player.grounded = true;
            }
        });
        
        this.collectibles.forEach(collectible => {
            if (!collectible.collected &&
                this.player.x < collectible.x + 20 &&
                this.player.x + this.player.width > collectible.x &&
                this.player.y < collectible.y + 20 &&
                this.player.y + this.player.height > collectible.y) {
                collectible.collected = true;
                this.score += 100;
                this.playSound('collect');
            }
        });
        
        this.enemies.forEach(enemy => {
            if (this.player.x < enemy.x + enemy.width &&
                this.player.x + this.player.width > enemy.x &&
                this.player.y < enemy.y + enemy.height &&
                this.player.y + this.player.height > enemy.y) {
                if (this.player.invulnerable === 0) {
                    this.health--;
                    this.player.invulnerable = 60;
                    this.playSound('damage');
                }
            }
        });
    }

    updateEnemies() {
        this.enemies.forEach(enemy => {
            if (enemy.type === 'shark') {
                enemy.x += enemy.vx;
                if (enemy.x > this.width || enemy.x < 0) enemy.vx *= -1;
            }
        });
    }

    updateCollectibles() {
        this.collectibles = this.collectibles.filter(c => !c.collected);
    }

    updateParticles() {
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2;
            p.life--;
        });
    }

    updateCamera() {
        this.camera.x = this.player.x - this.width / 2;
        this.camera.y = this.player.y - this.height / 2;
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.drawBackground();
        this.drawPlatforms();
        this.drawCollectibles();
        this.drawEnemies();
        this.player.draw(this.ctx);
        this.drawParticles();
        
        this.ctx.restore();
        this.drawHUD();
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#006994');
        gradient.addColorStop(1, '#40B08C');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawPlatforms() {
        this.ctx.fillStyle = '#F5E6D3';
        this.platforms.forEach(platform => {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        });
    }

    drawCollectibles() {
        this.collectibles.forEach(c => {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(c.x + 10, c.y + 10, 10, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawEnemies() {
        this.enemies.forEach(enemy => {
            if (enemy.type === 'shark') {
                this.ctx.fillStyle = '#2F2F2F';
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        });
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 60;
            this.ctx.fillRect(p.x, p.y, 4, 4);
        });
        this.ctx.globalAlpha = 1;
    }

    drawHUD() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('timer').textContent = `Time: ${this.timeLeft}`;
        document.getElementById('health').textContent = `Health: ${this.health}/3`;
    }

    gameOver() {
        clearInterval(this.gameTimer);
        this.state = 'gameover';
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('fishJumpHighScore', this.highScore);
        }
        
        alert(`Game Over! Final Score: ${this.score}\nHigh Score: ${this.highScore}`);
        location.reload();
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => new Game());