import { Vec2 } from '../utils/math';

export function circleCircle(a: Vec2, ar: number, b: Vec2, br: number): boolean {
    return a.sub(b).length() < (ar + br);
}

export function resolveCircleCircle(a: Vec2, ar: number, b: Vec2, br: number, ma: number, mb: number): { a: Vec2, b: Vec2 } {
    const dist = a.sub(b);
    const d = dist.length();
    if (d === 0) return { a: new Vec2(), b: new Vec2() };
    const overlap = (ar + br - d);
    const sep = dist.normalize().mul(overlap * (ma / (ma + mb)));
    return { a: sep, b: sep.mul(-1) };
}