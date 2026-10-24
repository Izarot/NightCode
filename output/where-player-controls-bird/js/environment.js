class Environment {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.groundHeight = 100;
        this.obstacles = [];
        this.targets = [];
        this.hazards = [];
        this.generateLevel();
    }

    generateLevel() {
        this.obstacles = [];
        this.targets = [];
        this.hazards = [];
        
        // Generate ground
        for (let x = 0; x < this.canvas.width; x += 100) {
            this.obstacles.push({
                x, y: this.canvas.height - this.groundHeight,
                width: 100, height: this.groundHeight,
                type: 'ground'
            });
        }
        
        // Generate targets
        for (let i = 0; i < 10; i++) {
            this.targets.push({
                x: Utils.random(200, this.canvas.width - 200),
                y: Utils.random(200, this.canvas.height - 200),
                width: 40, height: 40,
                hp: 100, maxHp: 100,
                type: 'crate',
                active: true
            });
        }
        
        // Generate hazards
        for (let i = 0; i < 5; i++) {
            this.hazards.push({
                x: Utils.random(200, this.canvas.width - 200),
                y: Utils.random(100, this.canvas.height - 300),
                width: 60, height: 60,
                type: 'flak'
            });
        }
    }

    update(dt) {
        // Update hazards
        for (const hazard of this.hazards) {
            if (hazard.type === 'flak') {
                // Simple firing pattern
                if (Math.random() < 0.01) {
                    Game.particleSystem.createExplosion(
                        hazard.x + Utils.random(-30, 30),
                        hazard.y + Utils.random(-30, 30),
                        '#ff4444', 5
                    );
                }
            }
        }
    }

    render(ctx) {
        // Draw sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(1, '#e0f7fa');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw clouds
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (let i = 0; i < 5; i++) {
            const x = (i * 300 + Game.time * 20) % (this.canvas.width + 200);
            const y = 100 + i * 50;
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, Math.PI * 2);
            ctx.arc(x + 40, y + 10, 25, 0, Math.PI * 2);
            ctx.arc(x - 40, y + 10, 25, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw ground
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(0, this.canvas.height - this.groundHeight, this.canvas.width, this.groundHeight);
        
        // Draw grass
        ctx.fillStyle = '#228b22';
        ctx.fillRect(0, this.canvas.height - this.groundHeight, this.canvas.width, 10);
        
        // Draw obstacles
        for (const obs of this.obstacles) {
            if (obs.type === 'ground') continue;
            ctx.fillStyle = obs.type === 'wall' ? '#666' : '#8b4513';
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
        
        // Draw targets
        for (const target of this.targets) {
            if (!target.active) continue;
            ctx.save();
            ctx.translate(target.x, target.y);
            
            // Target body
            ctx.fillStyle = target.type === 'crate' ? '#d2691e' : '#555';
            ctx.fillRect(-target.width/2, -target.height/2, target.width, target.height);
            
            // HP bar
            const hpPercent = target.hp / target.maxHp;
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(-target.width/2, -target.height/2 - 10, target.width, 4);
            ctx.fillStyle = '#44ff44';
            ctx.fillRect(-target.width/2, -target.height/2 - 10, target.width * hpPercent, 4);
            
            ctx.restore();
        }
        
        // Draw hazards
        for (const hazard of this.hazards) {
            ctx.save();
            ctx.translate(hazard.x, hazard.y);
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.moveTo(0, -hazard.height/2);
            ctx.lineTo(hazard.width/2, hazard.height/2);
            ctx.lineTo(-hazard.width/2, hazard.height/2);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }
}