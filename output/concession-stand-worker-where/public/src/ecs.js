// Entity-Component-System implementation
class Component {}

class Transform extends Component {
    constructor(x = 0, y = 0, lane = 1, node = 0) {
        super();
        this.x = x;
        this.y = y;
        this.lane = lane; // 0: top, 1: middle, 2: bottom
        this.node = node; // position in lane
        this.targetNode = node;
        this.moving = false;
        this.progress = 0;
    }
}

class Sprite extends Component {
    constructor(image, width = 32, height = 32) {
        super();
        this.image = image;
        this.width = width;
        this.height = height;
        this.frame = 0;
        this.timer = 0;
    }
}

class Physics extends Component {
    constructor(speed = 12, stamina = 100, maxStamina = 100) {
        super();
        this.speed = speed;
        this.stamina = stamina;
        this.maxStamina = maxStamina;
    }
}

class Inventory extends Component {
    constructor(maxSlots = 2) {
        super();
        this.slots = new Array(maxSlots).fill(null);
        this.maxSlots = maxSlots;
    }
    
    addItem(item) {
        const empty = this.slots.findIndex(s => s === null);
        if (empty !== -1) {
            this.slots[empty] = item;
            return true;
        }
        return false;
    }
    
    hasItem(item) {
        return this.slots.includes(item);
    }
    
    clear() {
        this.slots.fill(null);
    }
}

class Order extends Component {
    constructor(recipeId, patience = 30) {
        super();
        this.recipeId = recipeId;
        this.patience = patience;
        this.maxPatience = patience;
        this.progress = [];
    }
}

class Customer extends Component {
    constructor(archetype = 'standard') {
        super();
        this.archetype = archetype;
        this.state = 'waiting'; // waiting, ordering, leaving, served
    }
}

class Station extends Component {
    constructor(type, upgradeLevel = 0) {
        super();
        this.type = type; // grill, bun, register, etc.
        this.queue = [];
        this.processing = null;
        this.timer = 0;
        this.upgradeLevel = upgradeLevel;
    }
}

class Entity {
    constructor(id) {
        this.id = id;
        this.components = new Map();
    }
    
    addComponent(component) {
        this.components.set(component.constructor, component);
        return this;
    }
    
    getComponent(type) {
        return this.components.get(type);
    }
    
    hasComponent(type) {
        return this.components.has(type);
    }
    
    removeComponent(type) {
        this.components.delete(type);
    }
}

class World {
    constructor() {
        this.entities = new Map();
        this.systems = [];
        this.nextId = 0;
        this.player = null;
    }
    
    addSystem(system) {
        this.systems.push(system);
        system.world = this;
    }
    
    createEntity() {
        const entity = new Entity(this.nextId++);
        this.entities.set(entity.id, entity);
        return entity;
    }
    
    getEntitiesWithComponent(componentType) {
        return Array.from(this.entities.values()).filter(e => e.hasComponent(componentType));
    }
    
    init() {
        // Create player
        this.player = this.createEntity()
            .addComponent(new Transform(0, 0, 1, 1))
            .addComponent(new Sprite(AssetManager.images.worker))
            .addComponent(new Physics())
            .addComponent(new Inventory());
        
        // Create stations
        const stations = [
            { type: 'grill', lane: 0, node: 0 }, // Top lane, left node
            { type: 'bun', lane: 0, node: 2 },   // Top lane, right node
            { type: 'register', lane: 1, node: 1 } // Middle lane, center
        ];
        
        stations.forEach((s, i) => {
            const entity = this.createEntity()
                .addComponent(new Transform(0, 0, s.lane, s.node))
                .addComponent(new Sprite(AssetManager.images[`images.${s.type}`]))
                .addComponent(new Station(s.type));
            
            // Position will be set by render system based on lane/node
        });
        
        // Spawn first customer
        this.spawnCustomer();
    }
    
    spawnCustomer() {
        const entity = this.createEntity()
            .addComponent(new Transform(0, 0, 1, 0)) // Start in middle lane, left node
            .addComponent(new Sprite(AssetManager.images.customer))
            .addComponent(new Customer('standard'))
            .addComponent(new Order('burger', 30));
        
        // Set target to register
        const transform = entity.getComponent(Transform);
        transform.targetNode = 1; // Middle node in lane
    }
    
    update(dt) {
        this.systems.forEach(system => {
            if (system.update) system.update(dt);
        });
    }
    
    render(alpha) {
        this.systems.forEach(system => {
            if (system.render) system.render(alpha);
        });
    }
}

export { World, Entity, Transform, Sprite, Physics, Inventory, Order, Customer, Station };