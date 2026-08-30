export default class Target {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.alive = true;
    }

    draw(ctx) {
        if (!this.alive) return;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    hit() {
        this.alive = false;
    }
}