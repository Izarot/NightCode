import { Engine } from './engine.js';
import { GameWorld } from './world.js';
import { AudioSystem } from './audio.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.engine = new Engine(this.canvas);
        this.world = new GameWorld();
        this.audio = new AudioSystem();
        this.highScore = localStorage.getItem('stackTraceHighScore') || 0;
        this.setupResize();
        this.init();
    }

    async init() {
        await this.audio.init();
        this.engine.start(this.world);
        this.setupInput();
        this.gameLoop();
    }

    setupResize() {
        window.addEventListener('resize', () => {
            this.engine.resize(this.canvas);
        });
    }

    setupInput() {
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyF') this.engine.garbageCollect();
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }

    gameLoop() {
        requestAnimationFrame(() => this.gameLoop());
        this.engine.update();
        this.engine.render(this.ctx);
        this.updateHUD();
    }

    updateHUD() {
        const hud = document.getElementById('hud');
        hud.innerHTML = `
            <div class="hud-element" style="top: 20px; left: 20px;">
                CALL STACK:<br>
                <div id="callStack"></div>
            </div>
            <div class="hud-element" style="top: 20px; right: 20px;">
                CPU: ${Math.round(this.engine.cpuCycles)}%<br>
                SCORE: ${this.engine.score}<br>
                HIGH: ${this.highScore}
            </div>
            <div class="hud-element" style="bottom: 20px; left: 50%; transform: translateX(-50%);">
                <div id="memoryHeap" style="width: 300px; height: 20px; border: 1px solid #30363d; background: #161B22;">
                    <div id="heapFill" style="height: 100%; width: 0%; background: #3FB950;"></div>
                </div>
            </div>
        `;
        
        // Update call stack visualization
        const stack = document.getElementById('callStack');
        if (stack) {
            stack.innerHTML = this.engine.callStack.map(func => 
                `<div style="padding: 2px 8px; margin: 2px 0; background: #21262D; border-radius: 3px; border-left: 3px solid #58A6FF;">
                    ${func}
                </div>`
            ).join('');
        }
        
        // Update memory heap
        const heapFill = document.getElementById('heapFill');
        if (heapFill) {
            heapFill.style.width = `${this.engine.memoryUsage}%`;
            heapFill.style.background = this.engine.memoryUsage > 80 ? '#F85149' : '#3FB950';
        }
    }

    gameOver() {
        if (this.engine.score > this.highScore) {
            this.highScore = this.engine.score;
            localStorage.setItem('stackTraceHighScore', this.highScore);
        }
        this.audio.playSound('gameover');
        setTimeout(() => {
            this.engine.reset();
        }, 2000);
    }
}

window.addEventListener('load', () => new Game());