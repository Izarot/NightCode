export class UI {
    constructor() {
        this.score = 0;
    }

    update(score) {
        this.score = score;
    }

    draw(ctx) {
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText('Score: ' + this.score, 10, 30);
    }
}