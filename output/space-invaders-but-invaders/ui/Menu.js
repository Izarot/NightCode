export class Menu {
    constructor(canvas, hud) {
        this.canvas = canvas;
        this.hud = hud;
        this.visible = true;
        this.nextWaveOverlay = null;
    }
    
    hide() {
        this.visible = false;
    }
    
    show() {
        this.visible = true;
    }
    
    render(ctx) {
        if (!this.visible) return;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.fillStyle = '#00FFFF';
        ctx.font = '30px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('EVO-STRIKE', this.canvas.width / 2, 150);
        
        ctx.font = '20px monospace';
        ctx.fillText('Press SPACE to Start', this.canvas.width / 2, 250);
        
        ctx.fillText('Avoid enemies and shoot projectiles', this.canvas.width / 2, 300);
        ctx.fillText('Survive and evolve!', this.canvas.width / 2, 340);
    }
    
    renderGameOver(ctx, score) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.fillStyle = '#FF00FF';
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.canvas.width / 2, 200);
        
        ctx.fillStyle = '#00FFFF';
        ctx.font = '24px monospace';
        ctx.fillText('Final Score: ' + score, this.canvas.width / 2, 260);
        
        ctx.fillText('Press R to Restart', this.canvas.width / 2, 320);
    }
}