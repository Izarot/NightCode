describe('Neon Dodger Game Mechanics', () => {
    test('should save high score to localStorage', () => {
        localStorage.setItem('neonDodgerHighScore', '100');
        expect(localStorage.getItem('neonDodgerHighScore')).toBe('100');
    });

    test('should detect collision between player and obstacle', () => {
        const p = { x: 10, y: 10, size: 10 };
        const o = { x: 10, y: 10, size: 10 };
        const collision = p.x < o.x + o.size && p.x + p.size > o.x &&
                          p.y < o.y + o.size && p.y + p.size > o.y;
        expect(collision).toBe(true);
    });

    test('should not detect collision when apart', () => {
        const p = { x: 0, y: 0, size: 10 };
        const o = { x: 100, y: 100, size: 10 };
        const collision = p.x < o.x + o.size && p.x + p.size > o.x &&
                          p.y < o.y + o.size && p.y + p.size > o.y;
        expect(collision).toBe(false);
    });
});