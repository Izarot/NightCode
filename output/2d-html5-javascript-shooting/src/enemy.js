export class EnemyManager {
    constructor() {
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2000; // ms
    }

    update(delta) {
        this.spawnTimer += delta;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawn();
        }
        this.enemies = this.enemies.filter(e => e.active);
        this.enemies.forEach(e => e.update(delta));
    }

    draw(ctx) {
        this.enemies.forEach(e => e.draw(ctx));
    }

    spawn() {
        const x = Math.random() * 760 + 20;
        const y = -20;
        this.enemies.push(new Enemy(x, y));
    }
}

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.color = 'red';
        this.speed = 0.1;
        this.active = true;
    }

    update(delta) {
        this.y += this.speed * delta;
        if (this.y > 620) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}