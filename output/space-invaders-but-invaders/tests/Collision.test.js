import { Collision } from '../physics/Collision.js';

describe('Collision', () => {
    test('should detect AABB collision', () => {
        const collision = new Collision();
        const a = { x: 0, y: 0, width: 10, height: 10 };
        const b = { x: 5, y: 5, width: 10, height: 10 };
        expect(collision.aabb(a, b)).toBe(true);
    });
    
    test('should not detect AABB collision when separated', () => {
        const collision = new Collision();
        const a = { x: 0, y: 0, width: 10, height: 10 };
        const b = { x: 20, y: 20, width: 10, height: 10 };
        expect(collision.aabb(a, b)).toBe(false);
    });
});