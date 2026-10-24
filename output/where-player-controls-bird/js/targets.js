class TargetSystem {
    constructor() {
        this.targets = [];
    }

    addTarget(x, y, type = 'crate') {
        const target = {
            x, y,
            width: 40, height: 40,
            hp: type === 'crate' ? 50 : 100,
            maxHp: type === 'crate' ? 50 : 100,
            type,
            active: true,
            scoreValue: type === 'crate' ? 100 : 200
        };
        this.targets.push(target);
        return target;
    }

    update(dt) {
        // Simple target movement for vehicles
        for (const target of this.targets) {
            if (target.type === 'vehicle') {
                target.x += Math.sin(Game.time) * 20 * dt;
            }
        }
    }

    checkCollision(x, y, radius) {
        for (const target of this.targets) {
            if (!target.active) continue;
            const dx = target.x - x;
            const dy = target.y - y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            if (distance < radius + target.width/2) {
                return target;
            }
        }
        return null;
    }

    damageTarget(target, damage) {
        target.hp -= damage;
        if (target.hp <= 0) {
            target.active = false;
            Game.particleSystem.createExplosion(target.x, target.y, '#ff6b6b', 30);
            AudioSystem.playExplosion();
            return target.scoreValue;
        }
        return 0;
    }

    render(ctx) {
        for (const target of this.targets) {
            if (!target.active) continue;
            ctx.save();
            ctx.translate(target.x, target.y);
            
            ctx.fillStyle = target.type === 'crate' ? '#d2691e' : '#555';
            ctx.fillRect(-target.width/2, -target.height/2, target.width, target.height);
            
            // HP bar
            const hpPercent = target.hp / target.maxHp;
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(-target.width/2, -target.height/2 - 10, target.width, 4);
            ctx.fillStyle = '#44ff44';
            ctx.fillRect(-target.width/2, -target.height/2 - 10, target.width * hpPercent, 4);
            
            ctx.restore();
        }
    }
}