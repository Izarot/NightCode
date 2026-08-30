export class Background {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    draw(ctx) {
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#2c1842');
        gradient.addColorStop(1, '#ff8c42');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Ground
        ctx.fillStyle = '#4a7c59';
        ctx.fillRect(0, this.height - 50, this.width, 50);
    }
}