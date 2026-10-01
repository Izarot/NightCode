export class PhysicsSystem {
  constructor() {
    this.V_MAX = 200;
    this.V_MAX_SPRINT = 300;
    this.DRAG = 0.15;
    this.ACCEL = 400;
    this.BOUNDS = { minX: 16, maxX: 784, minY: 16, maxY: 584 };
  }

  update(avatar, input, dt) {
    const move = input.getMovementVector();
    const sprint = input.isSprinting();
    const maxSpeed = sprint ? this.V_MAX_SPRINT : this.V_MAX;

    // Apply acceleration
    avatar.vx += move.x * this.ACCEL * dt;
    avatar.vy += move.y * this.ACCEL * dt;

    // Apply drag
    avatar.vx *= (1 - this.DRAG * dt);
    avatar.vy *= (1 - this.DRAG * dt);

    // Clamp to max speed
    const speed = Math.sqrt(avatar.vx * avatar.vx + avatar.vy * avatar.vy);
    if (speed > maxSpeed) {
      avatar.vx = (avatar.vx / speed) * maxSpeed;
      avatar.vy = (avatar.vy / speed) * maxSpeed;
    }

    // Update position
    avatar.x += avatar.vx * dt;
    avatar.y += avatar.vy * dt;

    // Clamp to bounds
    avatar.x = Math.max(this.BOUNDS.minX, Math.min(this.BOUNDS.maxX, avatar.x));
    avatar.y = Math.max(this.BOUNDS.minY, Math.min(this.BOUNDS.maxY, avatar.y));

    avatar.update(dt);
  }
}
