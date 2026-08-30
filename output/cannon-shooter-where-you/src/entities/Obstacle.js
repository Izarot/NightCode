export default class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
    }

    draw(ctx) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}