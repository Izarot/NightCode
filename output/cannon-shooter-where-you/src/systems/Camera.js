export class Camera {
    constructor(game) {
        this.game = game;
        this.shake = 0;
        this.slowMotion = 1;
    }

    shake(amount, duration) {
        this.shake = amount;
        setTimeout(() => this.shake = 0, duration);
    }

    apply(ctx) {
        if (this.shake > 0) {
            const dx = Math.random() * this.shake - this.shake/2;
            const dy = Math.random() * this.shake - this.shake/2;
            ctx.translate(dx, dy);
        }
    }
}