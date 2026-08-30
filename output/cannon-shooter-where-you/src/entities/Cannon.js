export default class Cannon {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = 45;
        this.power = 50;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle * Math.PI / 180);
        
        // Base
        ctx.fillStyle = '#666';
        ctx.fillRect(-30, -10, 60, 20);
        
        // Barrel
        ctx.fillStyle = '#888';
        ctx.fillRect(0, -5, 40, 10);
        
        ctx.restore();
    }
}