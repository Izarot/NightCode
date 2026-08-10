import { Game } from '../core/Game.js';

describe('Game', () => {
    test('should initialize with correct properties', () => {
        const mockCanvas = { width: 800, height: 600 };
        const game = new Game(mockCanvas, {}, {}, {}, {}, {}, {}, {}, {}, {});
        expect(game.running).toBe(false);
    });
});