export class UnitManager {
    constructor(game) {
        this.game = game;
        this.units = [];
        this.maxUnits = 50;
    }
    
    update(dt) {
        // Update unit positions
        this.units.forEach(unit => {
            unit.update(dt);
        });
        
        // Simple collision
        for (let i = 0; i < this.units.length; i++) {
            for (let j = i + 1; j < this.units.length; j++) {
                this.handleCollision(this.units[i], this.units[j]);
            }
        }
    }
    
    render(ctx) {
        this.units.forEach(unit => unit.render(ctx));
    }
    
    spawnUnit() {
        if (this.units.length < this.maxUnits && this.game.gameState.nutrients >= 5) {
            this.game.gameState.nutrients -= 5;
            this.units.push(new Unit(this.game, 100, 100));
        }
    }
    
    splitUnit() {
        if (this.units.length > 0 && this.units[0].canSplit) {
            this.units[0].split();
        }
    }
    
    mutateUnit() {
        if (this.units.length > 0 && this.game.gameState.mp >= 10) {
            this.game.gameState.mp -= 10;
            this.units[0].mutate();
        }
    }
    
    handleClick(x, y) {
        // Simple movement command
        if (this.units.length > 0) {
            this.units[0].setTarget(x, y);
        }
    }
    
    handleCollision(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = a.radius + b.radius;
        
        if (distance < minDistance) {
            const overlap = (minDistance - distance) / 2;
            a.x -= (dx / distance) * overlap;
            a.y -= (dy / distance) * overlap;
            b.x += (dx / distance) * overlap;
            b.y += (dy / distance) * overlap;
        }
    }
}

class Unit {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.health = 100;
        this.speed = 150;
        this.target = null;
        this.canSplit = true;
        this.splitCooldown = 0;
        this.mutations = [];
    }
    
    update(dt) {
        if (this.splitCooldown > 0) {
            this.splitCooldown -= dt;
            this.canSplit = this.splitCooldown <= 0;
        }
        
        if (this.target) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                const speed = this.speed * dt;
                this.x += (dx / distance) * speed;
                this.y += (dy / distance) * speed;
            }
        }
    }
    
    render(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00eaff';
        ctx.fill();
        ctx.closePath();
        
        // Health bar
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - this.radius, this.y - this.radius - 10, this.radius * 2 * (this.health / 100), 4);
    }
    
    setTarget(x, y) {
        this.target = { x, y };
    }
    
    split() {
        if (!this.canSplit) return;
        
        this.splitCooldown = 2;
        this.game.units.units.push(new Unit(this.game, this.x + 20, this.y));
        this.game.units.units.push(new Unit(this.game, this.x - 20, this.y));
        
        // Remove original unit
        const index = this.game.units.units.indexOf(this);
        if (index > -1) {
            this.game.units.units.splice(index, 1);
        }
    }
    
    mutate() {
        this.mutations.push('enhanced');
        this.speed *= 1.2;
        this.radius *= 1.1;
    }
}