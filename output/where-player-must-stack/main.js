// Stack-Shift Game Implementation
// ================================

// Game Configuration
const CONFIG = {
    canvasWidth: 1920,
    canvasHeight: 1080,
    baseBlockSize: { width: 100, height: 40 },
    blockRanges: { width: [30, 80], height: [20, 60] },
    gravity: 9.81,
    timeStep: 0.05,
    stabilityRadius: 50, // Base block width / 2
    tolerance: 5,
    colors: {
        primary: '#ff6b6b',
        secondary: '#4ecdc4',
        accent: '#ffe66d',
        background: '#1a1a2e',
        text: '#ffffff',
        stable: '#4caf50',
        warning: '#ff9800',
        critical: '#f44336'
    },
    audio: {
        enabled: true,
        volume: 0.3
    }
};

// Game State
const gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    height: 0,
    bestHeight: localStorage.getItem('stackShiftBestHeight') || 0,
    bestScore: localStorage.getItem('stackShiftBestScore') || 0,
    tower: [],
    currentBlock: null,
    stability: 100,
    timer: 300, // 5 minutes
    particles: [],
    camera: { x: 0, y: 0, scale: 1 }
};

// Physics Engine
class PhysicsEngine {
    constructor() {
        this.bodies = [];
        this.gravity = CONFIG.gravity;
    }

    addBody(body) {
        this.bodies.push(body);
    }

    removeBody(body) {
        const index = this.bodies.indexOf(body);
        if (index > -1) this.bodies.splice(index, 1);
    }

    update(deltaTime) {
        // Apply gravity
        this.bodies.forEach(body => {
            if (!body.isStatic) {
                body.velocity.y += this.gravity * deltaTime;
                body.position.y += body.velocity.y * deltaTime;
                body.position.x += body.velocity.x * deltaTime;
                body.angle += body.angularVelocity * deltaTime;
            }
        });

        // Collision detection and response
        this.checkCollisions();

        // Update center of mass
        this.updateCenterOfMass();
    }

    checkCollisions() {
        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                if (this.aabbCollision(this.bodies[i], this.bodies[j])) {
                    this.resolveCollision(this.bodies[i], this.bodies[j]);
                }
            }
        }
    }

    aabbCollision(a, b) {
        return a.position.x < b.position.x + b.width &&
               a.position.x + a.width > b.position.x &&
               a.position.y < b.position.y + b.height &&
               a.position.y + a.height > b.position.y;
    }

    resolveCollision(a, b) {
        // Simple impulse response
        const overlapX = Math.min(a.position.x + a.width, b.position.x + b.width) -
                        Math.max(a.position.x, b.position.x);
        const overlapY = Math.min(a.position.y + a.height, b.position.y + b.height) -
                        Math.max(a.position.y, b.position.y);

        if (overlapX < overlapY) {
            // Resolve on X axis
            if (a.position.x < b.position.x) {
                a.position.x -= overlapX / 2;
                b.position.x += overlapX / 2;
            } else {
                a.position.x += overlapX / 2;
                b.position.x -= overlapX / 2;
            }
        } else {
            // Resolve on Y axis
            if (a.position.y < b.position.y) {
                a.position.y -= overlapY / 2;
                b.position.y += overlapY / 2;
            } else {
                a.position.y += overlapY / 2;
                b.position.y -= overlapY / 2;
            }
        }
    }

    updateCenterOfMass() {
        if (this.bodies.length === 0) return { x: 0, y: 0 };

        let totalMass = 0;
        let comX = 0;
        let comY = 0;

        this.bodies.forEach(body => {
            const mass = body.width * body.height;
            totalMass += mass;
            comX += body.position.x * mass;
            comY += body.position.y * mass;
        });

        return {
            x: comX / totalMass,
            y: comY / totalMass
        };
    }

    getCenterOfMass() {
        return this.updateCenterOfMass();
    }
}

// Block Class
class Block {
    constructor(x, y, width, height) {
        this.position = { x, y };
        this.width = width;
        this.height = height;
        this.velocity = { x: 0, y: 0 };
        this.angularVelocity = 0;
        this.angle = 0;
        this.isStatic = false;
        this.color = this.getRandomColor();
    }

    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff8e8e', '#6dd5ed'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.position.x + this.width/2, this.position.y + this.height/2);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        ctx.restore();
    }
}

// Particle System
class Particle {
    constructor(x, y, color) {
        this.position = { x, y };
        this.velocity = { 
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10 - 5
        };
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.velocity.y += 0.2; // Gravity
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Audio System
class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = CONFIG.audio.enabled;
        this.init();
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio not supported');
            this.enabled = false;
        }
    }

    playSound(type) {
        if (!this.enabled || !this.ctx) return;

        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        switch(type) {
            case 'place':
                oscillator.frequency.setValueAtTime(400, this.ctx.currentTime);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, this.ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
                break;
            case 'collapse':
                oscillator.frequency.setValueAtTime(100, this.ctx.currentTime);
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
                break;
            case 'success':
                oscillator.frequency.setValueAtTime(800, this.ctx.currentTime);
                oscillator.type = 'triangle';
                gainNode.gain.setValueAtTime(0.2, this.ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
                break;
        }

        oscillator.start(this.ctx.currentTime);
        oscillator.stop(this.ctx.currentTime + 0.5);
    }
}

// Input Handler
class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.mouseX = 0;
        this.touchX = 0;
        this.isDragging = false;
        this.onPlacement = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        });

        this.canvas.addEventListener('mousedown', () => {
            this.handlePlacement();
        });

        // Keyboard events
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                this.handlePlacement();
            } else if (e.key === 'ArrowLeft' || e.key === 'a') {
                this.mouseX -= 20;
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                this.mouseX += 20;
            }
        });

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.touchX = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            this.isDragging = true;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                this.touchX = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
            }
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isDragging = false;
            this.handlePlacement();
        });
    }

    handlePlacement() {
        if (this.onPlacement && gameState.currentBlock) {
            this.onPlacement(this.mouseX || this.touchX);
        }
    }

    getCurrentX() {
        return this.mouseX || this.touchX || this.canvas.width / 2;
    }
}

// Game Controller
class StackShiftGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.physics = new PhysicsEngine();
        this.audio = new AudioSystem();
        this.input = new InputHandler(this.canvas);
        this.lastTime = 0;
        this.setupCanvas();
        this.setupInputCallbacks();
        this.loadBestScores();
        this.startGame();
    }

    setupCanvas() {
        // Set canvas to maintain aspect ratio
        const container = document.getElementById('game-container');
        const containerRect = container.getBoundingClientRect();
        
        // Calculate scale to fit container while maintaining 16:9
        const containerAspect = containerRect.width / containerRect.height;
        const targetAspect = 16 / 9;
        
        if (containerAspect > targetAspect) {
            // Container is wider - fit height
            this.canvas.height = containerRect.height;
            this.canvas.width = containerRect.height * targetAspect;
        } else {
            // Container is taller - fit width
            this.canvas.width = containerRect.width;
            this.canvas.height = containerRect.width / targetAspect;
        }

        // Set CSS to maintain responsiveness
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        
        // Calculate scale factor for coordinate conversion
        this.scaleX = this.canvas.width / CONFIG.canvasWidth;
        this.scaleY = this.canvas.height / CONFIG.canvasHeight;
    }

    setupInputCallbacks() {
        this.input.onPlacement = (x) => {
            this.placeBlock(x);
        };
    }

    loadBestScores() {
        gameState.bestHeight = parseInt(localStorage.getItem('stackShiftBestHeight')) || 0;
        gameState.bestScore = parseInt(localStorage.getItem('stackShiftBestScore')) || 0;
    }

    startGame() {
        gameState.isPlaying = true;
        gameState.score = 0;
        gameState.height = 0;
        gameState.tower = [];
        gameState.particles = [];
        gameState.stability = 100;
        gameState.timer = 300;
        
        // Create base block
        const baseBlock = new Block(
            this.canvas.width / 2 - CONFIG.baseBlockSize.width / 2,
            this.canvas.height - CONFIG.baseBlockSize.height - 50,
            CONFIG.baseBlockSize.width,
            CONFIG.baseBlockSize.height
        );
        baseBlock.isStatic = true;
        baseBlock.color = CONFIG.colors.secondary;
        
        gameState.tower.push(baseBlock);
        this.physics.addBody(baseBlock);
        
        this.generateNextBlock();
        this.gameLoop(0);
    }

    generateNextBlock() {
        const width = Math.random() * (CONFIG.blockRanges.width[1] - CONFIG.blockRanges.width[0]) + CONFIG.blockRanges.width[0];
        const height = Math.random() * (CONFIG.blockRanges.height[1] - CONFIG.blockRanges.height[0]) + CONFIG.blockRanges.height[0];
        
        gameState.currentBlock = new Block(
            this.canvas.width / 2 - width / 2,
            100,
            width,
            height
        );
    }

    placeBlock(x) {
        if (!gameState.currentBlock) return;

        const block = gameState.currentBlock;
        block.position.x = x - block.width / 2;
        block.position.y = this.getTowerTopY() - block.height - 10;

        // Add to physics and tower
        this.physics.addBody(block);
        gameState.tower.push(block);
        
        // Create particles
        for (let i = 0; i < 10; i++) {
            gameState.particles.push(new Particle(
                block.position.x + block.width / 2,
                block.position.y + block.height,
                block.color
            ));
        }

        this.audio.playSound('place');
        
        // Update game state
        gameState.height++;
        gameState.score += Math.floor(block.width * block.height / 100);
        
        // Check stability
        setTimeout(() => this.checkStability(), 100);
        
        // Generate next block
        this.generateNextBlock();
    }

    getTowerTopY() {
        let topY = this.canvas.height;
        gameState.tower.forEach(block => {
            if (block.position.y < topY) {
                topY = block.position.y;
            }
        });
        return topY;
    }

    checkStability() {
        const com = this.physics.getCenterOfMass();
        const towerCenterX = this.canvas.width / 2;
        const distance = Math.abs(com.x - towerCenterX);
        const maxDistance = CONFIG.stabilityRadius;
        
        gameState.stability = Math.max(0, (1 - distance / maxDistance) * 100);
        
        if (distance > maxDistance + CONFIG.tolerance) {
            this.gameOver();
        }
    }

    gameOver() {
        gameState.isPlaying = false;
        this.audio.playSound('collapse');
        
        // Update best scores
        if (gameState.height > gameState.bestHeight) {
            gameState.bestHeight = gameState.height;
            localStorage.setItem('stackShiftBestHeight', gameState.bestHeight);
        }
        if (gameState.score > gameState.bestScore) {
            gameState.bestScore = gameState.score;
            localStorage.setItem('stackShiftBestScore', gameState.bestScore);
        }
        
        this.showGameOverScreen();
    }

    showGameOverScreen() {
        const overlay = document.getElementById('uiOverlay');
        overlay.innerHTML = `
            <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; background:rgba(0,0,0,0.8); padding:40px; border-radius:10px;">
                <h2 style="color:${CONFIG.colors.accent}; margin-bottom:20px;">Tower Collapsed!</h2>
                <p>Height: ${gameState.height} blocks</p>
                <p>Score: ${gameState.score}</p>
                <p>Best Height: ${gameState.bestHeight}</p>
                <button onclick="game.startGame()" style="margin-top:20px; padding:10px 20px; background:${CONFIG.colors.primary}; border:none; border-radius:5px; color:white; cursor:pointer;">Retry</button>
            </div>
        `;
    }

    gameLoop(currentTime) {
        if (!gameState.isPlaying) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Update physics
        this.physics.update(deltaTime);
        
        // Update particles
        gameState.particles = gameState.particles.filter(p => p.life > 0);
        gameState.particles.forEach(p => p.update());
        
        // Update timer
        if (deltaTime > 0) {
            gameState.timer -= deltaTime;
            if (gameState.timer <= 0) {
                this.gameOver();
            }
        }
        
        // Update current block position
        if (gameState.currentBlock) {
            const x = this.input.getCurrentX();
            gameState.currentBlock.position.x = x - gameState.currentBlock.width / 2;
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = CONFIG.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stability indicator
        this.drawStabilityIndicator();
        
        // Draw tower blocks
        gameState.tower.forEach(block => block.draw(this.ctx));
        
        // Draw current block (ghost)
        if (gameState.currentBlock) {
            this.ctx.globalAlpha = 0.4;
            gameState.currentBlock.draw(this.ctx);
            this.ctx.globalAlpha = 1;
        }
        
        // Draw particles
        gameState.particles.forEach(p => p.draw(this.ctx));
        
        // Draw HUD
        this.drawHUD();
    }

    drawStabilityIndicator() {
        const centerX = this.canvas.width / 2;
        const centerY = this.getTowerTopY() - 100;
        const radius = CONFIG.stabilityRadius;
        
        // Outer circle (stability zone)
        this.ctx.strokeStyle = gameState.stability > 50 ? CONFIG.colors.stable : 
                              gameState.stability > 20 ? CONFIG.colors.warning : CONFIG.colors.critical;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Center of mass indicator
        const com = this.physics.getCenterOfMass();
        this.ctx.fillStyle = CONFIG.colors.accent;
        this.ctx.beginPath();
        this.ctx.arc(com.x, com.y, 5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawHUD() {
        // Score panel
        this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
        this.ctx.fillRect(20, 20, 200, 100);
        
        this.ctx.fillStyle = CONFIG.colors.text;
        this.ctx.font = '24px Inter, sans-serif';
        this.ctx.fillText(`Height: ${gameState.height}`, 40, 50);
        this.ctx.fillText(`Best: ${gameState.bestHeight}`, 40, 80);
        
        // Stability meter
        this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
        this.ctx.fillRect(this.canvas.width / 2 - 100, 20, 200, 40);
        
        const stabilityColor = gameState.stability > 50 ? CONFIG.colors.stable : 
                              gameState.stability > 20 ? CONFIG.colors.warning : CONFIG.colors.critical;
        this.ctx.fillStyle = stabilityColor;
        this.ctx.fillRect(this.canvas.width / 2 - 100, 20, (gameState.stability / 100) * 200, 40);
        
        this.ctx.fillStyle = CONFIG.colors.text;
        this.ctx.fillText(`Stability: ${Math.floor(gameState.stability)}%`, this.canvas.width / 2 - 80, 45);
        
        // Timer
        this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
        this.ctx.fillRect(this.canvas.width - 220, 20, 200, 40);
        
        this.ctx.fillStyle = CONFIG.colors.text;
        this.ctx.fillText(`Time: ${Math.ceil(gameState.timer)}s`, this.canvas.width - 200, 45);
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new StackShiftGame();
});

// Handle window resize
window.addEventListener('resize', () => {
    if (game) {
        game.setupCanvas();
    }
});