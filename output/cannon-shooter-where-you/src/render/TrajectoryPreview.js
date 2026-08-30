export class TrajectoryPreview {
    static draw(ctx, cannon, gravity = 0.2) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.setLineDash([5,5]);
        ctx.beginPath();
        
        let x = cannon.x, y = cannon.y;
        let angle = cannon.angle * Math.PI / 180;
        let power = cannon.power / 10;
        let vx = power * Math.cos(angle);
        let vy = -power * Math.sin(angle);
        
        for (let i = 0; i < 100; i++) {
            vy += gravity;
            x += vx;
            y += vy;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }
}