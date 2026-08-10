export class Enemy {
    constructor(x, y, wave, evolution) {
        this.x = x;
        this.y = y;
        this.wave = wave;
        this.evolution = evolution;
        this.width = 25;
        this.height = 20;
        this.health = 1;
        this.maxHealth = 1;
        this.speed = 50;
        this.color = '#FF00FF';
        this.projectileCooldown = 0;
        this.projectileInterval = 1;
        this.markedForDeletion = false;
        this.shield = 0;
        this.jitter = false;
        this.splitOnDeath = false;
        this.trail = [];
        this.initializeStats();
    }
    
    initializeStats() {
        const tier = this.evolution.getTier();
        const mutation = this.evolution.getMutationLevel();
        
        this.speed = 50 + mutation * 30;
        this.maxHealth = tier;
        this.health = this.maxHealth;
        this.projectileInterval = Math.max(0.3, 1.5 - mutation * 0.2);
        
        if (tier >= 2) {
            this.speed += 30;
        }
        if (tier >= 3) {
            this.shield = 1;
        }
        if (tier >= 4) {
            this.splitOnDeath = true;
        }
    }
    
    update(dt, player) {
        this.updateMovement(dt);
        this.updateProjectiles(dt, player);
        this.updateTrail();
    }
    
    updateMovement(dt) {
        const jitterAmount = 2;
        if (this.evolution.getTier() >= 3) {
            this.x += (Math.random() - 0.5) * jitterAmount;
        }
        
        this.y += this.speed * dt;
        
        if (this.y > 800) {
            this.markedForDeletion = true;
        }
    }
    
    updateProjectiles(dt, player) {
        this.projectileCooldown -= dt;
        if (this.projectileCooldown <= 0) {
            this.fire(player);
            this.projectileCooldown = this.projectileInterval;
        }
    }
    
    fire(player) {
        const projectile = this.getProjectileFromPool();
        if (projectile) {
            const angle = Math.atan2((player.y + player.height/2) - (this.y + this.height/2), (player.x + player.width/2) - this.x);
            const speed = 200 + this.evolution.getMutationLevel() * 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            projectile.init(this.x + this.width/2, this.y + this.height/2, vx, vy, false);
        }
    }
    
    getProjectileFromPool() {
        return null;
    }
    
    takeDamage(damage) {
        if (this.shield > 0) {
            this.shield -= damage;
            return;
        }
        
        this.health -= damage;
        if (this.health <= 0) {
            this.markedForDeletion = true;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        if (this.shield > 0) {
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(this.x - 2, this.y - 8, this.width + 4, 4);
        }
        
        ctx.restore();
    }
}