// UI management with glassmorphism effect
class UI {
    constructor(ctx) {
        this.ctx = ctx;
    }
    
    drawGlassPanel(x, y, width, height) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.filter = 'blur(10px)';
        this.ctx.fillRect(x, y, width, height);
        this.ctx.filter = 'none';
        
        this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.restore();
    }
    
    drawInventory(items, x, y) {
        this.drawGlassPanel(x, y, items.length * 50 + 20, 60);
        
        items.forEach((item, index) => {
            const itemX = x + 10 + index * 50;
            this.ctx.fillStyle = item.color;
            this.ctx.fillRect(itemX, y + 10, 40, 40);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '20px Poppins';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            const icon = item.type === 'video' ? '▶' : item.type === 'text' ? 'T' : '?';
            this.ctx.fillText(icon, itemX + 20, y + 30);
        });
    }
    
    drawProgressBar(x, y, width, height, progress, color = '#0D9488') {
        this.ctx.fillStyle = 'rgba(0,0,0,0.1)';
        this.ctx.fillRect(x, y, width, height);
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width * progress, height);
        
        this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
    }
    
    drawTimer(seconds, x, y) {
        this.ctx.fillStyle = '#0D9488';
        this.ctx.font = 'bold 18px Poppins';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`⏱ ${Math.floor(seconds)}s`, x, y);
    }
}