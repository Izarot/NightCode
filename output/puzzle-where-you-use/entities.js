export class EntityManager {
    constructor() {
        this.objects = [];
        this.totalKeys = 2;
        this.keysLocked = 0;
        this.initLevel();
    }

    initLevel() {
        // Keys
        this.objects.push({ x: 100, y: 100, vx: 0, vy: 0, radius: 15, color: '#00d2ff', isKey: true, type: 1 });
        this.objects.push({ x: 100, y: 300, vx: 0, vy: 0, radius: 15, color: '#ff007a', isKey: true, type: 2 });
        
        // Locks
        this.locks = [
            { x: 500, y: 100, radius: 25, color: '#00d2ff', type: 1, active: false },
            { x: 500, y: 300, radius: 25, color: '#ff007a', type: 2, active: false }
        ];
    }

    update(physics) {
        this.objects.forEach(obj => {
            if (obj.isKey) {
                this.locks.forEach(lock => {
                    if (!lock.active && lock.type === obj.type) {
                        const dx = obj.x - lock.x;
                        const dy = obj.y - lock.y;
                        if (Math.sqrt(dx*dx + dy*dy) < 30) {
                            lock.active = true;
                            this.keysLocked++;
                        }
                    }
                });
            }
        });
    }

    draw(ctx) {
        // Draw Locks
        this.locks.forEach(lock => {
            ctx.beginPath();
            ctx.arc(lock.x, lock.y, lock.radius, 0, Math.PI * 2);
            ctx.strokeStyle = lock.active? '#fff' : lock.color;
            ctx.lineWidth = 5;
            ctx.stroke();
            if (lock.active) {
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fill();
            }
        });

        // Draw Keys
        this.objects.forEach(obj => {
            if (obj.isKey) {
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                ctx.fillStyle = obj.color;
                ctx.fill();
                ctx.shadowBlur = 15;
                ctx.shadowColor = obj.color;
            }
        });
        ctx.shadowBlur = 0;
    }
}