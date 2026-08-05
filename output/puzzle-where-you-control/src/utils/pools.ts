export class ObjectPool<T> {
  private factory: () => T;
  private pool: T[] = [];
  constructor(factory: () => T) { this.factory = factory; }
  public acquire(): T { 
    if (this.pool.length) { 
      return this.pool.pop()!; 
    } 
    return this.factory(); 
  }
  public release(obj: T) { this.pool.push(obj); }
}
