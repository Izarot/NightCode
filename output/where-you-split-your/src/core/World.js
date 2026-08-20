export class World {
    constructor() {
        this.entities = [];
        this.systems = [];
        this.playerEntity = null;
    }
    
    addSystem(system) {
        this.systems.push(system);
        system.world = this;
    }
    
    init() {
        // Create player entity
        const player = this.createEntity();
        player.addComponent('transform', { x: 100, y: 100, w: 16, h: 24 });
        player.addComponent('velocity', { x: 0, y: 0, maxX: 200, maxY: 400, dragX: 0.1, dragY: 0.1 });
        player.addComponent('physicsBody', { solid: true, sensor: false, friction: 0.1, restitution: 0.1, collisionLayer: 1, collisionMask: 2, oneWayPlatform: false });
        player.addComponent('playerControl', { inputMap: {}, stateMachineRef: 'idle', splitCooldown: 0 });
        player.addComponent('splitController', { maxSplits: 3, currentSplitCount: 0, mergeRange: 24, mergeCooldown: 0, activeFragments: [player.id] });
        player.addComponent('fragmentData', { id: player.id, parentId: null, isPrimary: true, mass: 1.0, sizeMultiplier: 1.0, abilityFlags: 0b111 });
        this.playerEntity = player;
        
        // Simple level platforms
        this.createPlatform(0, 200, 480, 20);
        this.createPlatform(100, 150, 100, 20);
        this.createPlatform(250, 120, 100, 20);
        this.createPlatform(400, 80, 80, 20);
    }
    
    createEntity() {
        const entity = { id: Math.random().toString(36).substr(2, 9), components: {} };
        this.entities.push(entity);
        return entity;
    }
    
    createPlatform(x, y, w, h) {
        const entity = this.createEntity();
        entity.addComponent('transform', { x, y, w, h });
        entity.addComponent('physicsBody', { solid: true, sensor: false, friction: 0.5, restitution: 0, collisionLayer: 2, collisionMask: 1, oneWayPlatform: true });
        return entity;
    }
    
    update(dt) {
        this.systems.forEach(system => system.update(dt));
        // Clean up destroyed entities
        this.entities = this.entities.filter(e => !e._destroyed);
    }
    
    render(alpha) {
        this.systems.find(s => s.constructor.name === 'RenderSystem').render(alpha);
    }
    
    getPlayerData() {
        if (!this.playerEntity) return {};
        const transform = this.playerEntity.getComponent('transform');
        const splitCtrl = this.playerEntity.getComponent('splitController');
        const fragmentData = this.playerEntity.getComponent('fragmentData');
        return {
            position: { x: transform.x, y: transform.y },
            fragmentCount: splitCtrl.currentSplitCount + 1,
            mass: fragmentData.mass,
            maxSplits: splitCtrl.maxSplits
        };
    }
}

// Component helper
Entity.prototype.addComponent = function(name, data) {
    this.components[name] = { ...data, _name: name };
    return this;
};

Entity.prototype.getComponent = function(name) {
    return this.components[name];
};

Entity.prototype.destroy = function() {
    this._destroyed = true;
};