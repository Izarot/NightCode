export class Renderer {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        // Vibrant Palette
        this.colors = {
            bg: '#16213e',
            player: '#4ecca3',
            gear: '#95a5a6',
            gearActive: '#f1c40f',
            core: '#e94560',
            coreGlow: 'rgba(233, 69, 96, 0.5)',
            wall: '#0f3460'
        };
    }

    draw(engine, gearManager, time, isComplete) {
        const ctx = this.ctx;
        // Clear
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(0, 0, this.width, this.height);

        // Draw Walls
        ctx.fillStyle = this.colors.wall;
        engine.walls.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

        // Draw Gears
        gearManager.gears.forEach(gear => {
            ctx.save();
            ctx.translate(gear.x, gear.y);
            ctx.rotate((gear.rotation * Math.PI) / 180);
            
            // Gear Body
            ctx.fillStyle = gear.isAligned ? this.colors.gearActive : this.colors.gear;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const r = gear.radius + (i % 2 === 0 ? 10 : 0);
                ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.fill();
            
            // Center hole
            ctx.fillStyle = this.colors.bg;
            ctx.beginPath();
            ctx.arc(0, 0, gear.radius * 0.3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();

            // Alignment Indicator
            ctx.strokeStyle = gear.isAligned ? '#4ecca3' : '#e94560';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(gear.x, gear.y, gear.radius + 15, 0, Math.PI * 2);
            ctx.stroke();
        });

        // Draw Power Core
        const coreX = 400, coreY = 300;
        const pulse = Math.sin(Date.now() / 200) * 5;
        const coreSize = 40 + (gearManager.getPowerLevel() / 100) * 20 + pulse;

        ctx.shadowBlur = 20;
        ctx.shadowColor = this.colors.core;
        ctx.fillStyle = this.colors.core;
        ctx.beginPath();
        ctx.arc(coreX, coreY, coreSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Door
        ctx.fillStyle = isComplete ? '#4ecca3' : '#53354a';
        ctx.fillRect(350, 50, 100, 20);

        // Draw Player
        ctx.fillStyle = this.colors.player;
        ctx.beginPath();
        ctx.arc(engine.player.x, engine.player.y, engine.player.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}