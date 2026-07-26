export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.color = 'lime';
        this.bullets = [];
        this.score = 0;
    }

    update(delta) {
        this.bullets = this.bullets.filter(b => b.active);
        this.bullets.forEach(b => b.update(delta));
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        this.bullets.forEach(b => b.draw(ctx));
    }

    shoot(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.hypot(dx, dy);
        const speed = 0.5;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;
        this.bullets.push(new Bullet(this.x, this.y, vx, vy));
    }
}

class Bullet {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 5;
        this.color = 'yellow';
        this.active = true;
    }

    update(delta) {
        this.x += this.vx * delta;
        this.y += this.vy * delta;
        if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
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