import { Projectile } from './projectile.js';
import { Particle, createExplosion } from './particle.js';
import { UI } from './ui.js';

// Web Audio API sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, type, duration, volume = 0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
}

function playExplosionSound() {
    playSound(200, 'square', 0.2, 0.15);
    setTimeout(() => playSound(150, 'square', 0.15, 0.1), 50);
}

function playLevelUpSound() {
    playSound(523.25, 'sine', 0.15, 0.1);
    setTimeout(() => playSound(659.25, 'sine', 0.15, 0.1), 100);
    setTimeout(() => playSound(783.99, 'sine', 0.2, 0.1), 200);
}

function playGameOverSound() {
    playSound(300, 'sawtooth', 0.3, 0.15);
    setTimeout(() => playSound(200, 'sawtooth', 0.3, 0.15), 200);
    setTimeout(() => playSound(150, 'sawtooth', 0.5, 0.15), 400);
}

function playLifeLostSound() {
    playSound(150, 'triangle', 0.2, 0.15);
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.projectiles = [];
        this.particles = [];
        this.score = 0;
        this.lives = 5;
        this.level = 1;
        this.gameRunning = true;
        this.currentPattern = '^[a-z]+$';
        this.patternValid = true;
        this.spawnInterval = null;
        
        this.ui = new UI();
        this.ui.initEventListeners(this);
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.gameLoop();
        this.startSpawning();
        this.ui.startTimer();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    applyPattern() {
        const pattern = this.ui.regexInput.value.trim();
        if (pattern === '') {
            this.patternValid = false;
            this.ui.setPattern(this.currentPattern, false);
            return;
        }
        try {
            new RegExp(pattern);
            this.currentPattern = pattern;
            this.patternValid = true;
            this.ui.setPattern(pattern, true);
            this.checkProjectiles();
        } catch (e) {
            this.patternValid = false;
            this.ui.setPattern(this.currentPattern, false);
        }
    }

    checkProjectiles() {
        if (!this.patternValid) return;
        const regex = new RegExp(this.currentPattern);
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            if (regex.test(this.projectiles[i].text)) {
                this.destroyProjectile(i);
            }
        }
   }
    }

    destroyProjectile(index) {
        const projectile = this.projectiles[index];
        this.particles.push(...createExplosion(projectile.x, projectile.y, projectile.color, 20));
        this.projectiles.splice(index, 1);
        this.score += 10 * this.level;
        this.ui.updateScore(this.score);
        playExplosionSound();
        
        if (this.score >= this.level * 100) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.ui.updateLevel(this.level);
        this.ui.showLevelUp(this.level);
        playLevelUpSound();
        this.startSpawning(); // Restart spawning with new level speed
    }

    spawnProjectile() {
        if (this.gameRunning) {
            this.projectiles.push(new Projectile(this.canvas.width, this.canvas.height, this.level));
        }
    }

    startSpawning() {
        if (this.spawnInterval) clearInterval(this.spawnInterval);
        const spawnRate = Math.max(500, 2000 - this.level * 150);
        this.spawnInterval = setInterval(() => this.spawnProjectile(), spawnRate);
    }

    gameLoop() {
        if (!this.gameRunning) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].update();
            this.projectiles[i].draw(this.ctx);
            
            if (this.projectiles[i].isOffScreen(this.canvas.height)) {
                this.projectiles.splice(i, 1);
                this.loseLife();
            }
        }
        
        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            this.particles[i].draw(this.ctx);
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    loseLife() {
        this.lives--;
        this.ui.updateLives(this.lives);
        this.ui.shakeScreen();
        playLifeLostSound();
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.gameRunning = false;
        clearInterval(this.spawnInterval);
        this.ui.stopTimer();
        playGameOverSound();
        const time = this.ui.getTimerValue().toFixed(2);
        this.ui.showMessage('Game Over', `You scored ${this.score} points in ${time}s. Level reached: ${this.level}`);
    }

    restart() {
        this.projectiles = [];
        this.particles = [];
        this.score = 0;
        this.lives = 5;
        this.level = 1;
        this.gameRunning = true;
        this.currentPattern = '^[a-z]+$';
        this.patternValid = true;
        
        this.ui.updateScore(0);
        this.ui.updateLives(5);
        this.ui.updateLevel(1);
        this.ui.setPattern(this.currentPattern, true);
        this.ui.hideMessage();
        this.ui.clearInput();
        this.ui.startTimer();
        
        this.startSpawning();
        this.gameLoop();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});

if (typeof module !== 'undefined') module.exports = Game;