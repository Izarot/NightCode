// Lava Diversion Game Engine
class LavaDiversion {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Game state
        this.state = 'start'; // start, playing, gameover, victory
        this.score = 0;
        this.startTime = 0;
        this.currentTime = 0;
        
        // Audio context
        this.audioCtx = null;
        this.initAudio();
        
        // Game objects
        this.player = null;
        this.lavaSource = null;
        this.lavaParticles = [];
        this.homes = [];
        this.tunnels = [];
        this.tiles = [];
        
        // Input handling
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        
        this.initEventListeners();
        this.loadHighScore();
    }
    
    setupCanvas() {
        // Responsive canvas sizing
        const updateSize = () => {
            this.canvas.width = Math.min(window.innerWidth, 800);
            this.canvas.height = Math.min(window.innerHeight, 600);
        };
        updateSize();
        window.addEventListener('resize', updateSize);
    }
    
    initAudio() {
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            console.log('Audio not supported');
        }
    }
    
    playSound(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.audioCtx) return;
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        gainNode.gain.value = volume;
        
        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + duration);
    }
    
    initEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' || e.key === 'ArrowUp') e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.handleDig(e.offsetX, e.offsetY);
        });
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.offsetX;
            this.mouse.y = e.offsetY;
            if (this.mouse.down) {
                this.handleDig(e.offsetX, e.offsetY);
            }
        });
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.mouse.down = true;
            this.handleDig(x, y);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            if (this.mouse.down) {
                this.handleDig(x, y);
            }
        });
        this.canvas.addEventListener('touchend', () => {
            this.mouse.down = false;
        });
        
        // Button events
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('restartButton').addEventListener('click', () => this.startGame());
    }
    
    handleDig(x, y) {
        if (this.state !== 'playing') return;
        
        // Convert to tile coordinates
        const tileX = Math.floor(x / 20);
        const tileY = Math.floor(y / 20);
        
        // Check if tile is diggable (ground tile)
        if (this.tiles[tileY] && this.tiles[tileY][tileX] === 'ground') {
            this.tiles[tileY][tileX] = 'tunnel';
            this.tunnels.push({ x: tileX, y: tileY });
            this.playSound(200, 0.1, 'square', 0.05);
            
            // Check if lava can be redirected
            this.checkLavaFlow();
        }
    }
    
    startGame() {
        this.state = 'playing';
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        
        this.score = 0;
        this.startTime = Date.now();
        this.initLevel();
        this.gameLoop();
    }
    
    initLevel() {
        // Initialize tile map
        const width = Math.floor(this.canvas.width / 20);
        const height = Math.floor(this.canvas.height / 20);
        
        this.tiles = [];
        for (let y = 0; y < height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < width; x++) {
                // Ground everywhere except top row
                if (y === 0) {
                    this.tiles[y][x] = 'empty';
                } else if (y === height - 1) {
                    this.tiles[y][x] = 'ground';
                } else if (x === 0 || x === width - 1) {
                    this.tiles[y][x] = 'ground';
                } else {
                    this.tiles[y][x] = 'ground';
                }
            }
        }
        
        // Set lava source in the middle top
        const sourceX = Math.floor(width / 2);
        this.tiles[1][sourceX] = 'lava_source';
        this.lavaSource = { x: sourceX, y: 1 };
        
        // Initialize lava particles
        this.lavaParticles = [];
        for (let i = 0; i < 50; i++) {
            this.lavaParticles.push({
                x: sourceX * 20 + Math.random() * 20,
                y: 1 * 20 + Math.random() * 20,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 2 + 1,
                life: 100
            });
        }
        
        // Initialize homes
        this.homes = [];
        const homePositions = [
            { x: width * 0.2, y: height * 0.7 },
            { x: width * 0.8, y: height * 0.7 }
        ];
        
        homePositions.forEach(pos => {
            this.homes.push({
                x: pos.x,
                y: pos.y,
                health: 100,
                maxHealth: 100
            });
            // Mark home tiles as empty so lava can flow to them
            this.tiles[pos.y][pos.x] = 'home';
        });
        
        // Initialize player
        this.player = {
            x: 100,
            y: 100,
            vx: 0,
            vy: 0,
            health: 100,
            onGround: false,
            jumpPower: -12,
            moveSpeed: 5,
            width: 20,
            height: 20
        };
        
        // Reset tunnels
        this.tunnels = [];
    }
    
    checkLavaFlow() {
        // Simple lava flow check - if lava can reach homes through tunnels
        // This is a simplified version - in a real game you'd use pathfinding
        let homesAtRisk = 0;
        
        for (const home of this.homes) {
            // Check if there's a path from lava source to home through tunnels
            if (this.hasPathToHome(home)) {
                homesAtRisk++;
            }
        }
        
        // Update UI
        this.updateUI();
    }
    
    hasPathToHome(home) {
        // Simplified pathfinding - check if there are tunnels connecting source to home
        // In a real implementation, you'd use BFS or A* algorithm
        return this.tunnels.length > 0; // Simplified for demo
    }
    
    updatePhysics() {
        if (this.state !== 'playing') return;
        
        this.currentTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Update player physics
        this.updatePlayer();
        
        // Update lava particles
        this.updateLava();
        
        // Check collisions
        this.checkCollisions();
        
        // Update homes
        this.updateHomes();
        
        // Check game over conditions
        this.checkGameOver();
        
        // Update UI
        this.updateUI();
    }
    
    updatePlayer() {
        // Horizontal movement
        if (this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']) {
            this.player.vx = -this.player.moveSpeed;
        } else if (this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']) {
            this.player.vx = this.player.moveSpeed;
        } else {
            this.player.vx *= 0.8; // Friction
        }
        
        // Jumping
        if ((this.keys[' '] || this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']) && this.player.onGround) {
            this.player.vy = this.player.jumpPower;
            this.player.onGround = false;
            this.playSound(300, 0.1, 'square', 0.05);
        }
        
        // Apply gravity
        this.player.vy += 0.5; // Gravity acceleration
        
        // Update position
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        // Ground collision
        const tileY = Math.floor((this.player.y + this.player.height) / 20);
        const tileX = Math.floor(this.player.x / 20);
        
        if (this.tiles[tileY] && this.tiles[tileY][tileX] === 'ground') {
            this.player.y = tileY * 20 - this.player.height;
            this.player.vy = 0;
            this.player.onGround = true;
        } else {
            this.player.onGround = false;
        }
        
        // Boundary checks
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.canvas.width - this.player.width) this.player.x = this.canvas.width - this.player.width;
        if (this.player.y > this.canvas.height) {
            this.player.health = 0; // Fall damage
        }
    }
    
    updateLava() {
        // Update lava particles
        for (const particle of this.lavaParticles) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravity for lava
            particle.life--;
            
            // Remove dead particles
            if (particle.life <= 0 || particle.y > this.canvas.height) {
                particle.x = this.lavaSource.x * 20 + Math.random() * 20;
                particle.y = this.lavaSource.y * 20 + Math.random() * 20;
                particle.life = 100;
            }
            
            // Check if lava particle hit a home
            for (const home of this.homes) {
                if (this.checkCollision(particle, home)) {
                    home.health -= 0.5;
                    particle.life = 0; // Remove particle on impact
                }
            }
        }
        
        // Filter dead particles
        this.lavaParticles = this.lavaParticles.filter(p => p.life > 0);
    }
    
    updateHomes() {
        // Update home health based on lava proximity
        for (const home of this.homes) {
            if (home.health <= 0) {
                home.health = 0;
            }
        }
    }
    
    checkCollisions() {
        // Player-lava collision
        for (const particle of this.lavaParticles) {
            if (this.checkCollision(this.player, particle)) {
                this.player.health -= 1;
                particle.life = 0;
                this.playSound(100, 0.2, 'sawtooth', 0.1);
            }
        }
        
        // Filter dead particles again
        this.lavaParticles = this.lavaParticles.filter(p => p.life > 0);
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + 20 &&
               obj1.x + 20 > obj2.x &&
               obj1.y < obj2.y + 20 &&
               obj1.y + 20 > obj2.y;
    }
    
    checkGameOver() {
        const allHomesDestroyed = this.homes.every(home => home.health <= 0);
        const playerDead = this.player.health <= 0;
        
        if (allHomesDestroyed) {
            this.endGame('Game Over', 'All homes destroyed!');
        } else if (playerDead) {
            this.endGame('Game Over', 'Player died!');
        } else if (this.homes.every(home => home.health >= home.maxHealth)) {
            // Victory condition - all homes safe (simplified)
            this.score += 1000;
            this.endGame('Victory!', 'All homes saved!');
        }
    }
    
    endGame(title, message) {
        this.state = 'gameover';
        document.getElementById('gameOverTitle').textContent = title;
        document.getElementById('gameOverMessage').textContent = message;
        document.getElementById('gameOverScreen').style.display = 'flex';
        
        // Save high score
        this.saveHighScore();
    }
    
    updateUI() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('timer').textContent = `Time: ${this.currentTime}s`;
        
        // Update health bars
        const playerHealth = document.getElementById('playerHealth');
        playerHealth.style.width = `${Math.max(0, this.player.health)}%`;
        
        const homeHealth = document.getElementById('homeHealth');
        const avgHomeHealth = this.homes.reduce((sum, home) => sum + home.health, 0) / this.homes.length;
        homeHealth.style.width = `${Math.max(0, avgHomeHealth)}%`;
        
        const lavaLevel = document.getElementById('lavaLevel');
        lavaLevel.style.width = `${Math.min(100, this.lavaParticles.length * 2)}%`;
    }
    
    renderFrame() {
        // Clear canvas
        this.ctx.fillStyle = '#2B2B2B';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.state !== 'playing') return;
        
        // Render tiles
        this.renderTiles();
        
        // Render tunnels
        this.renderTunnels();
        
        // Render lava
        this.renderLava();
        
        // Render homes
        this.renderHomes();
        
        // Render player
        this.renderPlayer();
        
        // Render UI overlay
        this.renderUI();
    }
    
    renderTiles() {
        for (let y = 0; y < this.tiles.length; y++) {
            for (let x = 0; x < this.tiles[y].length; x++) {
                const tile = this.tiles[y][x];
                const px = x * 20;
                const py = y * 20;
                
                if (tile === 'ground') {
                    this.ctx.fillStyle = '#5C4033';
                    this.ctx.fillRect(px, py, 20, 20);
                } else if (tile === 'lava_source') {
                    this.ctx.fillStyle = '#FF4500';
                    this.ctx.fillRect(px, py, 20, 20);
                    
                    // Add glow effect
                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowColor = '#FF6347';
                    this.ctx.fillRect(px, py, 20, 20);
                    this.ctx.shadowBlur = 0;
                } else if (tile === 'home') {
                    // Homes are rendered separately
                }
            }
        }
    }
    
    renderTunnels() {
        for (const tunnel of this.tunnels) {
            const px = tunnel.x * 20;
            const py = tunnel.y * 20;
            
            this.ctx.fillStyle = 'rgba(139, 69, 19, 0.7)';
            this.ctx.fillRect(px, py, 20, 20);
            
            // Add tunnel border
            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(px, py, 20, 20);
        }
    }
    
    renderLava() {
        for (const particle of this.lavaParticles) {
            // Create gradient for glowing effect
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, 10
            );
            gradient.addColorStop(0, '#FF6347');
            gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 10, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    renderHomes() {
        for (const home of this.homes) {
            const px = home.x * 20;
            const py = home.y * 20;
            
            // Draw home base
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(px, py, 20, 20);
            
            // Draw roof
            this.ctx.fillStyle = '#FF6347';
            this.ctx.beginPath();
            this.ctx.moveTo(px, py);
            this.ctx.lineTo(px + 10, py - 10);
            this.ctx.lineTo(px + 20, py);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Draw health bar
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(px, py - 15, 20, 5);
            
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillRect(px, py - 15, (home.health / home.maxHealth) * 20, 5);
        }
    }
    
    renderPlayer() {
        const px = this.player.x;
        const py = this.player.y;
        
        // Player body
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(px, py, this.player.width, this.player.height);
        
        // Player outline
        this.ctx.strokeStyle = '#2E7D32';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(px, py, this.player.width, this.player.height);
        
        // Health bar
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(px, py - 15, this.player.width, 5);
        
        this.ctx.fillStyle = '#F44336';
        this.ctx.fillRect(px, py - 15, (this.player.health / 100) * this.player.width, 5);
    }
    
    renderUI() {
        // Draw digging indicator
        if (this.mouse.down) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.mouse.x, this.mouse.y);
            this.ctx.lineTo(this.mouse.x + 10, this.mouse.y + 10);
            this.ctx.stroke();
        }
    }
    
    gameLoop() {
        if (this.state === 'playing') {
            this.updatePhysics();
            this.renderFrame();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    loadHighScore() {
        this.highScore = localStorage.getItem('lavaDiversionHighScore') || 0;
    }
    
    saveHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('lavaDiversionHighScore', this.highScore);
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new LavaDiversion();
});