export class Entity {
  public id: number;
  public components: Map<string, any> = new Map();
  constructor(id: number) { this.id = id; }
  addComponent<T>(type: new (...args: any[]) => T, ...args: any[]): this {
    this.components.set(type.name, args[0]);
    return this;
  }
  getComponent<T>(type: new (...args: any[]) => T): T {
    return this.components.get(type.name) as T;
  }
  removeComponent<T>(type: new (...args: any[]) => T): this {
    this.components.delete(type.name);
    return this;
  }
}

export class Component {
  constructor(public type: new (...args: any[]) => any) {}
}

export class System {
  protected world: World;
  constructor(world: World) { this.world = world; }
  public update(dt: number) {}
}

export class World {
  public entities: Entity[] = [];
  public systems: System[] = [];
  public addEntity(e: Entity) { this.entities.push(e); }
  public addSystem(s: System) { this.systems.push(s); }
  public update(dt: number) { this.systems.forEach(s => s.update(dt)); }
}
