import { GameEngine } from './core/game-engine.js';
import { Renderer } from './core/renderer.js';
import { InputHandler } from './core/input.js';
import { ResourceManager } from './core/resources.js';
import { UnitManager } from './entities/unit-manager.js';
import { SoundManager } from './audio/sound-manager.js';

class BactariaGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.engine = new GameEngine(this);
        this.renderer = new Renderer(this);
        this.input = new InputHandler(this);
        this.resources = new ResourceManager(this);
        this.units = new UnitManager(this);
        this.sound = new SoundManager();
        
        this.highScore = localStorage.getItem('bactaria-high-score') || 0;
        this.updateHighScoreDisplay();
        
        this.gameState = {
            nutrients: 50,
            mp: 0,
            health: 100,
            startTime: null,
            isRunning: false
        };
        
        this.init();
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    async init() {
        await this.sound.init();
        this.startGame();
    }
    
    startGame() {
        this.gameState.startTime = Date.now();
        this.gameState.isRunning = true;
        this.engine.start();
    }
    
    updateUI() {
        document.getElementById('nutrient-count').textContent = this.gameState.nutrients;
        document.getElementById('mp-count').textContent = this.gameState.mp;
        document.getElementById('health-percent').textContent = Math.max(0, Math.round(this.gameState.health)) + '%';
        
        const elapsed = Math.floor((Date.now() - this.gameState.startTime) / 1000);
        const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const secs = String(elapsed % 60).padStart(2, '0');
        document.getElementById('time-display').textContent = `${mins}:${secs}`;
    }
    
    updateHighScoreDisplay() {
        document.getElementById('high-score-display').textContent = this.highScore;
    }
    
    gameOver() {
        this.gameState.isRunning = false;
        const elapsed = Math.floor((Date.now() - this.gameState.startTime) / 1000);
        if (elapsed > this.highScore) {
            this.highScore = elapsed;
            localStorage.setItem('bactaria-high-score', this.highScore);
            this.updateHighScoreDisplay();
        }
        alert(`Game Over! Time: ${elapsed}s`);
    }
}

window.addEventListener('load', () => {
    new BactariaGame();
});