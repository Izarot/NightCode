export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 16;
        this.speed = 240;
        this.maxSpeed = 320;
        this.velX = 0;
        this.velY = 0;
        this.friction = 0.85;
        this.acceleration = 0.15;
        this.hp = 100;
        this.maxHp = 100;
        this.dashCooldown = 3;
        this.dashDistance = 480;
        this.dashTime = 0;
        this.invincible = false;
        this.angle = 0;
    }
    
    update(dt, keys, mouse, width, height, bulletManager) {
        let targetX = 0;
        let targetY = 0;
        
        if (keys['ArrowUp'] || keys['w']) targetY -= 1;
        if (keys['ArrowDown'] || keys['s']) targetY += 1;
        if (keys['ArrowLeft'] || keys['a']) targetX -= 1;
        if (keys['ArrowRight'] || keys['d']) targetX += 1;
        
        if (keys[' ']) {
            if (this.dashCooldown <= 0 && this.dashTime <= 0) {
                this.dashTime = 0.1;
                this.invincible = true;
                this.dashCooldown = 3;
            }
        }
        
        if (targetX !== 0 || targetY !== 0) {
            const len = Math.sqrt(targetX*targetX + targetY*targetY);
            targetX = targetX / len;
            targetY = targetY / len;
            
            this.velX += targetX * this.acceleration * 60 * dt;
            this.velY += targetY * this.acceleration * 60 * dt;
        }
        
        this.velX *= this.friction;
        this.velY *= this.friction;
        
        this.x += this.velX * this.speed * dt;
        this.y += this.velY * this.speed * dt;
        
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
        
        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        
        if (this.dashTime > 0) {
            this.dashTime -= dt;
            if (this.dashTime <= 0) this.invincible = false;
        }
        
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.lineTo(16, -12);
        ctx.lineTo(16, 12);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#0066ff';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
}