const TILE = 40;
const BASE_SPEED = 180;
const SPRINT_SPEED = 350;
const ACCEL_TIME = 0.3;
const STAMINA_MAX = 100;
const SPRINT_DRAIN = 20;
const STAMINA_REGEN = 15;
const LOCK_THRESHOLD = 30;
const HIT_RADIUS = 12;

export class Player {
  constructor(pos) {
    this.pos = { x: pos.x, y: pos.y };
    this.vel = { x: 0, y: 0 };
    this.stamina = STAMINA_MAX;
    this.sprintLocked = false;
    this.dead = false;
    this.radius = HIT_RADIUS;
    this.facing = { x: 1, y: 0 };
    this.detectionTimer = 0;
    this.trail = [];
    this.color = '#00e5ff';
    this.lastCheckpoint = null;
  }

  update(dt, input, level) {
    let dx = 0, dy = 0;
    if (input.isDown('KeyW') || input.isDown('ArrowUp')) dy -= 1;
    if (input.isDown('KeyS') || input.isDown('ArrowDown')) dy += 1;
    if (input.isDown('KeyA') || input.isDown('ArrowLeft')) dx -= 1;
    if (input.isDown('KeyD') || input.isDown('ArrowRight')) dx += 1;

    const len = Math.hypot(dx, dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
      this.facing.x = dx;
      this.facing.y = dy;
    }

    let wantsSprint = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
    if (this.stamina <= 0) this.sprintLocked = true;
    if (this.stamina >= LOCK_THRESHOLD) this.sprintLocked = false;

    let targetSpeed = BASE_SPEED;
    if (wantsSprint && !this.sprintLocked && this.stamina > 0 && len > 0) {
      targetSpeed = SPRINT_SPEED;
      this.stamina -= SPRINT_DRAIN * dt;
      if (this.stamina < 0) this.stamina = 0;
    } else if (len === 0) {
      this.stamina += STAMINA_REGEN * dt;
      if (this.stamina > STAMINA_MAX) this.stamina = STAMINA_MAX;
    }

    const accel = targetSpeed / ACCEL_TIME;
    const targetVx = dx * targetSpeed;
    const targetVy = dy * targetSpeed;
    this.vel.x = this.approach(this.vel.x, targetVx, accel * dt);
    this.vel.y = this.approach(this.vel.y, targetVy, accel * dt);

    let newX = this.pos.x + this.vel.x * dt;
    let newY = this.pos.y + this.vel.y * dt;

    if (!level.collidesAt(newX, this.pos.y, this.radius)) {
      this.pos.x = newX;
    } else {
      this.vel.x = 0;
    }
    if (!level.collidesAt(this.pos.x, newY, this.radius)) {
      this.pos.y = newY;
    } else {
      this.vel.y = 0;
    }

    if (level.isCheckpoint(this.pos)) {
      this.lastCheckpoint = { x: this.pos.x, y: this.pos.y };
    }

    this.trail.push({ x: this.pos.x, y: this.pos.y });
    if (this.trail.length > 8) this.trail.shift();
  }

  approach(current, target, delta) {
    if (current < target) return Math.min(current + delta, target);
    if (current > target) return Math.max(current - delta, target);
    return current;
  }

  takeHit() {
    this.detectionTimer += 1 / 60;
    if (this.detectionTimer >= 0.25) {
      this.dead = true;
    }
  }

  resetDetection() {
    this.detectionTimer = 0;
  }

  respawn() {
    this.dead = false;
    this.detectionTimer = 0;
    if (this.lastCheckpoint) {
      this.pos.x = this.lastCheckpoint.x;
      this.pos.y = this.lastCheckpoint.y;
    } else {
      this.pos.x = this.startPos.x;
      this.pos.y = this.startPos.y;
    }
    this.vel.x = 0;
    this.vel.y = 0;
    this.stamina = STAMINA_MAX;
  }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.25;
    this.trail.forEach((t, i) => {
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.radius * (0.3 + i * 0.1), 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    });
    ctx.restore();

    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.lineTo(this.pos.x + this.facing.x * 18, this.pos.y + this.facing.y * 18);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (this.detectionTimer > 0) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 6 + Math.sin(performance.now() / 60) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 56, 100, ${this.detectionTimer * 4})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.restore();
  }
}
