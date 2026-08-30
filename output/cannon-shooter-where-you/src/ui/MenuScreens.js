export class MenuScreens {
    static drawMenu(ctx, width, height) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Artillery Ace', width/2, height/2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText('Click to Start', width/2, height/2 + 50);
    }
}