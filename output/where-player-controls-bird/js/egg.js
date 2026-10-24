class EggSystem {
    constructor() {
        this.eggs = [];
        this.cooldown = 0;
        this.maxEggs = 10;
        this.currentEggs = 10;
        this.regenRate = 1.5; // seconds per egg
        this.regenTimer = 0;
    }

    dropEgg(x, y, vx, type = 'standard') {
        if (this.cooldown > 0 || this.currentEggs <= 0) return false;
        
        const egg = {
            x, y,
            vx: vx * 0.8 + Utils.random(-20, 20),
            vy: 0,
            type,
            radius: 10,
            damage: type === 'standard' ? 100 : 50,
            blastRadius: type === 'standard' ? 30 : 15,
            active: true,
            timeToDetonate: type === 'timed' ? 2 : 0
        };
        
        this.eggs.push(egg);
        this.currentEggs--;
        this.cooldown = 0.4;
        AudioSystem.playDrop();
        return true;
    }

    update(dt) {
        // Cooldown
        if (this.cooldown > 0) this.cooldown -= dt;
        
        // Regeneration
        this.regenTimer += dt;
        if (this.regenTimer >= this.regenRate && this.currentEggs < this.maxEggs) {
            this.currentEggs++;
            this.regenTimer = 0;
        }
        
        // Update eggs
        for (let i = this.eggs.length - 1; i >= 0; i--) {
            const egg = this.eggs[i];
            
            // Physics
            egg.vy += 200 * dt; // gravity
            egg.x += egg.vx * dt;
            egg.y += egg.vy * dt;
            
            // Timed eggs
            if (egg.type === 'timed') {
                egg.timeToDetonate -= dt;
                if (egg.timeToDetonate <= 0) {
                this.explodeEgg(egg, i);
                    continue;
                }
            }
            
            // Ground collision
            if (egg.y > Game.environment.canvas.height - Game.environment.groundHeight) {
                this.explodeEgg(egg, i);
                continue;
            }
            
            // Target collision
            const target = Game.targetSystem.checkCollision(egg.x, egg.y, egg.blastRadius);
            if (target) {
                const score = Game.targetSystem.damageTarget(target, egg.damage);
                Game.addScore(score);
                this.explodeEgg(egg, i);
            }
        }
    }

    explodeEgg(egg, index) {
        Game.particleSystem.createExplosion(egg.x, egg.y, '#ffd700', 30);
        AudioSystem.playExplosion();
        this.eggs.splice(index, 1);
    }

    render(ctx) {
        for (const egg of this.eggs) {
            ctx.save();
            ctx.translate(egg.x, egg.y);
            
            // Egg body
            ctx.fillStyle = egg.type === 'standard' ? '#ffffff' : 
                           egg.type === 'cluster' ? '#a9a9a9' :
                           egg.type === 'timed' ? '#ff4444' : '#44ff44';
            ctx.beginPath();
            ctx.ellipse(0, 0, egg.radius, egg.radius * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Egg pattern
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-egg.radius, 0);
            ctx.lineTo(egg.radius, 0);
            ctx.stroke();
            
            ctx.restore();
        }
    }
}