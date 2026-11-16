export type EnemyType = "Prowler" | "Hopper" | "Drifter" | "Lancer" | "Bulwark" | "Wisp";
export interface Enemy {
  type: EnemyType;
  x: number; y: number; vx: number; vy: number;
  mass: number; readonly alive: boolean; readonly dazed: number; readonly reswapLockout: number;
}
export interface Player {
  x: number; y: number; vx: number; vy: number;
  readonly width = 20; readonly height = 28;
  readonly hearts = 3; readonly invuln: number; readonly phase: number;
  readonly swapCooldown: number; readonly chain: number; readonly maxChain: number;
}
let player: Player;
let enemies: Enemy[];
export function initEntities() {
  player = { x: 64, y: 64, vx: 0, vy: 0, invuln: 0, phase: 0, swapCooldown: 0.9, chain: 0, maxChain: 0 };
  enemies = [];
}
export function update(dt: number) {
  // swap logic, collision, etc.
}
export function render(ctx: CanvasRenderingContext2D) {
  // draw player, enemies
}