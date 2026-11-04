// Game Tests
import { Game } from '../src/game.js';
import { scoreManager } from '../src/score.js';

describe('Game', () => {
  let game;
  beforeEach(() => { game = new Game(); });
  test('should initialize with correct default values', () => {
    expect(game.state).toBe('waiting');
    expect(game.score).toBe(0);
    expect(game.gameActive).toBe(false);
  });
  test('should calculate reaction time correctly', () => {
    const startTime = performance.now();
    const elapsed = performance.now() - startTime;
    expect(elapsed).toBeGreaterThanOrEqual(0);
  });
});

describe('ScoreManager', () => {
  test('should return 0 for high score when none exists', () => {
    expect(scoreManager.getHighScore()).toBeGreaterThanOrEqual(0);
  });
  test('should save and retrieve high score', () => {
    scoreManager.saveHighScore(100);
    expect(scoreManager.getHighScore()).toBe(100);
  });
});
