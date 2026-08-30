export class Renderer {
    static drawBackground(ctx, width, height) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#2c1842');
        gradient.addColorStop(1, '#ff8c42');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
}