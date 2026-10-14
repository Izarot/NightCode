export class GameLoop {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.lastTime = 0;
        this.entities = [];
        this.systems = [];
        this.running = false;
        this.highScore = this.loadHighScore();
        this.setupResize();
    }

    setupResize() {
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(window.innerWidth, 1024);
        const maxHeight = window.innerHeight;
        
        const aspectRatio = this.config.canvas.width / this.config.canvas.height;
        let width = maxWidth;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    addSystem(system) {
        this.systems.push(system);
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.loop(time));
    }

    stop() {
        this.running = false;
    }

    loop(currentTime) {
        if (!this.running) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame((time) => this.loop(time));
    }

    update(deltaTime) {
        // Update systems
        for (const system of this.systems) {
            if (system.update) system.update(deltaTime);
        }
        
        // Update entities
        for (const entity of this.entities) {
            if (entity.update) entity.update(deltaTime);
        }
        
        // Remove dead entities
        this.entities = this.entities.filter(e => !e.dead);
    }

    render() {
        this.ctx.clearRect(0, 0, this.config.canvas.width, this.config.canvas.height);
        
        // Render background
        this.ctx.fillStyle = this.config.colors.background;
        this.ctx.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);
        
        // Render entities
        for (const entity of this.entities) {
            if (entity.render) entity.render(this.ctx);
        }
        
        // Render UI
        this.renderUI();
    }

    renderUI() {
        // Draw high score
        this.ctx.fillStyle = this.config.colors.ui;
        this.ctx.font = '16px Courier New';
        this.ctx.fillText(`High Score: ${this.highScore}`, 20, 30);
        
        // Draw timer
        const time = this.getPlayTime();
        this.ctx.fillText(`Time: ${time.toFixed(1)}s`, this.config.canvas.width - 120, 30);
    }

    getPlayTime() {
        return (performance.now() - this.startTime) / 1000;
    }

    loadHighScore() {
        const saved = localStorage.getItem(this.config.storage.highScoreKey);
        return saved ? parseInt(saved) : 0;
    }

    saveHighScore(score) {
        if (score > this.highScore) {
            this.highScore = score;
            localStorage.setItem(this.config.storage.highScoreKey, score);
        }
    }
}