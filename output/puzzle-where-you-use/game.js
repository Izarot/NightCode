import { Physics } from './physics.js';
import { EntityManager } from './entities.js';
import { AudioEngine } from './audio.js';

export class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.entities = new EntityManager();
        this.physics = new Physics();
        this.audio = new AudioEngine();
        this.running = false;
        this.score = 0;
        this.moves = 0;
        this.energy = 100;
        this.timer = 0;
        this.magnet = { x: 0, y: 0, radius: 150, strength: 1.5, polarity: 1 }; // 1: Attract, -1: Repel
        this.highScore = localStorage.getItem('magnet_highscore') || 0;
    }

    start() {
        this.running = true;
        this.loop();
        this.setupInput();
    }

    setupInput() {
        const handleInput = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const y = (e.clientY || e.touches[0].clientY) - rect.top;
            this.magnet.x = x;
            this.magnet.y = y;
        };

        this.canvas.addEventListener('mousemove', handleInput);
        this.canvas.addEventListener('touchmove', handleInput);
        this.canvas.addEventListener('mousedown', () => this.activateMagnet());
        this.canvas.addEventListener('touchstart', (e) => {
            handleInput(e);
            this.activateMagnet();
        });
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.magnet.polarity *= -1;
        });
    }

    activateMagnet() {
        if (this.energy <= 0) return;
        this.moves++;
        this.energy -= 5;
        this.audio.play('click');
        this.checkWin();
    }

    checkWin() {
        if (this.entities.keysLocked === this.entities.totalKeys) {
            this.running = false;
            if (this.moves < this.highScore) {
                this.highScore = this.moves;
                localStorage.setItem('magnet_highscore', this.highScore);
            }
            alert(`Level Complete! Moves: ${this.moves}`);
            location.reload();
        }
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        this.timer += 1/60;
        this.physics.applyMagnet(this.entities.objects, this.magnet);
        this.entities.update(this.physics);
        
        document.getElementById('energy').innerText = Math.floor(this.energy);
        document.getElementById('moves').innerText = this.moves;
        document.getElementById('timer').innerText = this.formatTime(this.timer);
    }

    formatTime(s) {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    draw() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.entities.draw(this.ctx);
        
        // Draw Magnet Field
        this.ctx.beginPath();
        this.ctx.arc(this.magnet.x, this.magnet.y, this.magnet.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.magnet.polarity > 0? 'rgba(0, 255, 255, 0.2)' : 'rgba(255, 0, 100, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
}