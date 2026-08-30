export class HUD {
    static draw(ctx, game) {
        // Score
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${game.score}`, 20, 40);
        
        // Shells
        ctx.fillText(`Shells: ${game.shells || 5}`, 20, 70);
        
        // Level
        ctx.fillText(`Level: ${game.level}`, 20, 100);
    }
}