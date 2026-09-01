import { GRID_W, GRID_H } from './Grid.js';

export function collides(grid, blocks) {
  for (const b of blocks) {
    const x = b.x;
    const y = b.y;
    if (x < 0 || x >= GRID_W || y >= GRID_H) return true;
    if (y < 0) continue; // above the field is allowed for spawn
    if (grid[y][x]) return true;
  }
  return false;
}
