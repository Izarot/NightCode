export class Pool<T> {
    private items: T[] = [];
    constructor(private createFn: () => T) {}
    acquire(): T {
        return this.items.pop() || this.createFn();
    }
    release(item: T) {
        this.items.push(item);
    }
}