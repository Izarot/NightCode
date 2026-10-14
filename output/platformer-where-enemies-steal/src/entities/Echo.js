import { Vector2 } from '../utils/Vector2.js';

class Echo {
    constructor(x, y, config) {
        this.position = new Vector2(x, y);
        this.velocity = new Vector2(Math.random() * 40 - 20, -20);
        this.size = new Vector2(16, 16);
        this.config = config;
        this.life = 5.0;
        this.maxLife = 5.0;
        this.dead = false;
        this.collected = false;
    }

    update(deltaTime) {
        this.velocity.y += 0.5 * deltaTime; // Gravity
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;
        this.life -= deltaTime;
        
        if (this.life <= 0) {
            this.dead = true;
        }
    }

    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
        
        // Pulsing echo
        const pulse = 1 + Math.sin(performance.now() / 200) * 0.3;
        ctx.beginPath();
        ctx.arc(
            this.position.x + this.size.x / 2,
            this.position.y + this.size.y / 2,
            this.size.x / 2 * pulse,
            0, Math.PI * 2
        );
        ctx.fill();
    }

    checkCollection(player) {
        if (this.collected) return false;
        
        const distance = Math.hypot(
            this.position.x - player.position.x,
            this.position.y - player.position.y
        );
        
        if (distance < 30) {
            this.collected = true;
            this.dead = true;
            return true;
        }
        
        return false;
    }
}

export { Echo };