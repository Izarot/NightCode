export class RenderSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.offsetX = 0;
        this.offsetY = 0;
    }
    
    update(dt) {}
    
    render(alpha) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Get camera offset from world
        this.offsetX = this.world.renderOffsetX || 0;
        this.offsetY = this.world.renderOffsetY || 0;
        
        // Draw background
        ctx.fillStyle = '#111';;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw platforms
        ctx.fillStyle = '#555';;
        this.world.entities.forEach(entity => {
            const physics = entity.getComponent('physicsBody');
            if (!physics || !physics.solid) return;
            const transform = entity.getComponent('transform');
            if (!transform) return;
            
            ctx.fillRect(
                (transform.x - this.offsetX) * (ctx.canvas.width / 480),
                (transform.y - this.offsetY) * (ctx.canvas.height / 270),
                transform.w * (ctx.canvas.width / 480),
                transform.h * (ctx.canvas.height / 270)
            );
        });
        
        // Draw player fragments
        this.world.entities.forEach(entity => {
            const fragData = entity.getComponent('fragmentData');
if (!fragData) return;
            const transform = entity.getComponent('transform');
            if (!transform) return;
            
            const size = 16 * fragData.sizeMultiplier;
            const hue = (fragData.id ? parseInt(fragData.id.substring(0, 2), 36) : 0) * 10 % 360;
            ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
            ctx.fillRect(
                (transform.x - this.offsetX) * (ctx.canvas.width / 480),
                (transform.y - this.offsetY) * (ctx.canvas.height / 270),
                size * (ctx.canvas.width / 480),
                size * (ctx.canvas.height / 270)
            );
        });
    }
}
