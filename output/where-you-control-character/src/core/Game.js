export class Game {
    constructor(canvas, uiOverlay) {
        this.canvas = canvas;
        this.uiOverlay = uiOverlay;
        this.ctx = canvas.getContext('2d');
        
        this.width = 0;
        this.height = 0;
        
        this.state = 'loading';
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedTimeStep = 1/60;
        
        this.highScore = 0;
        this.settings = {
            highContrast: false,
            soundEnabled: true,
            gameSpeed: 1.0
        };
        
        this.entities = [];
        this.particles = [];
        this.screenShake = 0;
        
        this.input = null;
        this.mazeGenerator = null;
        this.player = null;
        this.hud = null;
        this.startScreen = null;
        this.pauseMenu = null;
        this.gameOverScreen = null;
        this.audio = null;
        this.saveManager = null;
        
        this.resizeHandler = this.resize.bind(this);
        this.visibilityHandler = this.handleVisibilityChange.bind(this);
    }

    async init() {
        await this.loadAssets();
        this.setupModules();
        this.loadSettings();
        this.loadHighScore();
        this.resize();
        window.addEventListener('resize', this.resizeHandler);
        document.addEventListener('visibilitychange', this.visibilityHandler);
        this.changeState('start');
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    async loadAssets() {
        // No external assets, everything procedural
    }

    setupModules() {
        // Dynamic imports to avoid circular dependencies
        const { InputHandler } = await import('./InputHandler.js');
        const { MazeGenerator } = await import('../game/MazeGenerator.js');
        const { Player } = await import('../game/Player.js');
        const { HUD } = await import('../ui/HUD.js');
        const { StartScreen } = await import('../ui/StartScreen.js');
        const { PauseMenu } = await import('../ui/PauseMenu.js');
        const { GameOverScreen } = await import('../ui/GameOverScreen.js');
        const { Audio } = await import('../assets/Audio.js');
        const { SaveManager } = await import('../data/SaveManager.js');

        this.input = new InputHandler(this);
        this.mazeGenerator = new MazeGenerator(this);
        this.player = new Player(this);
        this.hud = new HUD(this);
        this.startScreen = new StartScreen(this);
        this.pauseMenu = new PauseMenu(this);
        this.gameOverScreen = new GameOverScreen(this);
        this.audio = new Audio(this);
        this.saveManager = new SaveManager(this);
    }

    loadSettings() {
        const saved = localStorage.getItem('mazeRunner_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    saveSettings() {
        localStorage.setItem('mazeRunner_settings', JSON.stringify(this.settings));
    }

    loadHighScore() {
        this.highScore = this.saveManager.loadHighScore();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        // Calculate size to fit screen with margin
        const margin = 20;
        const maxWidth = window.innerWidth - margin * 2;
        const maxHeight = window.innerHeight - margin * 2;
        
        // Maintain aspect ratio (16:9)
        const aspectRatio = 16/9;
        let width = maxWidth;
        let height = width / aspectRatio;
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        this.width = Math.floor(width);
        this.height = Math.floor(height);
        
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.scale(dpr, dpr);
        
        if (this.mazeGenerator) {
            this.mazeGenerator.onResize(this.width, this.height);
        }
        if (this.player) {
            this.player.onResize(this.width, this.height);
        }
    }

    handleVisibilityChange() {
        if (document.hidden && this.state === 'playing') {
            this.pause();
        }
    }

    changeState(newState) {
        this.state = newState;
        switch(newState) {
            case 'start':
                this.startScreen.show();
                break;
            case 'playing':
                this.startScreen.hide();
                this.pauseMenu.hide();
                this.gameOverScreen.hide();
                this.resetGame();
                break;
            case 'paused':
                this.pauseMenu.show();
                break;
            case 'gameover':
                this.gameOverScreen.show();
                break;
        }
    }

    resetGame() {
        this.entities = [];
        this.particles = [];
        this.screenShake = 0;
        this.mazeGenerator.reset();
        this.player.reset();
        this.hud.reset();
        this.audio.playMusic();
    }

    pause() {
        if (this.state === 'playing') {
            this.changeState('paused');
            this.audio.pauseMusic();
        }
    }

    resume() {
        if (this.state === 'paused') {
            this.changeState('playing');
            this.audio.resumeMusic();
        }
    }

    gameOver() {
        if (this.state !== 'playing') return;
        this.audio.stopMusic();
        this.audio.playSound('gameover');
        this.screenShake = 15;
        this.changeState('gameover');
        
        if (this.hud.score > this.highScore) {
            this.highScore = this.hud.score;
            this.saveManager.saveHighScore(this.highScore);
        }
    }

    gameLoop(timestamp) {
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;
        
        if (this.state === 'playing') {
            this.accumulator += deltaTime * this.settings.gameSpeed;
            while (this.accumulator >= this.fixedTimeStep) {
                this.fixedUpdate(this.fixedTimeStep);
                this.accumulator -= this.fixedTimeStep;
            }
            this.update(deltaTime);
        } else {
            this.update(deltaTime);
        }
        
        this.render();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    fixedUpdate(dt) {
        this.player.fixedUpdate(dt);
        this.mazeGenerator.fixedUpdate(dt);
        
        // Check collisions
        for (const entity of this.entities) {
            if (entity.checkCollision && entity.checkCollision(this.player)) {
                this.gameOver();
                break;
            }
        }
    }

    update(dt) {
        this.player.update(dt);
        this.mazeGenerator.update(dt);
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update entities
        for (let i = this.entities.length - 1; i >= 0; i--) {
            this.entities[i].update(dt);
            if (this.entities[i].shouldRemove) {
                this.entities.splice(i, 1);
            }
        }
        
        // Screen shake decay
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - dt * 30);
        }
        
        this.hud.update(dt);
        
        if (this.state === 'start') this.startScreen.update(dt);
        if (this.state === 'paused') this.pauseMenu.update(dt);
        if (this.state === 'gameover') this.gameOverScreen.update(dt);
    }

    render() {
        this.ctx.save();
        
        // Screen shake
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Clear
        this.ctx.fillStyle = this.settings.highContrast ? '#000' : '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Render maze
        this.mazeGenerator.render(this.ctx);
        
        // Render entities
        for (const entity of this.entities) {
            entity.render(this.ctx);
        }
        
        // Render player
        this.player.render(this.ctx);
        
        // Render particles
        for (const particle of this.particles) {
            particle.render(this.ctx);
        }
        
        // Render trail
        this.player.renderTrail(this.ctx);
        
        this.ctx.restore();
        
        // HUD is rendered via DOM
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    addParticle(particle) {
        this.particles.push(particle);
    }

    getColorScheme() {
        const schemes = [
            { wall: '#00d4ff', accent: '#ff6b6b', bg: '#1a1a2e', player: '#00d4ff', trail: 'rgba(0,212,255,0.3)' },
            { wall: '#ff6b6b', accent: '#ffd93d', bg: '#2d1b1b', player: '#ff6b6b', trail: 'rgba(255,107,107,0.3)' },
            { wall: '#ffd93d', accent: '#6bcb77', bg: '#2d2d1b', player: '#ffd93d', trail: 'rgba(255,217,61,0.3)' },
            { wall: '#6bcb77', accent: '#4d96ff', bg: '#1b2d1b', player: '#6bcb77', trail: 'rgba(107,203,119,0.3)' },
            { wall: '#4d96ff', accent: '#00d4ff', bg: '#1b1b2d', player: '#4d96ff', trail: 'rgba(77,150,255,0.3)' }
        ];
        const index = Math.floor(this.hud.score / 5000) % schemes.length;
        return this.settings.highContrast ? 
            { wall: '#fff', accent: '#ff0', bg: '#000', player: '#fff', trail: 'rgba(255,255,255,0.5)' } 
            : schemes[index];
    }

    toggleHighContrast() {
        this.settings.highContrast = !this.settings.highContrast;
        this.saveSettings();
        this.hud.updateHighContrast();
    }

    toggleSound() {
        this.settings.soundEnabled = !this.settings.soundEnabled;
        this.saveSettings();
        this.audio.setEnabled(this.settings.soundEnabled);
    }

    setGameSpeed(speed) {
        this.settings.gameSpeed = speed;
        this.saveSettings();
    }
}