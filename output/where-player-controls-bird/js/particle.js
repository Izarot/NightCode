class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    createExplosion(x, y, color = '#ff6b6b', count = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: Utils.random(-200, 200),
                vy: Utils.random(-200, 200),
                life: 1.0,
                decay: Utils.random(0.5, 2.0),
                size: Utils.random(2, 6),
                color
            });
        }
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += 200 * dt; // gravity
            p.life -= p.decay * dt;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}