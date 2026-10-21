export const CONFIG = {
  maxSpeed: 350,
  accel: 2000,
  friction: 1800,
  airControl: 0.85,
  bulletSpeed: 800,
  gridSize: 64,
  weapons: {
    pistol: { damage: 10, fireRate: 200, cool: 0.3, max: 12 },
    smg: { damage: 5, fireRate: 800, cool: 0.075, max: 30 },
    shotgun: { damage: 50, fireRate: 60, cool: 1.0, max: 6 }
  },
  enemies: {
    swarmer: { hp: 3, speed: 100, maxSpeed: 120 },
    shooter: { hp: 5, speed: 60, maxSpeed: 80 },
    heavy: { hp: 15, speed: 30, maxSpeed: 40 }
  }
};
