export class GameEngine {
    constructor(game) {
        this.game = game;
        this.lastTime = 0;
        this.delta = 0;
        this.fps = 60;
        this.accumulator = 0;
        this.fixedStep = 1000 / this.fps;
    }
    
    start() {
        requestAnimationFrame((time) => this.loop(time));
    }
    
    loop(currentTime) {
        if (!this.game.gameState.isRunning) return;
        
        this.delta = currentTime - this.lastTime;
        this.lastTime = currentTime;
        this.accumulator += this.delta;
        
        while (this.accumulator >= this.fixedStep) {
            this.update(this.fixedStep / 1000);
            this.accumulator -= this.fixedStep;
        }
        
        const alpha = this.accumulator / this.fixedStep;
        this.render(alpha);
        
        requestAnimationFrame((time) => this.loop(time));
    }
    
    update(dt) {
        this.game.resources.update(dt);
        this.game.units.update(dt);
        this.game.updateUI();
    }
    
    render(alpha) {
        this.game.renderer.render(alpha);
    }
}