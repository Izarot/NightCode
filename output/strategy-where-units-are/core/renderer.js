export class Renderer {
    constructor(game) {
        this.game = game;
    }
    
    render(alpha) {
        const ctx = this.game.ctx;
        ctx.clearRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        // Draw background
        const gradient = ctx.createLinearGradient(0, 0, 0, this.game.canvas.height);
        gradient.addColorStop(0, '#0a0a2a');
        gradient.addColorStop(1, '#1a1a3a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        // Draw units
        this.game.units.render(ctx);
        
        // Draw particles
        this.drawParticles(ctx);
    }
    
    drawParticles(ctx) {
        // Simple particle effects
        ctx.fillStyle = 'rgba(0, 255, 100, 0.5)';
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * ctx.canvas.width;
            const y = Math.random() * ctx.canvas.height;
            ctx.fillRect(x, y, 2, 2);
        }
    }
}