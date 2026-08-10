export class VFX {
    constructor(canvas) {
        this.canvas = canvas;
        this.particles = [];
        this.explosions = [];
    }
    
    createBurst(x, y) {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 100 + 50;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                alpha: 1,
                size: Math.random() * 3 + 2
            });
        }
    }
    
    createExplosion(x, y) {
        this.explosions.push({ x, y, life: 1 });
    }
    
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt;
            p.life -= dt;
            p.alpha -= dt;
            
            if (p.life <= 0 || p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const e = this.explosions[i];
            e.life -= dt;
            if (e.life <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        ctx.save();
        
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = '#FFBF00';
            ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        }
        
        for (const e of this.explosions) {
            ctx.globalAlpha = e.life;
            ctx.fillStyle = '#FF00FF';
            ctx.beginPath();
            ctx.arc(e.x, e.y, 15, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}