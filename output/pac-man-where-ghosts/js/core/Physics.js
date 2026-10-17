export class Physics {
  constructor() {
    this.player = { x: 100, y: 100, vx: 0, vy: 0, maxSpeed: 5 * 60, accel: 30, decel: 20 };
    this.turnDelay = 0.15;
    this.turnTimer = 0;
  }

  update(dt) {
    this.turnTimer -= dt;
  }

  applyMovement(input, maze) {
    const dir = input.getDirection();
    if (dir.dx !== 0 || dir.dy !== 0) {
      if (this.turnTimer <= 0) {
        this.player.vx += dir.dx * this.player.accel * dt;
        this.player.vy += dir.dy * this.player.accel * dt;
        this.turnTimer = this.turnDelay;
      }
    } else {
      this.player.vx *= (1 - this.player.decel * dt);
      this.player.vy *= (1 - this.player.decel * dt);
    }
    const speed = Math.hypot(this.player.vx, this.player.vy);
    if (speed > this.player.maxSpeed) {
      this.player.vx = (this.player.vx / speed) * this.player.maxSpeed;
      this.player.vy = (this.player.vy / speed) * this.player.maxSpeed;
    }
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;
    // Collision with walls (stub)
    if (maze && maze.collides(this.player.x, this.player.y)) {
      this.player.vx = 0; this.player.vy = 0;
    }
  }
}
