export class Renderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.particles = [];
    }

    drawBackground() {
        const ctx = this.ctx;
        // Sky gradient
        const sky = ctx.createLinearGradient(0, 0, 0, 720);
        sky.addColorStop(0, '#87CEEB');
        sky.addColorStop(1, '#B0E2FF');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, 1280, 720);
        
        // Clouds
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < 5; i++) {
            const x = (i * 250 + Date.now() / 50) % 1280;
            const y = 100 + i * 50;
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, Math.PI * 2);
            ctx.arc(x + 20, y + 10, 25, 0, Math.PI * 2);
            ctx.arc(x - 20, y + 10, 25, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawGarden(garden) {
        garden.plots.forEach((plot, index) => {
            if (plot.plant) {
                this.drawPlant(plot.plant, plot.x, plot.y);
            } else {
                this.drawEmptyPlot(plot.x, plot.y);
            }
        });
    }

    drawPlant(plant, x, y) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        
        // Stem
        const stemHeight = plant.genes.L4 * 0.6;
        const stemGradient = ctx.createLinearGradient(0, 0, 0, -stemHeight);
        stemGradient.addColorStop(0, '#2E8B57');
        stemGradient.addColorStop(1, '#90EE90');
        ctx.strokeStyle = stemGradient;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -stemHeight);
        ctx.stroke();
        
        // Leaves
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.ellipse(-15, -stemHeight * 0.3, 20, 10, 0, 0, Math.PI * 2);
        ctx.ellipse(15, -stemHeight * 0.6, 20, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Petals
        const petalCount = plant.genes.L2;
        const hue = plant.genes.L0 * 60;
        const saturation = plant.genes.L1;
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, 65%)`;
        
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const px = Math.cos(angle) * 25;
            const py = Math.sin(angle) * 25 - stemHeight;
            
            ctx.beginPath();
            ctx.ellipse(px, py, 15, 8, angle, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Center
        ctx.fillStyle = plant.genes.L6 === 0 ? '#FFD700' : '#000';
        ctx.beginPath();
        ctx.arc(0, -stemHeight, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Glow
        if (plant.genes.L7 > 0) {
            const glowIntensity = plant.genes.L7 * 0.3;
            const gradient = ctx.createRadialGradient(0, -stemHeight, 0, 0, -stemHeight, 40);
            gradient.addColorStop(0, `rgba(255,215,0,${glowIntensity})`);
            gradient.addColorStop(1, 'rgba(255,215,0,0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, -stemHeight, 40, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    drawEmptyPlot(x, y) {
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 30);
        this.ctx.lineTo(x + 26, y - 15);
        this.ctx.lineTo(x + 26, y + 15);
        this.ctx.lineTo(x, y + 30);
        this.ctx.lineTo(x - 26, y + 15);
        this.ctx.lineTo(x - 26, y - 15);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Dirt texture
        this.ctx.fillStyle = '#A0522D';
        for (let i = 0; i < 5; i++) {
            this.ctx.fillRect(x - 15 + Math.random() * 30, y - 15 + Math.random() * 30, 3, 3);
        }
    }

    drawParticles() {
        this.particles.forEach((p, i) => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            
            if (p.life <= 0) this.particles.splice(i, 1);
        });
    }

    addParticle(x, y, color, size = 5) {
        this.particles.push({
            x, y, color, size,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1
        });
    }
}