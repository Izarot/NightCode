export class Physics {
  constructor() {
    this.gravity = 0.6;
    this.friction = 0.85;
    this.walkSpeed = 4.0;
    this.dashSpeed = 9.0;
    this.jumpVel = -14;
  }
  applyGravity(entity, dt) {
    if (!entity.onGround) {
      entity.vy += this.gravity;
    }
    entity.x += entity.vx;
    entity.y += entity.vy;
  }
  applyFriction(entity) {
    if (entity.onGround) {
      entity.vx *= this.friction;
    }
  }
}