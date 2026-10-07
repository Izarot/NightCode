// Tempest Duel - Game Logic
// ===========================

class TempestDuel {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // Game state
        this.state = 'PLAYING'; // PLAYING, PAUSED, GAME_OVER
        this.player = {
            x: 100, y: 300, vx: 0, lane: 1, hp: 100, maxHp: 100,
            color: '#00BFFF', maxSpeed: 120, acceleration: 480, deceleration: 600, friction: 0.85
        };
        this.opponent = {
            x: 700, y: 300, vx: 0, lane: 1, hp: 100, maxHp: 100,
            color: '#FF1493', maxSpeed: 120, acceleration: 480, deceleration: 600, friction: 0.85
        };
        
        // Weather system
        this.weather = { type: 'clear', turns: 0, particles: [] };
        this.weatherPresets = {
            clear: { maxSpeedMult: 1.0, friction: 1.0, color: '#87CEEB', particleType: 'none' },
            rain: { maxSpeedMult: 0.85, friction: 1.1, color: '#4A90E2', particleType: 'rain' },
            sandstorm: { maxSpeedMult: 0.90, friction: 1.05, color: '#D4A017', particleType: 'sand' },
            fire: { maxSpeedMult: 1.10, friction: 1.0, color: '#FF4500', particleType: 'fire' },
            blizzard: { maxSpeedMult: 0.80, friction: 1.2, color: '#87CEEB', particleType: 'snow' },
            aurora: { maxSpeedMult: 1.0, friction: 1.0, color: '#9370DB', particleType: 'aurora' }
        };
        
        // Card system
        this.hand = [];
        this.deck = this.generateDeck();
        this.energy = 3;
        this.maxEnergy = 3;
        this.turn = 0;
        
        // Input handling
        this.keys = {};
        this.lastLaneChange = 0;
        this.laneChangeCooldown = 200;
        
        // Audio
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // High score
        this.highScore = parseInt(localStorage.getItem('tempestDuelHighScore')) || 0;
        
        this.init();
    }
    
    setupCanvas() {
        const resize = () => {
            const container = this.canvas.parentElement;
            const maxWidth = Math.min(800, container.clientWidth - 40);
            this.canvas.style.width = maxWidth + 'px';
            this.canvas.style.height = (maxWidth * 0.75) + 'px';
        };
        window.addEventListener('resize', resize);
        resize();
    }
    
    init() {
        this.drawCard(5);
        this.updateUI();
        this.gameLoop();
        this.setupEventListeners();
    }
    
    generateDeck() {
        const cards = [];
        const cardTypes = [
            { name: 'Rain', cost: 1, type: 'rain', effect: 'Slippery conditions' },
            { name: 'Sandstorm', cost: 2, type: 'sandstorm', effect: 'Reduced visibility' },
            { name: 'Fire', cost: 2, type: 'fire', effect: 'Speed boost zones' },
            { name: 'Blizzard', cost: 3, type: 'blizzard', effect: 'Heavy drag' },
            { name: 'Aurora', cost: 2, type: 'aurora', effect: 'Mystical aura' },
            { name: 'Basic Attack', cost: 1, type: 'attack', effect: 'Deal 10 damage' }
        ];
        
        for (let i = 0; i < 30; i++) {
            const card = cardTypes[Math.floor(Math.random() * cardTypes.length)];
            cards.push({ ...card, id: Math.random() });
        }
        return cards;
    }
    
    drawCard(count) {
        for (let i = 0; i < count && this.deck.length > 0; i++) {
            this.hand.push(this.deck.pop());
        }
    }
    
    playCard(cardIndex) {
        const card = this.hand[cardIndex];
        if (card.cost > this.energy) return;
        
        this.energy -= card.cost;
        this.hand.splice(cardIndex, 1);
        
        // Apply card effects
        if (card.type === 'rain' || card.type === 'sandstorm' || 
            card.type === 'fire' || card.type === 'blizzard' || card.type === 'aurora') {
            this.applyWeather(card.type);
        } else if (card.type === 'attack') {
            this.dealDamage(this.opponent, 10);
        }
        
        this.playSound('card_play');
        this.updateUI();
    }
    
    applyWeather(type) {
        this.weather.type = type;
        this.weather.turns = 3;
        const preset = this.weatherPresets[type];
        
        // Apply physics modifiers
        this.player.maxSpeed = 120 * preset.maxSpeedMult;
        this.opponent.maxSpeed = 120 * preset.maxSpeedMult;
        this.player.friction = 0.85 * preset.friction;
        this.opponent.friction = 0.85 * preset.friction;
        
        // Create particles
        this.weather.particles = [];
        for (let i = 0; i < 50; i++) {
            this.weather.particles.push({
                x: Math.random() * 800,
                y: Math.random() * 600,
                vx: Math.random() * 2 - 1,
                vy: Math.random() * 3 + 1,
                life: 1.0,
                type: preset.particleType
            });
        }
        
        this.updateWeatherUI();
    }
    
    dealDamage(target, amount) {
        target.hp = Math.max(0, target.hp - amount);
        this.playSound('hit');
        
        if (target.hp <= 0) {
            this.gameOver(target === this.opponent);
        }
    }
    
    updateWeatherUI() {
        const timer = document.getElementById('weatherTimer');
        if (this.weather.type !== 'clear') {
            timer.textContent = `${this.weather.type.toUpperCase()} ${this.weather.turns}`;
        } else {
            timer.textContent = '';
        }
    }
    
    updateUI() {
        // Update health bars
        document.getElementById('p1hp').textContent = this.player.hp;
        document.getElementById('p2hp').textContent = this.opponent.hp;
        document.getElementById('p1health').style.width = (this.player.hp / this.player.maxHp * 100) + '%';
        document.getElementById('p2health').style.width = (this.opponent.hp / this.opponent.maxHp * 100) + '%';
        
        // Update energy
        const energyContainer = document.getElementById('energyCounter');
        energyContainer.innerHTML = '';
        for (let i = 0; i < this.maxEnergy; i++) {
            const orb = document.createElement('div');
            orb.className = 'energy-orb' + (i < this.energy ? ' filled' : '');
            energyContainer.appendChild(orb);
        }
        
        // Update hand
        const handContainer = document.getElementById('cardHand');
        handContainer.innerHTML = '';
        this.hand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = `card cost-${card.cost} ${card.type}`;
            cardElement.innerHTML = `<div>${card.name}</div><div>Cost: ${card.cost}</div>`;
            cardElement.onclick = () => this.playCard(index);
            handContainer.appendChild(cardElement);
        });
    }
    
    gameLoop() {
        const currentTime = performance.now();
        const dt = 0.016; // 60 FPS
        
        this.update(dt);
        this.render();
        
        if (this.state === 'PLAYING') {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    update(dt) {
        this.updatePhysics(dt);
        this.updateWeather(dt);
        this.updateParticles(dt);
        this.checkCombat();
    }
    
    updatePhysics(dt) {
        // Player movement
        let ax = 0;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) ax = -this.player.acceleration;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) ax = this.player.acceleration;
        
        this.player.vx += ax * dt;
        
        // Apply friction if no acceleration
        if (ax === 0) {
            this.player.vx *= (1 - this.player.deceleration * dt * 0.1);
        }
        
        // Clamp velocity
        this.player.vx = Math.max(-this.player.maxSpeed, Math.min(this.player.maxSpeed, this.player.vx));
        
        // Update position
        this.player.x += this.player.vx * dt;
        
        // Boundary check
        if (this.player.x < 20) this.player.x = 20;
        if (this.player.x > 780) this.player.x = 780;
        
        // Lane change (Space)
        const now = Date.now();
        if (this.keys['Space'] && now - this.lastLaneChange > this.laneChangeCooldown) {
            this.player.lane = this.player.lane === 0 ? 1 : 0;
            this.player.y = this.player.lane === 0 ? 200 : 400;
            this.player.vx = 0;
            this.lastLaneChange = now;
        }
        
        // Simple opponent AI
        if (this.opponent.x > this.player.x + 50) {
            this.opponent.vx = -this.opponent.maxSpeed * 0.7;
        } else if (this.opponent.x < this.player.x - 50) {
            this.opponent.vx = this.opponent.maxSpeed * 0.7;
        } else {
            this.opponent.vx *= 0.9;
        }
        
        this.opponent.x += this.opponent.vx * dt;
        if (this.opponent.x < 700) this.opponent.x = 700;
        if (this.opponent.x > 780) this.opponent.x = 780;
    }
    
    updateWeather(dt) {
        if (this.weather.turns > 0) {
            this.weather.turns -= dt;
            if (this.weather.turns <= 0) {
                this.clearWeather();
            }
            this.updateWeatherUI();
        }
    }
    
    clearWeather() {
        this.weather.type = 'clear';
        this.weather.turns = 0;
        this.player.maxSpeed = 120;
        this.opponent.maxSpeed = 120;
        this.player.friction = 0.85;
        this.opponent.friction = 0.85;
        this.updateWeatherUI();
    }
    
    updateParticles(dt) {
        this.weather.particles = this.weather.particles.filter(p => p.life > 0);
        
        this.weather.particles.forEach(p => {
            p.x += p.vx * dt * 60;
            p.y += p.vy * dt * 60;
            p.life -= dt * 0.5;
            
            // Reset particles that go off screen
            if (p.y > 600 || p.x < 0 || p.x > 800) {
                p.x = Math.random() * 800;
                p.y = -10;
                p.life = 1.0;
            }
        });
    }
    
    checkCombat() {
        const dx = Math.abs(this.player.x - this.opponent.x);
        if (dx < 120) {
            // Auto-attack logic would go here
            // For now, just visual indicator
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.weatherPresets[this.weather.type].color;
        this.ctx.fillRect(0, 0, 800, 600);
        
        // Draw weather particles
        this.drawWeatherParticles();
        
        // Draw arena
        this.drawArena();
        
        // Draw avatars
        this.drawAvatar(this.player);
        this.drawAvatar(this.opponent);
        
        // Draw combat indicator if in range
        const dx = Math.abs(this.player.x - this.opponent.x);
        if (dx < 120) {
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.x, this.player.y);
            this.ctx.lineTo(this.opponent.x, this.opponent.y);
            this.ctx.stroke();
        }
    }
    
    drawArena() {
        // Field boundary
        this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(100, 100, 600, 400);
        
        // Lane indicators
        this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(100, 300);
        this.ctx.lineTo(700, 300);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    drawAvatar(unit) {
        this.ctx.save();
        this.ctx.translate(unit.x, unit.y);
        
        // Snow accumulation for blizzard
        if (this.weather.type === 'blizzard') {
            this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 15, 20, 5, 0, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Avatar body
        this.ctx.fillStyle = unit.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Direction indicator
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.moveTo(unit.vx > 0 ? 10 : -10, -5);
        this.ctx.lineTo(unit.vx > 0 ? 15 : -15, 0);
        this.ctx.lineTo(unit.vx > 0 ? 10 : -10, 5);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawWeatherParticles() {
        this.weather.particles.forEach(p => {
            this.ctx.save();
            
            switch(p.type) {
                case 'rain':
                    this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.7)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p.x - 1, p.y + 15);
                    this.ctx.stroke();
                    break;
                case 'sand':
                    this.ctx.fillStyle = 'rgba(212, 160, 23, 0.6)';
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                case 'fire':
                    this.ctx.fillStyle = `rgba(255, ${Math.random() * 100 + 50}, 0, 0.7)`;
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                case 'snow':
                    this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p.x + 5, p.y + 15);
                    this.ctx.lineTo(p.x - 5, p.y + 15);
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
                case 'aurora':
                    this.ctx.strokeStyle = 'rgba(147, 112, 219, 0.3)';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p.x + 20, p.y - 10);
                    this.ctx.stroke();
                    break;
            }
            
            this.ctx.restore();
        });
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') e.preventDefault();
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Card dragging
        let draggedCard = null;
        document.getElementById('cardHand').addEventListener('dragstart', (e) => {
            draggedCard = parseInt(e.target.dataset.index);
            e.dataTransfer.effectAllowed = 'move';
        });
        
        document.getElementById('cardHand').addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });
        
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggedCard !== null) {
                this.playCard(draggedCard);
                draggedCard = null;
            }
        });
    }
    
    playSound(type) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        switch(type) {
            case 'card_play':
                oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                break;
            case 'hit':
                oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                break;
        }
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    gameOver(playerWon) {
        this.state = 'GAME_OVER';
        const score = this.player.hp;
        
        if (playerWon && score > this.highScore) {
            this.highScore = score;
            localStorage.setItem('tempestDuelHighScore', this.highScore);
        }
        
        this.showToast(playerWon ? `Victory! Score: ${score}` : `Defeat! Score: ${score}`);
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.querySelector('.game-container').appendChild(toast);
        
        setTimeout(() => toast.remove(), 2000);
    }
}

// Global functions for pause menu
function resumeGame() {
    game.state = 'PLAYING';
    document.getElementById('pauseMenu').style.display = 'none';
    game.gameLoop();
}

function restartGame() {
    location.reload();
}

function quitGame() {
    window.close();
}

// Initialize game
let game;
window.addEventListener('load', () => {
    game = new TempestDuel();
});
