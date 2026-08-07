export class Enemy {
    constructor(x, y, type = 'basic') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = type === 'boss' ? 64 : (type === 'elite' ? 32 : 24);
        this.hp = type === 'boss' ? 5000 : (type === 'elite' ? 800 : 100);
        this.speed = type === 'boss' ? 60 : (type === 'elite' ? 120 : 80);
        this.value = type === 'boss' ? 500 : (type === 'elite' ? 100 : 20);
        this.alive = true;
        this.color = type === 'boss' ? '#ff0066' : (type === 'elite' ? '#ff6600' : '#ff0033');
    }
    
    update(dt, player, bulletManager) {
        if (!this.alive) return;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
    }
    
    render(ctx) {
        if (!this.alive) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.type === 'boss') {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', 0, -this.radius - 15);
        }
        
        ctx.restore();
    }
}

export class EnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.wave = 0;
        this.maxEnemies = 10;
    }
    
    update(dt, player, bulletManager) {
        this.spawnTimer -= dt;
        
        if (this.spawnTimer <= 0) {
            this.spawn();
            this.spawnTimer = 1;
        }
        
        this.enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.update(dt, player, bulletManager);
            }
        });
        
        this.enemies = this.enemies.filter(e => e.alive);
    }
    
    spawn() {
        const types = ['basic', 'basic', 'basic', 'elite'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const edge = Math.floor(Math.random() * 4);
        let x, y;
        
        if (edge === 0) { x = Math.random() * 800; y = 0; }
        else if (edge === 1) { x = 800; y = Math.random() * 600; }
        else if (edge === 2) { x = Math.random() * 800; y = 600; }
        else { x = 0; y = Math.random() * 600; }
        
        this.enemies.push(new Enemy(x, y, type));
    }
    
    destroy(enemy) {
        enemy.alive = false;
    }
    
    render(ctx) {
        this.enemies.forEach(enemy => enemy.render(ctx));
    }
}