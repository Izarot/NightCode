class ObjectPool<T> {
    private pool: T[] = [];
    private createFn: () => T;

    constructor(createFn: () => T) {
        this.createFn = createFn;
    }

    public acquire(): T {
        return this.pool.pop() || this.createFn();
    }

    public release(obj: T) {
        this.pool.push(obj);
    }
}

export { ObjectPool };