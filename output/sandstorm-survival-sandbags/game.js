class ColorCascadeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width = window.innerWidth < 600 ? window.innerWidth - 40 : 560;
        this.height = this.canvas.height = 400;
        
        this.colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#ff6b6b', '#1dd1a1'];
        this.circles = [];
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('colorCascadeHighScore')) || 0;
        this.gameOver = false;
        this.startTime = null;
        this.timerInterval = null;
        this.lastSpawn = 0;
        this.spawnRate = 1000;
        
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.setupEventListeners();
        this.resizeCanvas();
        this.gameLoop();
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width;
        this.height = 400;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    handleClick(e) {
        if (this.gameOver) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.circles.forEach((circle, index) => {
            const dx = x - circle.x;
            const dy = y - circle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < circle.radius) {
                this.circles.splice(index, 1);
                this.score += circle.points;
                this.playSound(0.8, 200);
                this.updateScoreDisplay();
            }
        });
    }
    
    playSound(frequency, duration) {
        try {
            const oscillator = this.audioCtx.createOscillator();
            const gainNode = this.audioCtx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioCtx.destination);
            
            oscillator.frequency.value = frequency * 100;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration / 1000);
            
            oscillator.start();
            oscillator.stop(this.audioCtx.currentTime + duration / 1000);
        } catch (e) {
            console.log('Audio not supported');
        }
    }
    
    spawnCircle() {
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const radius = Math.random() * 40 + 20;
        const x = Math.random() * (this.width - radius * 2) + radius;
        const y = Math.random() * (this.height - radius * 2) + radius;
        const points = Math.floor(Math.random() * 10) + 1;
        
        this.circles.push({
            x, y, radius, color, points,
            speedX: (Math.random() - 0.5) * 2,
            speedY: (Math.random() - 0.5) * 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.05
        });
    }
    
    update(deltaTime) {
        if (this.gameOver) return;
        
        this.lastSpawn += deltaTime;
        if (this.lastSpawn > this.spawnRate) {
            this.spawnCircle();
            this.lastSpawn = 0;
            this.spawnRate = Math.max(500, 1000 - this.score * 0.5);
        }
        
        this.circles.forEach(circle => {
            circle.x += circle.speedX;
            circle.y += circle.speedY;
            circle.rotation += circle.rotationSpeed;
            
            if (circle.x < circle.radius || circle.x > this.width - circle.radius) {
                circle.speedX *= -1;
            }
            if (circle.y < circle.radius || circle.y > this.height - circle.radius) {
                circle.speedY *= -1;
            }
        });
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#f7fafc';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.circles.forEach(circle => {
            this.ctx.save();
            this.ctx.translate(circle.x, circle.y);
            this.ctx.rotate(circle.rotation);
            
            this.ctx.fillStyle = circle.color;
            this.ctx.shadowColor = circle.color + '80';
            this.ctx.shadowBlur = 15;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, circle.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(circle.points, 0, 0);
            
            this.ctx.restore();
        });
    }
    
    gameLoop(timestamp) {
        if (!this.startTime) this.startTime = timestamp;
        const deltaTime = timestamp - this.lastSpawn;
        
        this.update(deltaTime);
        this.draw();
        
        if (!this.gameOver) {
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }
    
    updateTimer() {
        if (this.gameOver) return;
        
        const elapsed = Date.now() - this.startTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const displaySeconds = seconds % 60;
        
        document.getElementById('timer').textContent = `⏱️ ${minutes}:${displaySeconds.toString().padStart(2, '0')}`;
    }
    
    updateScoreDisplay() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('colorCascadeHighScore', this.highScore.toString());
            document.getElementById('highScore').textContent = `🏆 HS: ${this.highScore}`;
        }
    }
    
    endGame() {
        this.gameOver = true;
        clearInterval(this.timerInterval);
        
        document.getElementById('gameOver').style.display = 'block';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalHighScore').textContent = this.highScore;
    }
}

let game;
function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    game = new ColorCascadeGame();
}

window.onload = function() {
    game = new ColorCascadeGame();
    
    setInterval(() => game.updateTimer(), 1000);
    
    document.getElementById('highScore').textContent = `🏆 HS: ${game.highScore}`;
};