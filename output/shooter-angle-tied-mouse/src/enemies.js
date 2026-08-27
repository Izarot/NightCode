import { CONFIG, Utils } from './utils.js';

export class Drone {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.health = 3;
    this.radius = 18;
    this.speed = 300;
    this.fireCooldown = 0;
    this.color = CONFIG.COLORS.enemy;
    this.points = 10;
  }

  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.fireCooldown -= dt;
    if (this.fireCooldown <= 0) {
      this.fireCooldown = 0.5;
    }
  }
}

export class Seeker {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.health = 5;
    this.radius = 18;
    this.speed = 250;
    this.fireCooldown = 0;
    this.color = CONFIG.COLORS.enemy2;
    this.points = 20;
  }

  update(dt, player) {
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    this.vx += Math.cos(angle) * 100 * dt;
    this.vy += Math.sin(angle) * 100 * dt;
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.speed) {
      this.vx = (this.vx / speed) * this.speed;
      this.vy = (this.vy / speed) * this.speed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.fireCooldown -= dt;
    if (this.fireCooldown <= 0) {
      this.fireCooldown = 0.2;
    }
  }
}

export class Patroller {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.health = 7;
    this.radius = 18;
    this.speed = 200;
    this.fireCooldown = 0;
    this.color = CONFIG.COLORS.enemy3;
    this.points = 30;
    this.waypoints = [
      { x: Math.random() * CONFIG.CANVAS_WIDTH, y: Math.random() * CONFIG.CANVAS_HEIGHT },
      { x: Math.random() * CONFIG.CANVAS_WIDTH, y: Math.random() * CONFIG.CANVAS_HEIGHT }
    ];
    this.targetIdx = 0;
  }

  update(dt, player) {
    const target = this.waypoints[this.targetIdx];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 10) {
      this.targetIdx = (this.targetIdx + 1) % this.waypoints.length;
    } else if (dist > 0) {
      this.vx = (dx / dist) * this.speed;
      this.vy = (dy / dist) * this.speed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.fireCooldown -= dt;
    if (this.fireCooldown <= 0) {
      this.fireCooldown = 1.0;
    }
  }
}
