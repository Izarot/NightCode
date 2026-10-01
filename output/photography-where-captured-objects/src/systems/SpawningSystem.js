import { PhotoObject } from '../entities/PhotoObject.js';

export class SpawningSystem {
  constructor() {
    this.spawnTimer = 0;
    this.spawnInterval = 2.0;
    this.minInterval = 0.5;
    this.intervalDecrement = 0.1;
    this.level = 1;
    this.types = ['bird', 'car', 'flower'];
    this.points = { bird: 30, car: 50, flower: 20 };
  }

  update(dt, objects, avatar) {
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnObject(objects, avatar);
    }
  }

  spawnObject(objects, avatar) {
    const type = this.types[Math.floor(Math.random() * this.types.length)];
    const points = this.points[type];

    // Spawn at least 80px from avatar
    let x, y;
    do {
      x = 40 + Math.random() * 720;
      y = 40 + Math.random() * 520;
    } while (Math.sqrt((x - avatar.x) ** 2 + (y - avatar.y) ** 2) < 100);

    objects.push(new PhotoObject(x, y, type, points));
  }

  removeCaptured(captured) {
    // Objects are marked captured and fade out; they'll be removed when alpha reaches 0
  }

  increaseDifficulty() {
    this.spawnInterval = Math.max(this.minInterval, this.spawnInterval - this.intervalDecrement);
    this.level++;
  }
}
