import { CONFIG } from '../config.js';

export class SlimeGrid {
  constructor() {
    this.grid = new Map(); // key: "x,y" -> { state, age, createdAt }
    this.tileCount = 0;
  }

  getKey(x, y) {
    return `${x},${y}`;
  }

  set(x, y, state) {
    const key = this.getKey(x, y);
    const now = performance.now();
    
    if (!this.grid.has(key)) {
      this.tileCount++;
      // Enforce max tiles by removing oldest stale
      if (this.tileCount > CONFIG.MAX_SLIME_TILES) {
        this.removeOldestStale();
      }
    }

    this.grid.set(key, {
      state,
      age: 0,
      createdAt: now
    });
  }

  get(x, y) {
    return this.grid.get(this.getKey(x, y));
  }

  has(x, y) {
    return this.grid.has(this.getKey(x, y));
  }

  update(deltaTime, renderer) {
    const now = performance.now();
    for (const [key, tile] of this.grid.entries()) {
      tile.age = now - tile.createdAt;

      if (tile.state === 'fresh' && tile.age >= CONFIG.SLIME_FADE_MS) {
        tile.state = 'stale';
        tile.createdAt = now;
        tile.age = 0;
        // Trigger evaporation particles
        const [x, y] = key.split(',').map(Number);
        const cellSize = renderer.canvas.width / CONFIG.GRID_SIZE;
        renderer.addEvaporationParticles(
          (x + 0.5) * cellSize,
          (y + 0.5) * cellSize
        );
      } else if (tile.state === 'stale' && tile.age >= CONFIG.SLIME_STALE_MS) {
        this.grid.delete(key);
        this.tileCount--;
      }
    }
  }

  removeOldestStale() {
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [key, tile] of this.grid.entries()) {
      if (tile.state === 'stale' && tile.createdAt < oldestTime) {
        oldestTime = tile.createdAt;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      this.grid.delete(oldestKey);
      this.tileCount--;
    } else {
      // Fallback: remove any oldest
      const firstKey = this.grid.keys().next().value;
      if (firstKey) {
        this.grid.delete(firstKey);
        this.tileCount--;
      }
    }
  }

  clear() {
    this.grid.clear();
    this.tileCount = 0;
  }

  forEach(callback) {
    for (const [key, tile] of this.grid.entries()) {
      const [x, y] = key.split(',').map(Number);
      callback(tile, x, y);
    }
  }

  getFreshCount() {
    let count = 0;
    for (const tile of this.grid.values()) {
      if (tile.state === 'fresh') count++;
    }
    return count;
  }

  getStaleCount() {
    let count = 0;
    for (const tile of this.grid.values()) {
      if (tile.state === 'stale') count++;
    }
    return count;
  }
}