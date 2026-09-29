class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 3 + 1;
        this.color = color || '#00f3ff';
        this.velocity = {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10
        };
        this.life = 30 + Math.random() * 20;
        this.maxLife = this.life;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.y += 0.1; // gravity
        this.life--;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

function createExplosion(x, y, color, count = 15) {
    const particles = [];
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
    return particles;
}

if (typeof module !== 'undefined') {
    module.exports = { Particle, createExplosion };
}