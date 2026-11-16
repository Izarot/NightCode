export const GRAVITY = 2400;
export const MAX_FALL = 980;
export const RUN_MAX = 265;
export const ACCEL_GROUND = 2600;
export const DECEL_GROUND = 3200;
export const ACCEL_AIR = 1700;
export const DECEL_AIR = 400;
export const JUMP_VEL = -720;
export const FALL_MULT = 1.35;
export const LOW_JUMP_MULT = 1.8;
export const COYOTE = 0.09;
export const JUMP_BUFFER = 0.12;
export const JUMP_CUT_MULT = 0.45;
export const WALL_SLIDE_CAP = 130;
export const WALL_JUMP_VX = 280;
export const WALL_JUMP_VY = -700;
export const WALL_STICK = 0.12;
export const CONVEYOR_FORCE = 80;
export const TILE_SIZE = 32;
export const PLAYER_W = 20;
export const PLAYER_H = 28;
let lastTime = 0;
export function update(dt: number) {
  // fixed-step integration goes here; omitted for brevity
}