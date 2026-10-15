import { Player } from './Player.js';
import { World } from './World.js';
import { Camera } from './Camera.js';
import { InputManager } from './InputManager.js';
import { SoundManager } from '../utils/SoundManager.js';
import { ParticleSystem } from '../utils/ParticleSystem.js';

export class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.player = new Player(100, 100);
        this.world = new World();
        this.camera = new Camera(canvas.width, canvas.height);
        this.input = new InputManager();
        this.sound = new SoundManager();
        this.particles = new ParticleSystem();
        this.score = 0;
        this.timer = 0;
        this.highScore = parseInt(localStorage.getItem('gravityShiftHighScore')) || 0;
        this.gameOver = false;
        this.lastTime = 0;
        this.gravityReversed = false;
        this.gravityIndicator = document.getElementById('hud');
        this.timerDisplay = document.getElementById('timer');
        this.scoreDisplay = document.getElementById('score');
        this.highScoreDisplay = document.getElementById('highScore');
    }

    start() {
        this.lastTime = performance.now();
        this.gameLoop();
    }

    gameLoop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.016);
        this.lastTime = timestamp;

        if (!this.gameOver) {
            this.update(dt);
            this.render();
        }

        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    update(dt) {
        this.input.update();
        this.timer += dt;
        this.timerDisplay.textContent = `Time: ${this.timer.toFixed(1)}s`;

        if (this.input.isPressed('KeyE')) {
            this.tryActivateGravity();
        }

        this.player.update(dt, this.input, this.world, this.gravityReversed);
        this.world.update(dt, this.player);
        this.camera.update(this.player);
        this.particles.update(dt);

        this.checkCollisions();
        this.checkExit();
        this.updateHUD();
    }

    tryActivateGravity() {
        const obj = this.world.getActivatableObjectAt(this.player.x, this.player.y);
        if (obj && !obj.active && !obj.cooldown) {
            obj.activate();
            this.gravityReversed = !this.gravityReversed;
            this.gravityIndicator.textContent = `Gravity: ${this.gravityReversed ? 'INVERTED' : 'NORMAL'}`;
            this.gravityIndicator.classList.add('pulse');
            setTimeout(() => this.gravityIndicator.classList.remove('pulse'), 500);
            this.sound.play('gravityShift');
            this.particles.emit(this.player.x, this.player.y, 20, '#00ffcc');
            obj.startCooldown();
            this.score += 10;
            this.scoreDisplay.textContent = `Score: ${this.score}`;
        }
    }

    checkCollisions() {
        this.world.platforms.forEach(platform => {
            if (this.player.collidesWith(platform)) {
                this.player.resolveCollision(platform);
                if (platform.type === 'ground') {
                    this.sound.play('land');
                    this.particles.emit(this.player.x, this.player.y + 10, 5, '#ffaa44');
                }
            }
        });
    }

    checkExit() {
        if (this.player.collidesWith(this.world.exit)) {
            this.gameOver = true;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('gravityShiftHighScore', this.highScore);
                this.highScoreDisplay.textContent = `High Score: ${this.highScore}`;
            }
            this.sound.play('victory');
            setTimeout(() => alert(`Level Complete!\nScore: ${this.score}\nTime: ${this.timer.toFixed(1)}s`), 100);
        }
    }

    updateHUD() {
        this.scoreDisplay.textContent = `Score: ${this.score}`;
        this.highScoreDisplay.textContent = `High Score: ${this.highScore}`;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.camera.apply(this.ctx);

        this.world.render(this.ctx);
        this.player.render(this.ctx);
        this.particles.render(this.ctx);

        this.ctx.restore();
    }
}
