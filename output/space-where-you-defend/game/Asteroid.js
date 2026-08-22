import { CONFIG } from '../utils/Config.js';

class Asteroid {
  constructor(type, x, y, vx, vy) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.health = CONFIG.asteroidHP[type] || 100;
    this.radius = 20;
  }
  update(delta) {
    this.x += this.vx * delta;
    this.y += this.vy * delta;
  }
  split() {
    if (this.type !== 'blackhole') {
      const newVX = [this.vx + (Math.random() - 0.5) * 100, this.vx - (Math.random() - 0.5) * 100];
      const newVY = [this.vy + (Math.random() - 0.5) * 100, this.vy - (Math.random() - 0.5) * 100];
      const newTypes = ['rock', 'meteor'];
      for (let i = 0; i < newTypes.length; i++) {
        const type = newTypes[i];
        const nx = this.x + (Math.random() - 0.5) * 200;
        const ny = this.y + (Math.random() - 0.5) * 200;
        const nvx = newVX[i];
        const nvy = newVY[i];
        const newAsteroid = new Asteroid(type, nx, ny, nvx, nvy);
        this.asteroids.push(newAsteroid);
      }
      this.health = 0;
    }
  }
}