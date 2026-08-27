import { CONFIG } from './utils.js';

export class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * CONFIG.BULLET_SPEED;
    this.vy = Math.sin(angle) * CONFIG.BULLET_SPEED;
    this.radius = CONFIG.BULLET_RADIUS;
    this.lifetime = CONFIG.BULLET_LIFETIME;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.lifetime -= dt;
  }
}
