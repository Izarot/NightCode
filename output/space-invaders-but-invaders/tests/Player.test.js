import { Player } from '../physics/Player.js';

describe('Player', () => {
    test('should start with full health', () => {
        const mockCanvas = { width: 800, height: 600 };
        const player = new Player(mockCanvas, {});
        expect(player.health).toBe(3);
        expect(player.maxHealth).toBe(3);
    });
});