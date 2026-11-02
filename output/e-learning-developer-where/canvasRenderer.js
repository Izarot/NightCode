// Canvas rendering utilities
class CanvasRenderer {
    constructor(ctx) {
        this.ctx = ctx;
    }
    
    drawGrid(cellSize, width, height) {
        this.ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x < width; x += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < height; y += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }
    
    drawAsset(asset, cellSize) {
        this.ctx.fillStyle = asset.color;
        this.ctx.fillRect(asset.x, asset.y, cellSize - 10, cellSize - 10);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = `${cellSize/2}px Poppins`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const icon = asset.type === 'video' ? '▶' : asset.type === 'text' ? 'T' : '?';
        this.ctx.fillText(icon, asset.x + (cellSize-10)/2, asset.y + (cellSize-10)/2);
    }
    
    drawPlayer(player) {
        this.ctx.fillStyle = '#0D9488';
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
        this.ctx.fill();
    }
}