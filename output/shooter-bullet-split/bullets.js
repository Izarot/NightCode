export class Bullet {
    constructor(x, y, velX, velY, damage, generation = 0) {
        this.x = x;
        this.y = y;
        this.velX = velX;
        this.velY = velY;
        this.damage = damage;
        this.generation = generation;
        this.radius = 8 - generation * 2;
        this.life = 1.2;
        this.alive = true;
        this.color = generation === 0 ? '#00ffff' : (generation === 1 ? '#00ffcc' : (generation === 2 ? '#00ff99' : '#00ff66'));
    }
    
    update(dt) {
        if (!this.alive) return;
        
        this.x += this.velX * dt;
        this.y += this.velY * dt;
        this.life -= dt;
        
        if (this.life <= 0) this.alive = false;
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.globalAlpha = 1 - this.generation * 0.2;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

export class BulletManager {
    constructor() {
        this.bullets = [];
        this.fireRate = 0.1;
        this.fireTimer = 0;
        this.magazine = 30;
        this.totalAmmo = 120;
    }
    
    canFire() {
        return this.fireTimer <= 0 && this.magazine > 0;
    }
    
    fire(x, y, mouseX, mouseY, angle) {
        if (!this.canFire()) return;
        
        const dx = mouseX - x;
        const dy = mouseY - y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const velX = (dx / dist) * 480;
        const velY = (dy / dist) * 480;
        
        this.bullets.push(new Bullet(x, y, velX, velY, 100));
        this.fireTimer = this.fireRate;
        this.magazine--;
    }
    
    split(x, y, targetX, targetY, generation) {
        if (generation >= 4) return;
        
        const angle = Math.atan2(targetY - y, targetX - x);
        
        for (let i = 0; i < 3; i++) {
            const splitAngle = angle + (i - 1) * Math.PI / 3;
            const speed = 360;
            const velX = Math.cos(splitAngle) * speed;
            const velY = Math.sin(splitAngle) * speed;
            
            const newGen = generation + 1;
            const damage = 100 * Math.pow(0.5, newGen);
            
            this.bullets.push(new Bullet(x, y, velX, velY, damage, newGen));
        }
    }
    
    update(dt) {
        this.fireTimer -= dt;
        
        this.bullets.forEach(bullet => bullet.update(dt));
        this.bullets = this.bullets.filter(b => b.alive);
    }
    
    render(ctx) {
        this.bullets.forEach(bullet => bullet.render(ctx));
    }
}