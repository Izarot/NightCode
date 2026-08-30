export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    addParticle(x, y, color, life) {
        this.particles.push({x, y, color, life, maxLife: life});
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].life--;
            if (this.particles[i].life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            ctx.fillStyle = p.color.replace(')', `,${p.life/p.maxLife})`).replace('rgb', 'rgba');
            ctx.fillRect(p.x, p.y, 4, 4);
        }
    }
}