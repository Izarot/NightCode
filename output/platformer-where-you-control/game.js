import { Engine } from './src/core/Engine.js';
import { Renderer } from './src/core/Renderer.js';
import { InputManager } from './src/core/InputManager.js';
import { Physics } from './src/core/Physics.js';
import { Player } from './src/entities/Player.js';
import { LevelManager } from './src/scenes/LevelManager.js';
import { HUD } from './src/ui/HUD.js';
import { AudioManager } from './src/core/AudioManager.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        
        this.VW = 1280;
        this.VH = 720;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.input = new InputManager();
        this.audio = new AudioManager();
        this.physics = new Physics();
        this.renderer = new Renderer(this.ctx, this.VW, this.VH);
        this.hud = new HUD();
        this.levelManager = new LevelManager();
        
        this.player = new Player(this.input, this.physics);
        this.cameraA = { x: 0, y: 0 };
        this.cameraB = { x: 0, y: 0 };
        
        this.timer = 0;
        this.deaths = 0;
        this.highScore = parseInt(localStorage.getItem('duality_highscore') || '0');
        this.isRunning = false;
        this.isPaused = false;
        this.levelComplete = false;
        
        this.init();
    }
    
    resize() {
        const scale = Math.min(window.innerWidth / this.VW, window.innerHeight / this.VH);
        this.canvas.style.width = (this.VW * scale) + 'px';
        this.canvas.style.height = (this.VH * scale) + 'px';
        this.canvas.width = this.VW;
        this.canvas.height = this.VH;
    }
    
    async init() {
        await this.levelManager.loadLevel(1);
        this.isRunning = true;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.fixedDt = 1/60;
        this.loop();
    }
    
    loop() {
        if (!this.isRunning) return;
        
        const now = performance.now();
        const frameTime = Math.min((now - this.lastTime) / 1000, 0.25);
        this.lastTime = now;
        
        if (!this.isPaused && !this.levelComplete) {
            this.accumulator += frameTime;
            this.timer += frameTime;
            
            while (this.accumulator >= this.fixedDt) {
                this.update(this.fixedDt);
                this.accumulator -= this.fixedDt;
            }
        }
        
        this.render();
        requestAnimationFrame(() => this.loop());
    }
    
    update(dt) {
        this.input.update();
        
        if (this.input.justPressed('Escape')) {
            this.isPaused = !this.isPaused;
        }
        
        if (this.isPaused) return;
        
        this.player.update(dt, this.levelManager.platforms, this.levelManager.phaseState);
        
        const prime = this.player.prime;
        const echo = this.player.echo;
        
        const dist = Math.hypot(prime.x - echo.x, prime.y - echo.y);
        const maxDist = Math.hypot(this.VW, this.VH);
        const sync = Math.max(0, 1 - (dist / maxDist));
        
        if (sync > 0.8) {
            prime.speedMod = 1.15;
            echo.speedMod = 1.15;
            prime.dashCDMod = 0.8;
            echo.dashCDMod = 0.8;
        } else {
            prime.speedMod = 1.0;
            echo.speedMod = 1.0;
            prime.dashCDMod = 1.0;
            echo.dashCDMod = 1.0;
        }
        
        this.checkCollisions();
        this.checkPhaseBlocks(dt);
        this.checkWinCondition();
        
        this.cameraA.x = prime.x - this.VW/2;
        this.cameraA.y = prime.y - 180;
        this.cameraB.x = echo.x - this.VW/2;
        this.cameraB.y = echo.y - 180;
        
        this.hud.update(this.timer, this.deaths, sync, prime.dashCooldown, echo.dashCooldown);
        
        if (this.timer > this.highScore) {
            this.highScore = this.timer;
            localStorage.setItem('duality_highscore', this.highScore.toString());
        }
    }
    
    checkCollisions() {
        const platforms = this.levelManager.platforms;
        const prime = this.player.prime;
        const echo = this.player.echo;
        
        for (let plat of platforms) {
            if (plat.layer === 'top' || plat.layer === 'both') {
                this.resolveCollision(prime, plat);
            }
            if (plat.layer === 'bottom' || plat.layer === 'both') {
                this.resolveCollision(echo, plat);
            }
        }
    }
    
    resolveCollision(entity, plat) {
        if (entity.x + entity.w > plat.x && entity.x < plat.x + plat.w &&
            entity.y + entity.h > plat.y && entity.y < plat.y + plat.h) {
            
            if (entity.vel.y >= 0 && entity.prevY + entity.h <= plat.y + 5) {
                entity.y = plat.y - entity.h;
                entity.vel.y = 0;
                entity.grounded = true;
                entity.onPlatform = plat;
            } else if (entity.vel.y < 0 && entity.prevY >= plat.y + plat.h - 5) {
                entity.y = plat.y + plat.h;
                entity.vel.y = 0;
            }
            
            if (entity.vel.x > 0 && entity.prevX + entity.w <= plat.x + 5) {
                entity.x = plat.x - entity.w;
            } else if (entity.vel.x < 0 && entity.prevX >= plat.x + plat.w - 5) {
                entity.x = plat.x + plat.w;
            }
        }
    }
    
    checkPhaseBlocks(dt) {
        this.levelManager.phaseTimer += dt;
        if (this.levelManager.phaseTimer >= 3.0) {
            this.levelManager.phaseTimer = 0;
            this.levelManager.phaseState = this.levelManager.phaseState === 'solidTop' ? 'solidBottom' : 'solidTop';
        }
    }
    
    checkWinCondition() {
        const prime = this.player.prime;
        const echo = this.player.echo;
        const exit = this.levelManager.exit;
        
        const inPrimeExit = Math.hypot(prime.x - exit.prime.x, prime.y - exit.prime.y) < 40;
        const inEchoExit = Math.hypot(echo.x - exit.echo.x, echo.y - exit.echo.y) < 40;
        
        if (inPrimeExit && inEchoExit) {
            this.levelComplete = true;
            this.audio.playWin();
        }
    }
    
    render() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0D0D1A';
        ctx.fillRect(0, 0, this.VW, this.VH);
        
        this.renderViewport(ctx, this.cameraA, 0, 0, this.VW, 360, 'top');
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(0, 358);
        ctx.lineTo(this.VW, 358);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        this.renderViewport(ctx, this.cameraB, 0, 362, this.VW, 358, 'bottom');
        
        this.hud.render(ctx);
        
        if (this.isPaused) {
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.fillRect(0, 0, this.VW, this.VH);
            ctx.fillStyle = '#E0E0E0';
            ctx.font = '48px "JetBrains Mono"';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', this.VW/2, this.VH/2);
        }
        
        if (this.levelComplete) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, this.VW, this.VH);
            ctx.fillStyle = '#FFD700';
            ctx.font = '64px "JetBrains Mono"';
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL COMPLETE', this.VW/2, this.VH/2 - 40);
            ctx.font = '32px "JetBrains Mono"';
            ctx.fillText(`Time: ${this.timer.toFixed(2)}s`, this.VW/2, this.VH/2 + 20);
            ctx.fillText(`High Score: ${this.highScore.toFixed(2)}s`, this.VW/2, this.VH/2 + 60);
        }
    }
    
    renderViewport(ctx, camera, x, y, w, h, layer) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        
        ctx.fillStyle = '#1A1A2E';
        ctx.fillRect(x, y, w, h);
        
        ctx.save();
        ctx.translate(-camera.x * 0.1, -camera.y * 0.1);
        this.renderParallax(ctx, layer);
        ctx.restore();
        
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        
        for (let plat of this.levelManager.platforms) {
            if (plat.layer === layer || plat.layer === 'both') {
                this.renderPlatform(ctx, plat, layer);
            }
        }
        
        this.renderExit(ctx);
        
        if (layer === 'top') {
            this.player.renderPrime(ctx);
        } else {
            this.player.renderEcho(ctx);
        }
        
        ctx.restore();
        ctx.restore();
    }
    
    renderParallax(ctx, layer) {
        ctx.fillStyle = '#16213E';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(200 + i * 300, 100 + i * 50, 50 + i * 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderPlatform(ctx, plat, layer) {
        const phaseSolid = this.levelManager.phaseState === 'solidTop' ? 
            (layer === 'top' || plat.layer === 'both') : 
            (layer === 'bottom' || plat.layer === 'both');
        
        if (!phaseSolid && plat.type === 'phase') return;
        
        if (plat.type === 'phase') {
            ctx.globalAlpha = this.levelManager.phaseState === 'solidTop' ? 0.3 : 1.0;
        }
        
        if (plat.hazard === 'laser' && layer === 'top') {
            ctx.fillStyle = '#FF2E2E';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#FF2E2E';
        } else if (plat.hazard === 'corruption' && layer === 'bottom') {
            ctx.fillStyle = '#8A2BE2';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#8A2BE2';
        } else {
            ctx.fillStyle = '#00FFFF';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00FFFF';
        }
        
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
    }
    
    renderExit(ctx) {
        const t = performance.now() / 1000;
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#FFD700';
        ctx.fillRect(1080, 80, 40, 80);
        ctx.fillRect(1080, 520, 40, 80);
        ctx.shadowBlur = 0;
    }
}

const game = new Game();

window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
});