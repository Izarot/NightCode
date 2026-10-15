class LeafDriftGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 800;
        this.height = 600;
        this.leaf = {
            x: 400,
            y: 50,
            vx: 0,
            vy: 0,
            angle: 0,
            size: 32,
            rotationSpeed: 0.1
        };
        this.gravity = 0.3;
        this.terminalVelocity = 8;
        this.airResistance = 0.95;
        this.bounce = 0.4;
        this.friction = 0.9;
        this.currentStrength = 2.5;
        this.currentRadius = 60;
        this.currentDuration = 30;
        this.currentFrames = 0;
        this.currentCooldown = 0;
        this.currentCooldownMax = 18;
        this.windZones = [];
        this.obstacles = [];
        this.tokens = [];
        this.targetZone = { x: 400, y: 550, radius: 40 };
        this.level = 1;
        this.maxLevel = 50;
        this.score = 0;
        this.highScore = this.loadHighScore();
        this.timeElapsed = 0;
        this.gameState = 'menu';
        this.attempts = 3;
        this.collectedTokens = 0;
        this.particles = [];
        this.audioContext = null;
        this.sounds = {};
        this.lastFrameTime = 0;
        this.fps = 60;
        this.animationFrameId = null;
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.generateLevel();
        this.setupEventListeners();
        this.loadSounds();
        this.updateHUD();
    }

    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const rect = container.getBoundingClientRect();
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.dpr = window.devicePixelRatio || 1;
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
    }

    generateLevel() {
        this.obstacles = [];
        this.tokens = [];
        this.windZones = [];
        const startX = 400;
        const startY = 50;
        this.leaf.x = startX;
        this.leaf.y = startY;
        this.leaf.vx = 0;
        this.leaf.vy = 0;
        this.leaf.angle = 0;
        this.targetZone = { 
            x: 400 + (Math.random() - 0.5) * 100,
            y: 550 + (Math.random() - 0.5) * 50,
            radius: 40
        };
        for (let i = 0; i < 3; i++) {
            this.tokens.push({
                x: 100 + i * 200 + Math.random() * 100,
                y: 150 + Math.random() * 300,
                radius: 12,
                collected: false
            });
        }
        for (let i = 0; i < 5; i++) {
            const obstacleWidth = 50 + Math.random() * 100;
            const obstacleHeight = 20 + Math.random() * 30;
            this.obstacles.push({
                x: Math.random() * (this.width - obstacleWidth),
                y: 100 + i * 80 + Math.random() * 50,
                width: obstacleWidth,
                height: obstacleHeight,
                type: Math.random() > 0.5 ? 'static' : 'moving',
                moveRange: 50,
                moveSpeed: 0.5 + Math.random() * 1,
                direction: Math.random() > 0.5 ? 1 : -1,
                originalX: 0
            });
            this.obstacles[i].originalX = this.obstacles[i].x;
        }
        for (let i = 0; i < 2; i++) {
            this.windZones.push({
                x: 150 + i * 300,
                y: 200 + Math.random() * 200,
                radius: 80,
                strength: 1.2,
                direction: Math.random() * Math.PI * 2
            });
        }
        this.score = 0;
        this.timeElapsed = 0;
        this.collectedTokens = 0;
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }

    handleMouseDown(e) {
        if (this.gameState !== 'playing') return;
        if (this.currentCooldown > 0) return;
        this.createAirCurrent(e);
    }

    handleTouchStart(e) {
        if (this.gameState !== 'playing') return;
        if (this.currentCooldown > 0) return;
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mouseX = touch.clientX - rect.left;
        this.mouseY = touch.clientY - rect.top;
        this.createAirCurrent(e);
    }

    handleTouchMove(e) {
        if (this.gameState !== 'playing') return;
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mouseX = touch.clientX - rect.left;
        this.mouseY = touch.clientY - rect.top;
    }

    createAirCurrent(e) {
        this.currentFrames = this.currentDuration;
        this.currentCooldown = this.currentCooldownMax;
        this.createParticles(this.mouseX, this.mouseY, 'current');
        this.playSound('whoosh');
    }

    loadSounds() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    playSound(type) {
        if (!this.audioContext) return;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        switch (type) {
            case 'whoosh':
                oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
                break;
            case 'collect':
                oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime);
                break;
            case 'bounce':
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                break;
            case 'win':
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                break;
        }
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    createParticles(x, y, type) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 30,
                maxLife: 30,
                type: type
            });
        }
    }

    update() {
        if (this.currentFrames > 0) {
            this.currentFrames--;
        }
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
        this.leaf.vy += this.gravity;
        if (this.leaf.vy > this.terminalVelocity) {
            this.leaf.vy = this.terminalVelocity;
        }
        if (this.currentFrames > 0) {
            const dx = this.mouseX - this.leaf.x;
            const dy = this.mouseY - this.leaf.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < this.currentRadius) {
                this.leaf.vy -= this.currentStrength;
            }
        }
        for (const zone of this.windZones) {
            const dx = zone.x - this.leaf.x;
            const dy = zone.y - this.leaf.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < zone.radius) {
                const angle = Math.atan2(dy, dx);
                this.leaf.vx += Math.cos(zone.direction) * zone.strength;
                this.leaf.vy += Math.sin(zone.direction) * zone.strength;
            }
        }
        this.leaf.vx *= this.airResistance;
        this.leaf.vy *= this.airResistance;
        this.leaf.x += this.leaf.vx;
        this.leaf.y += this.leaf.vy;
        this.leaf.angle = Math.atan2(this.leaf.vy, this.leaf.vx) * 0.5;
        if (this.leaf.x < 0) {
            this.leaf.x = 0;
            this.leaf.vx *= -this.bounce;
            this.playSound('bounce');
        }
        if (this.leaf.x > this.width) {
            this.leaf.x = this.width;
            this.leaf.vx *= -this.bounce;
            this.playSound('bounce');
        }
        for (const obstacle of this.obstacles) {
            if (this.checkCollision(this.leaf, obstacle)) {
                if (this.leaf.vy > 0) {
                    this.leaf.y = obstacle.y - this.leaf.size / 2;
                    this.leaf.vy *= -this.bounce;
                    this.leaf.vx *= this.friction;
                    this.playSound('bounce');
                } else {
                    this.leaf.y = obstacle.y + obstacle.height;
                    this.leaf.vy *= -this.bounce;
                    this.leaf.vx *= this.friction;
                    this.playSound('bounce');
                }
            }
            if (obstacle.type === 'moving') {
                obstacle.x = obstacle.originalX + Math.sin(Date.now() * 0.001 * obstacle.moveSpeed) * obstacle.moveRange;
            }
        }
        for (const token of this.tokens) {
            if (!token.collected && this.checkCircleCollision(this.leaf, token)) {
                token.collected = true;
                this.collectedTokens++;
                this.score += 100;
                this.playSound('collect');
                this.createParticles(token.x, token.y, 'collect');
            }
        }
        if (this.checkCircleCollision(this.leaf, this.targetZone)) {
            this.score += 500;
            if (this.collectedTokens === 3) {
                this.score += 200;
            }
            this.playSound('win');
            this.saveHighScore();
            this.gameState = 'win';
            return;
        }
        if (this.leaf.y > this.height + 100) {
            this.gameState = 'lose';
            this.attempts--;
            if (this.attempts <= 0) {
                this.level--;
                if (this.level < 1) this.level = 1;
                this.attempts = 3;
            }
            this.generateLevel();
        }
        this.updateParticles();
        this.timeElapsed += 1 / this.fps;
    }

    checkCollision(leaf, obstacle) {
        return leaf.x + leaf.size / 2 > obstacle.x &&
               leaf.x - leaf.size / 2 < obstacle.x + obstacle.width &&
               leaf.y + leaf.size / 2 > obstacle.y &&
               leaf.y - leaf.size / 2 < obstacle.y + obstacle.height;
    }

    checkCircleCollision(leaf, circle) {
        const dx = leaf.x - circle.x;
        const dy = leaf.y - circle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < leaf.size / 2 + circle.radius;
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].x += this.particles[i].vx;
            this.particles[i].y += this.particles[i].vy;
            this.particles[i].life--;
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.height - 30, this.width, 30);
        for (const zone of this.windZones) {
            this.ctx.save();
            this.ctx.translate(zone.x, zone.y);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, zone.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
            this.ctx.stroke();
            this.ctx.restore();
        }
        for (const obstacle of this.obstacles) {
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            this.ctx.strokeStyle = '#654321';
            this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
        for (const token of this.tokens) {
            if (!token.collected) {
                this.ctx.save();
                this.ctx.translate(token.x, token.y);
                this.ctx.beginPath();
                this.ctx.arc(0, 0, token.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = '#ffd700';
                this.ctx.fill();
                this.ctx.strokeStyle = '#ff8c00';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                this.ctx.restore();
            }
        }
        this.ctx.save();
        this.ctx.translate(this.leaf.x, this.leaf.y);
        this.ctx.rotate(this.leaf.angle);
        this.ctx.fillStyle = '#ff6b35';
        this.ctx.shadowColor = 'rgba(255, 107, 53, 0.8)';
        this.ctx.shadowBlur = 15;
        this.ctx.beginPath();
        this.ctx.moveTo(-16, 0);
        this.ctx.lineTo(0, -24);
        this.ctx.lineTo(16, 0);
        this.ctx.lineTo(0, 24);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
        this.ctx.save();
        this.ctx.translate(this.targetZone.x, this.targetZone.y);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.targetZone.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        this.ctx.restore();
        for (const particle of this.particles) {
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            if (particle.type === 'collect') {
                this.ctx.fillStyle = '#ffd700';
            } else {
                this.ctx.fillStyle = 'rgba(100, 200, 255, 0.7)';
            }
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, 30);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Score: ' + this.score, 10, 20);
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Time: ' + this.formatTime(this.timeElapsed), this.width / 2, 20);
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Tokens: ' + this.collectedTokens + '/3', this.width - 10, 20);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(this.width - 150, 10, 140, 20);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Level: ' + this.level + '/' + this.maxLevel, this.width - 70, 23);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(10, this.height - 30, 100, 20);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Attempts: ' + this.attempts, 60, this.height - 18);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(this.width - 120, 10, 110, 20);
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('High Score: ' + this.highScore, this.width - 65, 23);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    updateHUD() {
        document.getElementById('score').textContent = 'Score: ' + this.score;
        document.getElementById('timer').textContent = 'Time: ' + this.formatTime(this.timeElapsed);
        document.getElementById('tokens').querySelector('span').textContent = this.collectedTokens + '/3';
        document.getElementById('level').textContent = 'Level: ' + this.level + '/' + this.maxLevel;
        document.getElementById('highScore').textContent = 'High Score: ' + this.highScore;
    }

    loadHighScore() {
        const saved = localStorage.getItem('leafDriftHighScore');
        return saved ? parseInt(saved) : 0;
    }

    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('leafDriftHighScore', this.highScore.toString());
            document.getElementById('highScore').textContent = 'High Score: ' + this.highScore;
        }
    }

    gameLoop(timestamp) {
        if (!this.lastFrameTime) this.lastFrameTime = timestamp;
        const delta = timestamp - this.lastFrameTime;
        if (delta < 1000 / 60) {
            requestAnimationFrame(this.gameLoop.bind(this));
            return;
        }
        this.lastFrameTime = timestamp;
        if (this.gameState === 'playing') {
            this.update();
        }
        this.render();
        this.updateHUD();
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    startGame() {
        this.gameState = 'playing';
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('levelSelect').style.display = 'none';
        document.getElementById('settingsMenu').style.display = 'none';
        this.generateLevel();
        this.lastFrameTime = 0;
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    showLevelSelect() {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('levelSelect').style.display = 'flex';
    }

    showSettings() {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('settingsMenu').style.display = 'flex';
    }

    backToMenu() {
        document.getElementById('mainMenu').style.display = 'flex';
        document.getElementById('levelSelect').style.display = 'none';
        document.getElementById('settingsMenu').style.display = 'none';
    }
}

let game;
function startGame() {
    if (!game) {
        game = new LeafDriftGame();
    } else {
        game.startGame();
    }
}

function showLevelSelect() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('levelSelect').style.display = 'flex';
}

function showSettings() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('settingsMenu').style.display = 'flex';
}

function backToMenu() {
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('levelSelect').style.display = 'none';
    document.getElementById('settingsMenu').style.display = 'none';
}

window.onload = function() {
    game = new LeafDriftGame();
};