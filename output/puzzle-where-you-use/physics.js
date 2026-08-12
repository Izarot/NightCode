export class Physics {
    constructor() {
        this.friction = 0.95;
    }

    applyMagnet(objects, magnet) {
        objects.forEach(obj => {
            const dx = magnet.x - obj.x;
            const dy = magnet.y - obj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < magnet.radius && dist > 5) {
                const force = magnet.strength * (1 - dist / magnet.radius);
                obj.vx += (dx / dist) * force * magnet.polarity;
                obj.vy += (dy / dist) * force * magnet.polarity;
            }

            obj.vx *= this.friction;
            obj.vy *= this.friction;
            obj.x += obj.vx;
            obj.y += obj.vy;

            // Boundary check
            if (obj.x < 0 || obj.x > window.innerWidth) obj.vx *= -1;
            if (obj.y < 0 || obj.y > window.innerHeight) obj.vy *= -1;
        });
    }
}