import { initInput } from './input.js';
import { initAudio } from './audio.js';
import { GameState } from './state.js';
import { updateMagnet, updateObjects, checkCollisions } from './physics.js';
import { renderGame } from './render.js';

class MagneticMayhem {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.gameState = new GameState();
        this.input = initInput(this.canvas);
        this.audio = initAudio();
        
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
        
        this.setupEventListeners();
    }
    
    resizeCanvas() {
        this.canvas.width = Math.min(window.innerWidth - 40, 1200);
        this.canvas.height = Math.min(window.innerHeight - 40, 800);
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
    }
    
    startGame() {
        this.gameState.startGame();
        document.getElementById('startMenu').style.display = 'none';
        this.gameLoop(performance.now());
    }
    
    togglePause() {
        this.gameState.togglePause();
        if (!this.gameState.isPaused) {
            this.gameLoop(performance.now());
        }
    }
    
    gameLoop(currentTime) {
        if (this.gameState.isPaused) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        if (this.gameState.isRunning) {
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    update(deltaTime) {
        if (!this.gameState.isRunning) return;
        
        this.gameState.updateTimer(deltaTime);
        this.updateMagnet(deltaTime);
        this.updateObjects(deltaTime);
        this.checkCollisions();
        this.updateUI();
        
        if (this.gameState.timer <= 0 || this.gameState.isDead) {
            this.gameOver();
        }
    }
    
    updateMagnet(deltaTime) {
        updateMagnet(this.gameState, this.input, deltaTime);
    }
    
    updateObjects(deltaTime) {
        updateObjects(this.gameState, deltaTime);
    }
    
    checkCollisions() {
        checkCollisions(this.gameState, this.audio);
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.gameState.score;
        document.getElementById('timer').textContent = Math.ceil(this.gameState.timer / 1000);
        document.getElementById('powerPercent').textContent = Math.round(this.gameState.magnetPower) + '%';
        document.getElementById('powerFill').style.width = Math.min(this.gameState.magnetPower, 200) / 2 + '%';
    }
    
    render() {
        renderGame(this.ctx, this.gameState, this.canvas);
    }
    
    gameOver() {
        this.gameState.isRunning = false;
        this.saveHighScore();
        document.getElementById('startMenu').innerHTML = `
            <h1>Game Over</h1>
            <p>Final Score: ${this.gameState.score}</p>
            <p>High Score: ${this.getHighScore()}</p>
            <button id="restartBtn">Play Again</button>
        `;
        document.getElementById('startMenu').style.display = 'flex';
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());
    }
    
    saveHighScore() {
        const current = this.getHighScore();
        if (this.gameState.score > current) {
            localStorage.setItem('magneticMayhemHighScore', this.gameState.score);
        }
    }
    
    getHighScore() {
        return parseInt(localStorage.getItem('magneticMayhemHighScore')) || 0;
    }
}

window.addEventListener('load', () => new MagneticMayhem());