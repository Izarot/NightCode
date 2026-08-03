import { Engine } from './physics/engine.js';
import { GearManager } from './gear/gearManager.js';
import { Renderer } from './render/renderer.js';
import { UI } from './ui/ui.js';
import { Audio } from './audio/audio.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 800;
        this.height = 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.audio = new Audio();
        this.ui = new UI(this);
        this.engine = new Engine(this.width, this.height);
        this.gears = new GearManager();
        this.renderer = new Renderer(this.ctx, this.width, this.height);
        
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.isComplete = false;

        this.setupInput();
    }

    setupInput() {
        window.addEventListener('keydown', (e) => this.engine.handleInput(e, true));
        window.addEventListener('keyup', (e) => this.engine.handleInput(e, false));
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.isRunning || this.isPaused) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            const scaleY = this.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            if (e.button === 0) {
                this.gears.interact(x, y, 'rotate');
                this.audio.play('click');
            } else if (e.button === 2) {
                this.gears.interact(x, y, 'snap');
                this.audio.play('snap');
            }
        });

        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    }

    start() {
        this.isRunning = true;
        this.startTime = Date.now();
        this.loop();
    }

    loop() {
        if (!this.isRunning) return;

        if (!this.isPaused && !this.isComplete) {
            this.elapsedTime = (Date.now() - this.startTime) / 1000;
            this.engine.update();
            this.gears.update();
            this.checkWinCondition();
        }

        this.renderer.draw(this.engine, this.gears, this.elapsedTime, this.isComplete);
        this.ui.update(this.elapsedTime, this.gears.getPowerLevel());

        requestAnimationFrame(() => this.loop());
    }

    checkWinCondition() {
        if (this.gears.getPowerLevel() >= 100 && !this.isComplete) {
            this.isComplete = true;
            this.audio.play('win');
            this.ui.showWin(this.elapsedTime);
        }
    }
}

const game = new Game();
window.startGame = () => {
    document.getElementById('start-screen').classList.add('hidden');
    game.start();
};

export { game };