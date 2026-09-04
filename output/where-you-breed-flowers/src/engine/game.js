import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { AudioEngine } from './audio.js';
import { Genetics } from '../genetics/genetics.js';
import { Garden } from '../entities/garden.js';
import { PatronSystem } from '../entities/patron.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.renderer = new Renderer(this.ctx);
        this.input = new InputHandler(this.canvas);
        this.audio = new AudioEngine();
        this.genetics = new Genetics();
        this.garden = new Garden(this.genetics);
        this.patronSystem = new PatronSystem();
        this.stats = { score: 0, coins: 0, shards: 0 };
        this.startTime = Date.now();
        this.paused = false;
        this.speed = 1;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('pauseBtn').onclick = () => this.paused = !this.paused;
        document.getElementById('speedBtn').onclick = () => this.speed = this.speed === 1 ? 2 : 1;
    }

    update(timestamp) {
        if (this.paused) return;
        const dt = (timestamp - (this.lastTimestamp || timestamp)) / 1000 * this.speed;
        this.lastTimestamp = timestamp;
        
        this.garden.update(dt);
        this.patronSystem.update(dt);
        this.updateTimer();
    }

    updateTimer() {
        const elapsed = Date.now() - this.startTime;
        const mins = Math.floor(elapsed / 60000).toString().padStart(2, '0');
        const secs = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
        const hundredths = Math.floor((elapsed % 1000) / 10).toString().padStart(2, '0');
        document.getElementById('timer').textContent = `${mins}:${secs}.${hundredths}`;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderer.drawBackground();
        this.renderer.drawGarden(this.garden);
        this.renderer.drawParticles();
        this.updateHUD();
    }

    updateHUD() {
        document.getElementById('coins').textContent = this.stats.coins;
        document.getElementById('shards').textContent = this.stats.shards;
    }
}