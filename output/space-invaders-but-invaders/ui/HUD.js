export class HUD {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.highScore = 0;
        this.speedrunTime = 0;
    }
    
    setHighScore(score) {
        this.highScore = score;
    }
    
    updateSpeedrun(time) {
        this.speedrunTime = time;
    }
    
    render(score, wave, health, combo) {
        this.ctx.clearRect(0, 0, this.canvas.width, 60);
        
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('SCORE: ' + score, 10, 20);
        
        this.ctx.textAlign = 'center';
        this.ctx.fillText('WAVE: ' + wave, this.canvas.width / 2, 20);
        
        this.ctx.textAlign = 'right';
        this.ctx.fillText('TIME: ' + this.formatTime(this.speedrunTime), this.canvas.width - 10, 20);
        
        this.ctx.textAlign = 'left';
        this.ctx.fillText('HIGH: ' + this.highScore, 10, 40);
        
        this.ctx.fillStyle = '#FF00FF';
        for (let i = 0; i < 3; i++) {
            this.ctx.fillRect(10 + i * 25, 45, 20, 10);
        }
        
        for (let i = 0; i < health; i++) {
            this.ctx.fillStyle = '#00FFFF';
            this.ctx.fillRect(10 + i * 25, 45, 20, 10);
        }
        
        if (combo > 0) {
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.textAlign = 'right';
            this.ctx.fillText('COMBO: ' + combo, this.canvas.width - 10, 55);
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return (mins > 0 ? mins + ':' : '') + secs.toString().padStart(2, '0');
    }
}