export class Vec2 {
    x: number;
    y: number;
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    add(v: Vec2) { return new Vec2(this.x + v.x, this.y + v.y); }
    sub(v: Vec2) { return new Vec2(this.x - v.x, this.y - v.y); }
    mul(s: number) { return new Vec2(this.x * s, this.y * s); }
    length() { return Math.sqrt(this.x*this.x + this.y*this.y); }
    normalize() {
        const l = this.length();
        return l > 0 ? new Vec2(this.x/l, this.y/l) : new Vec2();
    }
    dot(v: Vec2) { return this.x*v.x + this.y*v.y; }
}

export function lerp(a: number, b: number, t: number) { return a + (b-a)*t; }
export function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }