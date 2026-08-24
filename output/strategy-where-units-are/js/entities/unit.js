// Unit Entity Class
const MUTATION_COSTS = {
    enhanced_metabolism: 20,
    cell_wall: 30,
    toxicity: 25,
    photosynthesis: 35,
    spore_burst: 40
};

function createUnit(type, position) {
    return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        type: type,
        x: position.x,
        y: position.y,
        health: 100,
        energy: 50,
        maxHealth: 100,
        maxEnergy: 50,
        speed: getDefaultSpeed(type),
        mutated: false,
        mutationType: null,
        lastSpawn: Date.now(),
        isAlive: true,
        attackDamage: 5,
        meleeRange: 30,
        energyRegeneration: 2,
        
        getDefaultSpeed() {
            return getDefaultSpeed(this.type);
        },
        
        takeDamage(amount) {
            this.health = Math.max(0, this.health - amount);
            if (this.health <= 0) {
                this.health = 0;
                this.isAlive = false;
            }
        },
        
        heal() {
            if (!this.isAlive) return;
            this.health = Math.min(this.maxHealth, this.health + 1);
            this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegeneration);
        },
        
        moveTo(target) {
            if (!this.isAlive) return;
            
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 0.5) return;
            
            const moveDist = this.speed * 0.016;
            const step = Math.min(dist, moveDist);
            this.x += (dx / dist) * step;
            this.y += (dy / dist) * step;
            
            this.energy = Math.max(0, this.energy - 0.05);
        },
        
        split() {
            if (!this.isAlive) return;
            
            if (this.energy < 5) {
                console.warn('Not enough energy to split');
                return null;
            }
            
            this.energy -= 5;
            
            const offset = (Math.random() - 0.5) * 8;
            const child1 = createUnit(this.type, { x: this.x + offset, y: this.y });
            const child2 = createUnit(this.type, { x: this.x - offset, y: this.y });
            
            child1.energy = this.maxEnergy;
            child2.energy = this.maxEnergy;
            child1.speed = this.speed * 0.9;
            child2.speed = this.speed * 0.9;
            
            if (typeof GameState !== 'undefined') {
                GameState.units.push(child1);
                GameState.units.push(child2);
            }
            
            this.isAlive = false;
            this.mutated = true;
            this.mutationType = 'split';
            
            console.log('Splitting ' + this.type + ' at (' + this.x.toFixed(1) + ', ' + this.y.toFixed(1) + ')');
            return [child1, child2];
        },
        
        mutate(mutationType) {
            if (!this.isAlive) return;
            
            const cost = MUTATION_COSTS[mutationType] || 0;
            if (typeof GameState !== 'undefined' && GameState.mp < cost) {
                console.warn('Not enough MP for ' + mutationType + ' mutation');
                return;
            }
            
            if (typeof GameState !== 'undefined') {
                GameState.mp -= cost;
            }
            
            this.mutated = true;
            this.mutationType = mutationType;
            
            switch (mutationType) {
                case 'enhanced_metabolism':
                    this.maxEnergy = 70;
                    this.speed = 135;
                    break;
                case 'cell_wall':
                    this.speed = 105;
                    this.maxHealth = 140;
                    this.health = Math.min(this.health + 40, this.maxHealth);
                    break;
                case 'toxicity':
                    this.attackDamage = 15;
                    this.meleeRange = 45;
                    break;
                case 'photosynthesis':
                    this.energyRegeneration = 8;
                    break;
                case 'spore_burst':
                    this.sporeBurstEffect = true;
                    break;
                default:
                    break;
            }
            
            console.log('Mutated ' + this.type + ' with ' + mutationType);
        },
        
        isAliveCheck() {
            return this.health > 0 && this.isAlive;
        },
        
        toHudInfo() {
            return {
                id: this.id,
                type: this.type,
                health: this.health,
                energy: this.energy,
                maxHealth: this.maxHealth,
                speed: this.speed,
                mutated: this.mutated,
                mutationType: this.mutationType
            };
        }
    };
}

const Unit = {
    create: createUnit
};
