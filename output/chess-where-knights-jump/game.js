// Knight's Leap - Complete Game Implementation

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingFill = document.getElementById('loadingFill');
        this.loadingText = document.getElementById('loadingText');
        
        // Game state
        this.boardSize = 8;
        this.cellSize = 80;
        this.scale = 1;
        this.gameWidth = 640;
        this.gameHeight = 640;
        
        // Player
        this.knight = {
            x: 280,
            y: 280,
            size: 40,
            speed: 4,
            jumpCooldown: 0,
            jumpCooldownMax: 18, // 0.3s at 60fps
            chainCount: 0,
            chainTimer: 0,
            chainMax: 60 // 1s chain window
        };
        
        // Pawns
        this.pawns = [];
        this.pawnCount = 0;
        
        // Game stats
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.pawnsToCapture = 20;
        this.timer = 90;
        this.timerRunning = true;
        this.gameOver = false;
        this.victory = false;
        
        // Input
        this.keys = {};
        this.touchStart = { x: 0, y: 0 };
        
        // Audio
        this.audio = new AudioManager();
        
        // High score
        this.highScore = parseInt(localStorage.getItem('knightsLeapHighScore') || '0');
        
        // Particles
        this.particles = [];
        
        // Animation frame
        this.lastFrameTime = 0;
        this.accumulatedTime = 0;
        this.fixedTimeStep = 1000 / 60;
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.generatePawns();
        this.bindEvents();
        this.load();
    }
    
    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const maxWidth = Math.min(window.innerWidth, 1280) - 40;
        const maxHeight = Math.min(window.innerHeight, 720) - 40;
        
        this.scale = Math.min(maxWidth / this.gameWidth, maxHeight / this.gameHeight) * dpr;
        
        this.canvas.width = this.gameWidth * this.scale;
        this.canvas.height = this.gameHeight * this.scale;
        this.canvas.style.width = this.gameWidth + 'px';
        this.canvas.style.height = this.gameHeight + 'px';
        
        this.ctx.scale(this.scale, this.scale);
    }
    
    bindEvents() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') e.preventDefault();
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStart = { x: touch.clientX, y: touch.clientY };
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const dx = touch.clientX - this.touchStart.x;
            const dy = touch.clientY - this.touchStart.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 30) this.keys['ArrowRight'] = true;
                else if (dx < -30) this.keys['ArrowLeft'] = true;
            } else {
                if (dy > 30) this.keys['ArrowDown'] = true;
                else if (dy < -30) this.keys['ArrowUp'] = true;
            }
        });
    }
    
    load() {
        const totalAssets = 10;
        let loaded = 0;
        
        const updateProgress = () => {
            loaded++;
            const percent = Math.round((loaded / totalAssets) * 100);
            this.loadingFill.style.width = percent + '%';
            this.loadingText.textContent = `Loading Knight's Leap... ${percent}%`;
            
            if (loaded === totalAssets) {
                setTimeout(() => {
                    this.loadingScreen.style.opacity = '0';
                    this.loadingScreen.style.transition = 'opacity 0.5s';
                    setTimeout(() => {
                        this.loadingScreen.style.display = 'none';
                        this.gameLoop();
                    }, 500);
                }, 500);
            }
        };
        
        // Preload assets (simulated)
        for (let i = 0; i < totalAssets; i++) {
            setTimeout(updateProgress, 100 + Math.random() * 200);
        }
    }
    
    generatePawns() {
        this.pawns = [];
        const occupied = new Set();
        occupied.add(`${Math.floor(this.knight.x / this.cellSize)},${Math.floor(this.knight.y / this.cellSize)}`);
        
        for (let i = 0; i < this.pawnsToCapture; i++) {
            let x, y;
            let attempts = 0;
            do {
                x = Math.floor(Math.random() * this.boardSize) * this.cellSize + this.cellSize / 2;
                y = Math.floor(Math.random() * this.boardSize) * this.cellSize + this.cellSize / 2;
                attempts++;
            } while (occupied.has(`${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`) && attempts < 100);
            
            occupied.add(`${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`);
            this.pawns.push({ x, y, size: 30, captured: false });
        }
        this.pawnCount = this.pawns.length;
    }
    
    gameLoop(timestamp) {
        if (this.gameOver || this.victory) return;
        
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        this.accumulatedTime += deltaTime;
        
        while (this.accumulatedTime >= this.fixedTimeStep) {
            this.update();
            this.accumulatedTime -= this.fixedTimeStep;
        }
        
        this.render();
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }
    
    update() {
        // Update timer
        if (this.timerRunning) {
            this.timer -= 1;
            if (this.timer <= 0) {
                this.timer = 0;
                this.endGame(false);
            }
        }
        
        // Update chain timer
        if (this.knight.chainTimer > 0) this.knight.chainTimer--;
        
        // Update jump cooldown
        if (this.knight.jumpCooldown > 0) this.knight.jumpCooldown--;
        
        // Movement
        let moved = false;
        const newX = this.knight.x;
        const newY = this.knight.y;
        
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.knight.x -= this.knight.speed;
            moved = true;
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            this.knight.x += this.knight.speed;
            moved = true;
        }
        if (this.keys['ArrowUp'] || this.keys['w']) {
            this.knight.y -= this.knight.speed;
            moved = true;
        }
        if (this.keys['ArrowDown'] || this.keys['s']) {
            this.knight.y += this.knight.speed;
            moved = true;
        }
        
        // Boundary check
        this.knight.x = Math.max(0, Math.min(this.gameWidth - this.knight.size, this.knight.x));
        this.knight.y = Math.max(0, Math.min(this.gameHeight - this.knight.size, this.knight.y));
        
        // Collision with pawns (direct contact)
        if (moved) {
            for (let pawn of this.pawns) {
                if (!pawn.captured && this.checkCollision(this.knight, pawn)) {
                    this.loseLife();
                    break;
                }
            }
        }
        
        // Jump logic
        if ((this.keys[' '] || this.keys['ArrowUp'] || this.keys['w']) && this.knight.jumpCooldown <= 0) {
            this.tryJump();
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }
    
    tryJump() {
        const knightCellX = Math.floor(this.knight.x / this.cellSize);
        const knightCellY = Math.floor(this.knight.y / this.cellSize);
        
        const directions = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
            { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 }
        ];
        
        for (let dir of directions) {
            const pawnCellX = knightCellX + dir.dx;
            const pawnCellY = knightCellY + dir.dy;
            const landingCellX = knightCellX + dir.dx * 2;
            const landingCellY = knightCellY + dir.dy * 2;
            
            if (pawnCellX < 0 || pawnCellX >= this.boardSize || pawnCellY < 0 || pawnCellY >= this.boardSize) continue;
            if (landingCellX < 0 || landingCellX >= this.boardSize || landingCellY < 0 || landingCellY >= this.boardSize) continue;
            
            const pawn = this.pawns.find(p => 
                Math.floor(p.x / this.cellSize) === pawnCellX &&
                Math.floor(p.y / this.cellSize) === pawnCellY
            );
            
            if (pawn && !pawn.captured) {
                // Valid jump
                this.knight.x = landingCellX * this.cellSize + this.cellSize / 2 - this.knight.size / 2;
                this.knight.y = landingCellY * this.cellSize + this.cellSize / 2 - this.knight.size / 2;
                pawn.captured = true;
                
                // Score and chain
                this.score += 10;
                this.knight.chainCount++;
                this.knight.chainTimer = 60;
                
                // Bonus for chain
                if (this.knight.chainCount > 1) {
                    this.score += (this.knight.chainCount - 1) * 5;
                }
                
                // Update high score
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('knightsLeapHighScore', this.highScore.toString());
                }
                
                // Create particles
                this.createParticles(pawn.x + pawn.size / 2, pawn.y + pawn.size / 2);
                
                // Play capture sound
                this.audio.play('capture');
                
                // Check victory
                this.pawns = this.pawns.filter(p => !p.captured);
                if (this.pawns.length === 0) {
                    this.endGame(true);
                }
                
                this.knight.jumpCooldown = this.knight.jumpCooldownMax;
                return;
            }
        }
        
        // No pawn to jump over - play bump sound
        this.audio.play('bump');
        this.knight.jumpCooldown = this.knight.jumpCooldownMax;
    }
    
    checkCollision(a, b) {
        return a.x < b.x + b.size &&
               a.x + a.size > b.x &&
               a.y < b.y + b.size &&
               a.y + a.size > b.y;
    }
    
    loseLife() {
        this.lives--;
        this.audio.play('fail');
        
        if (this.lives <= 0) {
            this.endGame(false);
        } else {
            // Reset knight position
            this.knight.x = 280;
            this.knight.y = 280;
            this.knight.chainCount = 0;
        }
    }
    
    endGame(victory) {
        this.victory = victory;
        this.gameOver = true;
        this.timerRunning = false;
        this.audio.play(victory ? 'victory' : 'gameover');
    }
    
    createParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 30,
                size: 4
            });
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Draw background
        this.drawBackground();
        
        // Draw board
        this.drawBoard();
        
        // Draw pawns
        this.drawPawns();
        
        // Draw knight
        this.drawKnight();
        
        // Draw particles
        this.drawParticles();
        
        // Draw UI
        this.drawUI();
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.gameHeight);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#4682B4');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
    }
    
    drawBoard() {
        const colors = ['#F0D9B5', '#B58863'];
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                this.ctx.fillStyle = colors[(row + col) % 2];
                this.ctx.fillRect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
            }
        }
        
        // Grid lines
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.boardSize; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, this.gameHeight);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(this.gameWidth, i * this.cellSize);
            this.ctx.stroke();
        }
    }
    
    drawPawns() {
        this.pawns.forEach(pawn => {
            if (!pawn.captured) {
                // Pawn body
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(pawn.x, pawn.y, pawn.size, pawn.size);
                
                // Pawn head
                this.ctx.fillStyle = '#CD853F';
                this.ctx.fillRect(pawn.x + 5, pawn.y - 8, pawn.size - 10, 8);
                
                // Pawn details
                this.ctx.fillStyle = '#5D4037';
                this.ctx.fillRect(pawn.x + pawn.size / 2 - 2, pawn.y + pawn.size / 2, 4, pawn.size / 2);
            }
        });
    }
    
    drawKnight() {
        const { x, y, size } = this.knight;
        
        // Knight body
        this.ctx.fillStyle = '#DAA520';
        this.ctx.fillRect(x, y, size, size);
        
        // Knight helmet
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillRect(x + 5, y - 12, size - 10, 12);
        
        // Knight details
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x + 5, y + 5, 6, 8);
        this.ctx.fillRect(x + size - 11, y + 5, 6, 8);
        
        // Knight eyes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(x + 10, y + 10, 4, 4);
        this.ctx.fillRect(x + size - 14, y + 10, 4, 4);
    }
    
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.fillStyle = `rgba(255, 215, 0, ${p.life / 30})`;;
            this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
    }
    
    drawUI() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.gameWidth, 50);
        
        // Timer
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        const timeColor = this.timer < 10 ? '#ff4444' : '#fff';
        this.ctx.fillStyle = timeColor;
        this.ctx.fillText(`${Math.floor(this.timer / 60)}:${(this.timer % 60).toString().padStart(2, '0')}`, this.gameWidth / 2, 35);
        
        // Score
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 15, 35);
        
        // Lives
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Lives: ${this.lives}`, this.gameWidth - 15, 35);
        
        // High Score
        this.ctx.fillText(`Best: ${this.highScore}`, this.gameWidth - 15, 55);
        
        // Chain multiplier
        if (this.knight.chainCount > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(`Chain: x${this.knight.chainCount}`, this.gameWidth / 2, 55);
        }
        
        // Progress bar
        const progress = (this.pawnCount - this.pawns.length) / this.pawnCount;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(50, this.gameHeight - 40, this.gameWidth - 100, 15);
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(50, this.gameHeight - 40, (this.gameWidth - 100) * progress, 15);
        
        // Level indicator
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Level ${this.level}`, this.gameWidth / 2, this.gameHeight - 20);
    }
}

class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.loadSounds();
    }
    
    loadSounds() {
        // Create simple oscillator-based sounds
        this.sounds = {
            walk: this.createBeep(200, 0.1, 'sine'),
            jump: this.createBeep(400, 0.15, 'sawtooth'),
            capture: this.createBeep(600, 0.2, 'square'),
            fail: this.createBeep(100, 0.3, 'sawtooth'),
            bump: this.createBeep(150, 0.1, 'triangle'),
            victory: this.createBeep(800, 0.5, 'sine'),
            gameover: this.createBeep(50, 0.5, 'sawtooth')
        };
    }
    
    createBeep(freq, duration, type) {
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }
    
    play(name) {
        if (this.sounds[name]) {
            this.sounds[name]();
        }
    }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});