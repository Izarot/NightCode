export class World {
    constructor() {
        this.platforms = [];
        this.exit = { x: 600, y: 100, width: 40, height: 40 };
        this.canvasHeight = 600;
        this.createLevel();
    }

    createLevel() {
        this.platforms.push({ x: 0, y: 500, width: 800, height: 20, type: 'ground', color: '#2f2f2f' });
        this.platforms.push({ x: 200, y: 400, width: 100, height: 20, type: 'platform', color: '#4a4a4a', gravityReversible: true, active: false, cooldown: 0 });
        this.platforms.push({ x: 400, y: 300, width: 100, height: 20, type: 'platform', color: '#4a4a4a', gravityReversible: true, active: false, cooldown: 0 });
        this.platforms.push({ x: 600, y: 200, width: 100, height: 20, type: 'platform', color: '#4a4a4a', gravityReversible: true, active: false, cooldown: 0 });
        this.platforms.push({ x: 300, y: 150, width: 100, height: 20, type: 'platform', color: '#4a4a4a' });
    }

    update(dt, player) {
        this.platforms.forEach(p => {
            if (p.cooldown > 0) p.cooldown -= dt * 1000;
        });
    }

    render(ctx) {
        this.platforms.forEach(p => {
            ctx.fillStyle = p.color;
            if (p.gravityReversible && p.active) ctx.fillStyle = '#00ffcc';
            ctx.fillRect(p.x, p.y, p.width, p.height);
            if (p.gravityReversible && !p.active && p.cooldown <= 0) {
                ctx.strokeStyle = '#00ffcc';
                ctx.lineWidth = 2;
                ctx.strokeRect(p.x - 2, p.y - 2, p.width + 4, p.height + 4);
            }
        });

        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(this.exit.x, this.exit.y, this.exit.width, this.exit.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.fillText('EXIT', this.exit.x + 5, this.exit.y + 25);
    }

    getActivatableObjectAt(x, y) {
        return this.platforms.find(p => 
            p.gravityReversible && 
            !p.active && 
            p.cooldown <= 0 &&
            x > p.x && x < p.x + p.width &&
            y > p.y && y < p.y + p.height
        );
    }
}
