export class Physics {
  constructor() {
    this.gravity = 0;
  }
  applyForce(entity, fx, fy, dt) {
    entity.vx += fx * dt;
    entity.vy += fy * dt;
  }
  updateEntity(entity, dt) {
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;
    entity.vx *= 0.95;
    entity.vy *= 0.95;
  }
  distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
