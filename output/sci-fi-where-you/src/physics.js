// Physics module for NEXUS INFILTRATOR
export function initPhysics() {
  const config = {
    maxSpeedX: 240,
    maxSpeedY: 320,
    jumpVelocity: -480,
    gravity: 1200,
    airControl: 0.7,
    wallSlideSpeed: 80,
    wallJumpX: 320,
    wallJumpY: -400,
    dashSpeed: 600,
    dashCooldown: 0.8,
    dashDuration: 0.2,
    phaseDuration: 3,
    phaseCooldown: 15
  };

  return {
    config,
    applyGravity: (entity, delta) => {
      if (!entity.onGround) {
        entity.velY += config.gravity * delta;
      }
    },
    accelerate: (entity, direction, delta) => {
      const targetVel = config.maxSpeedX * direction;
      const accel = targetVel - entity.velX;
      entity.velX += accel * delta * 10;
    },
    decelerate: (entity, delta) => {
      const decel = entity.velX * 0.85;
      entity.velX = decel;
    },
    jump: (entity) => {
      if (entity.canJump) {
        entity.velY = config.jumpVelocity;
        entity.onGround = false;
        entity.canJump = false;
        return true;
      }
      return false;
    },
    wallSlide: (entity) => {
      if (entity.touchingWall && !entity.onGround) {
        entity.velY = Math.min(entity.velY, config.wallSlideSpeed);
        entity.wallSliding = true;
      }
    },
    wallJump: (entity, direction) => {
      if (entity.wallSliding) {
        entity.velX = config.wallJumpX * direction;
        entity.velY = config.wallJumpY;
        entity.wallSliding = false;
        return true;
      }
      return false;
    },
    dash: (entity, direction) => {
      if (entity.dashReady) {
        entity.dashing = true;
        entity.dashDirection = direction;
        entity.dashTimer = config.dashDuration;
        entity.dashReady = false;
        entity.dashCooldownTimer = config.dashCooldown;
        return true;
      }
      return false;
    },
    update: (delta, state) => {
      if (state.player) {
        const p = state.player;
        if (p.dashCooldownTimer > 0) {
          p.dashCooldownTimer -= delta;
          if (p.dashCooldownTimer <= 0) {
            p.dashReady = true;
          }
        }
        if (p.dashing) {
          p.dashTimer -= delta;
          if (p.dashTimer <= 0) {
            p.dashing = false;
          }
        }
      }
    }
  };
}
