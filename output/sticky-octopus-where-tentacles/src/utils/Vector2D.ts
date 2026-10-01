class Vector2D {
    constructor(public x: number, public y: number) {}

    public length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public normalize(): Vector2D {
        const len = this.length();
        return new Vector2D(this.x / len, this.y / len);
    }

    public multiply(scalar: number): Vector2D {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    public add(other: Vector2D): Vector2D {
        return new Vector2D(this.x + other.x, this.y + other.y);
    }
}

export { Vector2D };