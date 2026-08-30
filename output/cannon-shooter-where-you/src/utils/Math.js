export class MathUtils {
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    }
}