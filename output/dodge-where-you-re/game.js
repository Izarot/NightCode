class NinjaStarDodge {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.player = {
            x: 0, y: 0, vx: 0, vy: 0,
            radius: 20, color: '#FFD700',
            rotation: 0, alive: true,
            speed: 8
        };
        
        this.boomerangs = [];
        this.particles = [];
        this.score = 0;
        this.combo = 0;
        this.lives = 3;
        this.gameState = 'start';
        this.startTime = 0;
        this.currentTime = 0;
        
        this.keys = {};
        this.setupEventListeners();
        this.setupAudio();
        
        this.lastSpawnTime = 0;
        this.spawnInterval = 2000;
    }
    
    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height / 2;
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' && this.gameState === 'start') this.startGame();
            if (e.key === 'Escape') this.toggleFullscreen();
        });
        document.addEventListener('keyup', (e) => this.keys[e.key] = false);
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
    }
    
    setupAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    playSound(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.combo = 0;
        this.lives = 3;
        this.boomerangs = [];
        this.particles = [];
        this.startTime = Date.now();
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.updateHUD();
    }
    
    gameOver() {
        this.gameState = 'gameover';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalTime').textContent = ((Date.now() - this.startTime) / 1000).toFixed(1);
        document.getElementById('gameOverScreen').classList.remove('hidden');
        this.playSound(200, 0.5, 'sawtooth');
        
        // Save high score
        const highScore = localStorage.getItem('ninjaStarDodgeHigh') || 0;
        if (this.score > highScore) {
            localStorage.setItem('ninjaStarDodgeHigh', this.score);
        }
    }
    
    spawnBoomerang() {
        const side = Math.floor(Math.random() * 3);
        let startX, startY, angle;
        
        if (side === 0) { // Left
            startX = -50;
            startY = Math.random() * this.canvas.height;
            angle = Math.random() * Math.PI/3 - Math.PI/6; // ±30°
        } else if (side === 1) { // Right
            startX = this.canvas.width + 50;
            startY = Math.random() * this.canvas.height;
            angle = Math.random() * Math.PI/3 + 5*Math.PI/6;
        } else { // Bottom
            startX = Math.random() * this.canvas.width;
            startY = this.canvas.height + 50;
            angle = Math.random() * Math.PI/3 - Math.PI/2;
        }
        
        this.boomerangs.push({
            x: startX,
            y: startY,
            angle: angle,
            speed: 0,
            maxSpeed: 6,
            acceleration: 0.1,
            life: 12000,
            spawned: Date.now(),
            trail: []
        });
        
        this.playSound(300, 0.2, 'triangle');
    }
    
    updatePlayer() {
        let moveX = 0, moveY = 0;
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) moveX = -1;
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) moveX = 1;
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) moveY = -1;
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) moveY = 1;
        
        this.player.vx = moveX * this.player.speed;
        this.player.vy = moveY * this.player.speed;
        
        // Apply friction
        this.player.vx *= 0.95;
        this.player.vy *= 0.95;
        
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        // Clamp to canvas
        this.player.x = Math.max(this.player.radius, Math.min(this.canvas.width - this.player.radius, this.player.x));
        this.player.y = Math.max(this.player.radius, Math.min(this.canvas.height - this.player.radius, this.player.y));
        
        // Rotation
        this.player.rotation += 0.5 * Math.PI / 180 / 60;
        
        // Fast movement glow
        const speed = Math.sqrt(this.player.vx**2 + this.player.vy**2);
        if (speed > 4) {
            this.createParticle(this.player.x, this.player.y, '#ff4500', 2);
        }
    }
    
    updateBoomerangs() {
        for (let i = this.boomerangs.length - 1; i >= 0; i--) {
            const b = this.boomerangs[i];
            const elapsed = Date.now() - b.spawned;
            
            // Speed curve: accelerate then decelerate
            if (elapsed < 800) {
                b.speed += b.acceleration;
            } else if (elapsed < 1600) {
                b.speed -= b.acceleration;
            }
            b.speed = Math.max(0, Math.min(b.maxSpeed, b.speed));
            
            // Movement
            b.x += Math.cos(b.angle) * b.speed;
            b.y += Math.sin(b.angle) * b.speed;
            
            // Trail
            b.trail.push({x: b.x, y: b.y});
            if (b.trail.length > 5) b.trail.shift();
            
            // Return path (reverse direction at edges)
            if (b.x < -50 || b.x > this.canvas.width + 50 || b.y < -50 || b.y > this.canvas.height + 50) {
                b.angle += Math.PI; // Reverse direction
                if (b.x < -50) b.x = 0;
                if (b.x > this.canvas.width + 50) b.x = this.canvas.width;
                if (b.y < -50) b.y = 0;
                if (b.y > this.canvas.height + 50) b.y = this.canvas.height;
            }
            
            // Lifetime check
            if (elapsed > b.life) {
                this.boomerangs.splice(i, 1);
                continue;
            }
            
            // Collision detection
            this.checkCollision(b);
        }
    }
    
    checkCollision(boomerang) {
        const dx = this.player.x - boomerang.x;
        const dy = this.player.y - boomerang.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance < this.player.radius + 15) {
            // Direct hit
            this.lives--;
            this.combo = 0;
            this.createExplosion(boomerang.x, boomerang.y);
            this.playSound(150, 0.3, 'sawtooth');
            
            if (this.lives <= 0) {
                this.gameOver();
            }
        } else if (distance < this.player.radius + 40) {
            // Near miss - visual warning
            this.createParticle(boomerang.x, boomerang.y, '#ff0000', 3);
            this.score = Math.max(0, this.score - 5);
        } else if (distance < this.player.radius + 60) {
            // Perfect dodge bonus
            this.score += 100;
            this.combo = Math.min(5, this.combo + 1);
            this.createExplosion(boomerang.x, boomerang.y, '#00ff00', 5);
            this.playSound(800, 0.1, 'square');
        } else {
            // Normal dodge
            this.score += 10;
            this.combo = Math.min(5, this.combo + 1);
        }
        
        this.updateHUD();
    }
    
    createParticle(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 30,
                color: color,
                size: Math.random() * 3 + 1
            });
        }
    }
    
    createExplosion(x, y, color, count) {
        this.createParticle(x, y, color, count);
        // Screen shake effect
        this.screenShake = 5;
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.vx *= 0.98;
            p.vy *= 0.98;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateHUD() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('combo').textContent = this.combo;
        document.getElementById('healthFill').style.width = (this.lives / 3 * 100) + '%';
    }
    
    updateTimer() {
        if (this.gameState === 'playing') {
            this.currentTime = (Date.now() - this.startTime) / 1000;
            document.getElementById('timer').textContent = this.currentTime.toFixed(1) + 's';
        }
    }
    
    drawBackground() {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a2a');
        gradient.addColorStop(1, '#1a1a3a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grid pattern
        this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        this.ctx.lineWidth = 0.5;
        for (let x = 0; x <= this.canvas.width; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.canvas.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawPlayer() {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.rotation);
        
        // Glow effect when moving fast
        const speed = Math.sqrt(this.player.vx**2 + this.player.vy**2);
        if (speed > 4) {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = '#ff4500';
        }
        
        // Draw star
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            this.ctx.lineTo(
                Math.cos((i * 2 * Math.PI) / 5 - Math.PI/2) * this.player.radius,
                Math.sin((i * 2 * Math.PI) / 5 - Math.PI/2) * this.player.radius
            );
            this.ctx.lineTo(
                Math.cos(((i * 2 + 1) * Math.PI) / 5 - Math.PI/2) * this.player.radius * 0.5,
                Math.sin(((i * 2 + 1) * Math.PI) / 5 - Math.PI/2) * this.player.radius * 0.5
            );
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        // Outline
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    drawBoomerangs() {
        for (const b of this.boomerangs) {
            // Trail
            if (b.trail.length > 1) {
                this.ctx.beginPath();
                this.ctx.moveTo(b.trail[0].x, b.trail[0].y);
                for (let i = 1; i < b.trail.length; i++) {
                    this.ctx.lineTo(b.trail[i].x, b.trail[i].y);
                }
                this.ctx.strokeStyle = 'rgba(255,69,0,0.5)';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }
            
            // Boomerang body
            this.ctx.save();
            this.ctx.translate(b.x, b.y);
            this.ctx.rotate(b.angle);
            
            this.ctx.fillStyle = '#ff4500';
            this.ctx.beginPath();
            this.ctx.moveTo(10, 0);
            this.ctx.quadraticCurveTo(5, -5, 0, -10);
            this.ctx.quadraticCurveTo(-5, -5, -10, 0);
            this.ctx.quadraticCurveTo(-5, 5, 0, 10);
            this.ctx.quadraticCurveTo(5, 5, 10, 0);
            this.ctx.closePath();
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#8b0000';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }
    
    drawParticles() {
        for (const p of this.particles) {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life / 30;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }
    
    gameLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake
        if (this.screenShake > 0) {
            this.ctx.save();
            this.ctx.translate(
                (Math.random() - 0.5) * this.screenShake,
                (Math.random() - 0.5) * this.screenShake
            );
            this.screenShake *= 0.9;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }
        
        this.drawBackground();
        
        if (this.gameState === 'playing') {
            this.updatePlayer();
            this.updateBoomerangs();
            this.updateParticles();
            this.updateTimer();
            
            // Spawn boomerangs
            if (Date.now() - this.lastSpawnTime > this.spawnInterval) {
                this.spawnBoomerang();
                this.lastSpawnTime = Date.now();
                this.spawnInterval = 1500 + Math.random() * 2500;
            }
        }
        
        this.drawPlayer();
        this.drawBoomerangs();
        this.drawParticles();
        
        if (this.screenShake > 0) {
            this.ctx.restore();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}

// Initialize game
window.addEventListener('load', () => {
    const game = new NinjaStarDodge();
    game.gameLoop();
});