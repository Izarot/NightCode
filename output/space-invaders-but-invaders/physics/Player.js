export class Player {
    constructor(canvas, pool) {
        this.canvas = canvas;
        this.pool = pool;
        this.x = canvas.width / 2 - 15;
        this.y = canvas.height - 60;
        this.width = 30;
        this.height = 20;
        this.speed = 400;
        this.velX = 0;
        this.health = 3;
        this.maxHealth = 3;
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.keys = { left: false, right: false, fire: false };
        this.cooldown = 0;
        this.color = '#00FFFF';
        this.trail = [];
    }
    
    update(dt) {
        this.handleInput();
        this.x += this.velX * dt;
        this.x = Math.max(0, Math.min(this.canvas.width - this.width, this.x));
        
        this.cooldown -= dt;
        if (this.cooldown > 0) this.cooldown = 0;
        
        this.updateCombo(dt);
        this.updateTrail();
    }
    
    handleInput() {
        this.velX = 0;
        if (this.keys.left) this.velX = -this.speed;
        if (this.keys.right) this.velX = this.speed;
        
        if (this.keys.fire && this.cooldown <= 0) {
            this.fire();
            this.cooldown = 0.3;
        }
    }
    
    fire() {
        const projectile = this.pool.getProjectile();
        projectile.init(this.x + this.width / 2, this.y, 0, -600, true);
    }
    
    updateCombo(dt) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
            this.combo = 0;
        }
    }
    
    updateTrail() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();
    }
    
    render(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}