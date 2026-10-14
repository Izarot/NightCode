import { Vector2 } from '../utils/Vector2.js';

class SoundMarker {
    constructor(x, y, config) {
        this.position = new Vector2(x, y);
        this.radius = 20;
        this.config = config;
        this.pulse = 0;
        this.active = true;
        this.dead = false;
    }

    update(deltaTime) {
        this.pulse += deltaTime * 4;
    }

    render(ctx) {
        const pulseScale = 1 + Math.sin(this.pulse) * 0.2;
        const radius = this.radius * pulseScale;
        
        // Outer glow
        const gradient = ctx.createRadialGradient(
            this.position.x, this.position.y, 0,
            this.position.x, this.position.y, radius * 2
        );
        gradient.addColorStop(0, 'rgba(255, 0, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

export { SoundMarker };