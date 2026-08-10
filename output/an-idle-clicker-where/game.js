// Main game file - modular structure
import { GameEngine } from './src/engine.js';
import { InputManager } from './src/input.js';
import { Renderer } from './src/render.js';
import { EntityManager } from './src/entities.js';
import { Economy } from './src/economy.js';
import { AudioManager } from './src/audio.js';
import { Storage } from './src/storage.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerElement = document.getElementById('speedrunTimer');

// Initialize managers
const inputManager = new InputManager();
const audioManager = new AudioManager();
const storage = new Storage();
const economy = new Economy(storage);
const entityManager = new EntityManager();
const renderer = new Renderer(ctx, canvas);

// Game engine with fixed timestep
class GameEngine {
    constructor() {
        this.lastTimestamp = 0;
        this.accumulator = 0;
        this.physicsTimeStep = 1 / 60;
        this.running = true;
        this.startTime = performance.now();
        this.elapsedTime = 0;
        this.state = 'PLAYING';
        this.init();
    }

    init() {
        // Load saved data
        const savedData = storage.load();
        if (savedData) {
            economy.loadFromSave(savedData);
            entityManager.loadFromSave(savedData);
        }

        // Start game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    gameLoop(timestamp) {
        if (!this.running) return;

        const dt = (timestamp - this.lastTimestamp) / 1000;
        this.lastTimestamp = timestamp;
        this.accumulator += dt;
        this.elapsedTime = (timestamp - this.startTime) / 1000;

        // Update speedrun timer
        this.updateSpeedrunTimer();

        // Fixed physics updates
        while (this.accumulator >= this.physicsTimeStep) {
            this.update(this.physicsTimeStep);
            this.accumulator -= this.physicsTimeStep;
        }

        // Render
        this.render();

        // Auto-save every 5 seconds
        if (timestamp - (storage.lastSaveTime || 0) >= 5000) {
            this.saveGame();
            storage.lastSaveTime = timestamp;
        }

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        // Update input
        inputManager.update(dt);

        // Update economy (RPS, currency)
        economy.update(dt, inputManager);

        // Update entities (avatar, currency)
        entityManager.update(dt, economy, inputManager, renderer);

        // Update audio
        audioManager.update();
    }

    render() {
        renderer.clear();
        renderer.renderBackground();
        renderer.renderCurrency(entityManager.currencies);
        renderer.renderAvatar(entityManager.avatar);
        renderer.renderUI(economy, entityManager);
        renderer.renderParticles(entityManager.particles);
    }

    updateSpeedrunTimer() {
        const minutes = Math.floor(this.elapsedTime / 60);
        const seconds = Math.floor(this.elapsedTime % 60);
        const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timerElement.textContent = `Time: ${formatted}`;
    }

    saveGame() {
        const saveData = {
            economy: economy.save(),
            entityManager: entityManager.save(),
            elapsedTime: this.elapsedTime
        };
        storage.save(saveData);
    }
}

// Start the game
const game = new GameEngine();

// Handle window resize
window.addEventListener('resize', () => {
    const container = document.getElementById('gameContainer');
    const canvas = document.getElementById('gameCanvas');
    const scale = Math.min(container.clientWidth / 640, container.clientHeight / 480);
    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = 'top left';
});