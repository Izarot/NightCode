class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.player = new Player(this.canvas.width/2, this.canvas.height/2);
        this.assets = [];
        this.inventory = [];
        this.score = 0;
        this.highScore = localStorage.getItem('courseArchitectHighScore') || 0;
        this.timer = 0;
        this.gameState = 'navigation';
        this.keys = {};
        this.setupEventListeners();
        this.loadAssets();
        this.lastTime = 0;
        requestAnimationFrame((time) => this.loop(time));
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' && this.gameState === 'navigation') {
                this.collectAsset();
            }
            if (e.key === 'e' || e.key === 'E') {
                this.publishCourse();
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.gameState === 'authoring') {
                this.handleDragStart(e);
            }
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.gameState === 'authoring') {
                this.handleDragMove(e);
            }
        });
        this.canvas.addEventListener('mouseup', () => {
            if (this.gameState === 'authoring') {
                this.handleDragEnd();
            }
        });
    }
    
    loadAssets() {
        this.assets = [
            {x: 200, y: 200, type: 'video', color: '#3B82F6', collected: false},
            {x: 400, y: 300, type: 'text', color: '#10B981', collected: false},
            {x: 600, y: 200, type: 'quiz', color: '#EF4444', collected: false}
        ];
    }
    
    collectAsset() {
        const nearAsset = this.assets.find(asset => 
            !asset.collected && Math.hypot(asset.x - this.player.x, asset.y - this.player.y) < 30
        );
        if (nearAsset) {
            nearAsset.collected = true;
            this.inventory.push(nearAsset);
            this.playSound('collect');
        }
    }
    
    publishCourse() {
        if (this.inventory.length > 0) {
            this.score += this.inventory.length * 100;
            this.inventory = [];
            this.playSound('publish');
            this.showShimmer();
        }
    }
    
    showShimmer() {
        // Simple shimmer effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    handleDragStart(e) {
        if (this.inventory.length > 0) {
            this.draggingAsset = {
                ...this.inventory[this.inventory.length - 1],
                startX: e.clientX,
                startY: e.clientY,
                currentX: e.clientX,
                currentY: e.clientY
            };
        }
    }
    
    handleDragMove(e) {
        if (this.draggingAsset) {
            this.draggingAsset.currentX = e.clientX;
            this.draggingAsset.currentY = e.clientY;
        }
    }
    
    handleDragEnd() {
        if (this.draggingAsset) {
            const gridX = Math.floor(this.draggingAsset.currentX / 40) * 40;
            const gridY = Math.floor(this.draggingAsset.currentY / 40) * 40;
            this.assets.push({
                x: gridX,
                y: gridY,
                type: this.draggingAsset.type,
                color: this.draggingAsset.color,
                collected: true
            });
            this.draggingAsset = null;
        }
    }
    
    playSound(type) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        if (type === 'collect') {
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
        } else if (type === 'publish') {
            oscillator.frequency.value = 1200;
            oscillator.type = 'triangle';
        }
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    loop(time) {
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        this.timer += deltaTime / 1000;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((t) => this.loop(t));
    }
    
    update(deltaTime) {
        this.player.update(this.keys, this.canvas);
        
        // Check for high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('courseArchitectHighScore', this.highScore);
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#F8F9FA';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid if in authoring mode
        if (this.gameState === 'authoring') {
            this.drawGrid();
        }
        
        // Draw assets
        this.assets.forEach(asset => this.drawAsset(asset));
        
        // Draw player
        this.drawPlayer();
        
        // Draw HUD
        this.drawHUD();
        
        // Draw dragging asset
        if (this.draggingAsset) {
            this.drawAsset(this.draggingAsset, true);
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawAsset(asset, isDragging = false) {
        this.ctx.save();
        
        if (isDragging) {
            this.ctx.globalAlpha = 0.7;
            this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 5;
            this.ctx.shadowOffsetY = 5;
        }
        
        this.ctx.fillStyle = asset.color;
        this.ctx.fillRect(asset.x, asset.y, 30, 30);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '20px Poppins';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const icon = asset.type === 'video' ? '▶' : asset.type === 'text' ? 'T' : '?';
        this.ctx.fillText(icon, asset.x + 15, asset.y + 15);
        
        this.ctx.restore();
    }
    
    drawPlayer() {
        this.ctx.fillStyle = '#0D9488';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw direction indicator
        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x, this.player.y);
        this.ctx.lineTo(
            this.player.x + Math.cos(this.player.angle) * 15,
            this.player.y + Math.sin(this.player.angle) * 15
        );
        this.ctx.stroke();
    }
    
    drawHUD() {
        // Timer
        this.ctx.fillStyle = '#0D9488';
        this.ctx.font = 'bold 16px Poppins';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Time: ${Math.floor(this.timer)}s`, 20, 30);
        
        // High Score
        this.ctx.fillStyle = '#F59E0B';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`High Score: ${this.highScore}`, this.canvas.width - 20, 30);
        
        // Score
        this.ctx.fillStyle = '#0D9488';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 20, 60);
        
        // Progress bar
        const progress = Math.min(this.score / 1000, 1);
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fillRect(20, this.canvas.height - 40, this.canvas.width - 40, 10);
        this.ctx.fillStyle = '#0D9488';
        this.ctx.fillRect(20, this.canvas.height - 40, (this.canvas.width - 40) * progress, 10);
        
        // Instructions
        this.ctx.fillStyle = '#666';
        this.ctx.font = '14px Poppins';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('WASD/Arrows: Move | Space: Collect | E: Publish', this.canvas.width/2, this.canvas.height - 20);
    }
}

// Player class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.speed = 6;
        this.acceleration = 0.5;
        this.friction = 0.85;
    }
    
    update(keys, canvas) {
        let ax = 0, ay = 0;
        
        if (keys['w'] || keys['W'] || keys['ArrowUp']) ay -= this.acceleration;
        if (keys['s'] || keys['S'] || keys['ArrowDown']) ay += this.acceleration;
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) ax -= this.acceleration;
        if (keys['d'] || keys['D'] || keys['ArrowRight']) ax += this.acceleration;
        
        this.vx += ax;
        this.vy += ay;
        
        // Limit speed
        const speed = Math.hypot(this.vx, this.vy);
        if (speed > this.speed) {
            this.vx = (this.vx / speed) * this.speed;
            this.vy = (this.vy / speed) * this.speed;
        }
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Boundary collision
        this.x = Math.max(10, Math.min(canvas.width - 10, this.x));
        this.y = Math.max(10, Math.min(canvas.height - 10, this.y));
        
        // Update angle
        if (speed > 0.1) {
            this.angle = Math.atan2(this.vy, this.vx);
        }
    }
}

// Initialize game
window.onload = () => new Game();