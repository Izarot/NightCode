export class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    
    constructor(x: number, y: number, vx: number, vy: number, life: number, size: number, color: string) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
    }
    
    update(dt: number) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
    }
    
    isAlive(): boolean {
        return this.life > 0;
    }
}

export class ParticleEmitter {
    private particles: Particle[] = [];
    
    constructor(private x: number, private y: number, private count: number, private life: number, private size: number, private color: string) {
        this.emit();
    }
    
    private emit() {
        for (let i = 0; i < this.count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            this.particles.push(new Particle(
                this.x, this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                this.life * (0.5 + Math.random() * 0.5),
                this.size * (0.5 + Math.random()),
                this.color
            ));
        }
    }
    
    update(dt: number) {
        for (const p of this.particles) p.update(dt);
        this.particles = this.particles.filter(p => p.isAlive());
    }
    
    render(ctx: CanvasRenderingContext2D) {
        ctx.globalCompositeOperation = 'lighter';
        for (const p of this.particles) {
            const alpha = p.life / p.maxLife;
            ctx.fillStyle = p.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
    }
}