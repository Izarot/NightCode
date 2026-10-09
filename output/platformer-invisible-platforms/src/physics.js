export const GRAVITY = 0.25;
export const MAX_SPEED = 5;
export const ACCEL = 0.8;
export const FRICTION_GROUND = 0.85;
export const FRICTION_AIR = 0.95;
export const JUMP_VELOCITY = -10;

export function updatePhysics(entity) {
  if (!entity.onGround) {
    entity.vy += GRAVITY;
  }
  entity.x += entity.vx;
  entity.y += entity.vy;
  entity.onGround = false;
}

export function resolveCollisions(entity, level) {
  const tileSize = 32;
  const grid = level.tiles;
  const cols = level.cols;
  const rows = level.rows;

  let startX = Math.floor(entity.x / tileSize);
  let endX = Math.floor((entity.x + entity.width) / tileSize);
  let startY = Math.floor(entity.y / tileSize);
  let endY = Math.floor((entity.y + entity.height) / tileSize);

  for (let ty = startY; ty <= endY; ty++) {
    for (let tx = startX; tx <= endX; tx++) {
      if (tx < 0 || ty < 0 || tx >= cols || ty >= rows) continue;
      const idx = ty * cols + tx;
      const tile = grid[idx];
      if (tile === 1 || tile === 2) {
        const platX = tx * tileSize;
        const platY = ty * tileSize;
        const closestX = Math.max(platX, Math.min(entity.x + entity.width / 2, platX + tileSize));
        const closestY = Math.max(platY, Math.min(entity.y + entity.height / 2, platY + tileSize));
        const dx = (entity.x + entity.width / 2) - closestX;
        const dy = (entity.y + entity.height / 2) - closestY;
        if (dx * dx + dy * dy < (entity.width / 2) * (entity.width / 2)) {
          if (Math.abs(dx) > Math.abs(dy)) {
            entity.vx = 0;
          } else {
            if (dy > 0) {
              entity.onGround = true;
              entity.vy = 0;
              entity.y = platY - entity.height;
            } else {
              entity.vy = 0;
              entity.y = platY + tileSize;
            }
          }
        }
      }
    }
  }
}
