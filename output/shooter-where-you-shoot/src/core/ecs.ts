export class Entity {
    id: number;
    components: Map<string, any> = new Map();
    constructor(id: number) { this.id = id; }
    addComponent<T>(name: string, component: T): Entity {
        this.components.set(name, component);
        return this;
    }
    getComponent<T>(name: string): T | undefined {
        return this.components.get(name) as T;
    }
}

export interface System {
    update(dt: number, entities: Entity[]): void;
}

export class ECS {
    entities: Entity[] = [];
    systems: System[] = [];
    
    createEntity(): Entity {
        const e = new Entity(this.entities.length);
        this.entities.push(e);
        return e;
    }
    
    addSystem(system: System) { this.systems.push(system); }
    
    update(dt: number) {
        for (const system of this.systems) {
            system.update(dt, this.entities);
        }
    }
}