import { CONFIG } from '../utils/Config.js';

class Physics {
  static moveStation(station, keys, delta) {
    let vx = 0, vy = 0;
    if (keys['ArrowUp'] || keys['w']) vy -= 1;
    if (keys['ArrowDown'] || keys['s']) vy += 1;
    if (keys['ArrowLeft'] || keys['a']) vx -= 1;
    if (keys['ArrowRight'] || keys['d']) vx += 1;
    const accel = CONFIG.accel * delta;
    if (vx !== 0 || vy !== 0) {
      station.vx += vx * accel;
      station.vy += vy * accel;
    } else {
      station.vx *= 0.9;
      station.vy *= 0.9;
    }
    const speed = Math.hypot(station.vx, station.vy);
    if (speed > CONFIG.maxSpeed) {
      const factor = CONFIG.maxSpeed / speed;
      station.vx *= factor;
      station.vy *= factor;
    }
    station.x += station.vx * delta;
    station.y += station.vy * delta;
    station.x = Math.max(0, Math.min(CONFIG.width, station.x));
    station.y = Math.max(0, Math.min(CONFIG.height, station.y));
  }
}