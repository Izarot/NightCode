import { Grid } from '../core/grid.js';
import { Tile } from '../entities/Tile.js';

export class PlacementSystem {
  constructor(grid) {
    this.grid = grid;
    this.selectedTileType = null;
  }
  setSelected(type) {
    this.selectedTileType = type;
  }
  place(x, y) {
    if (!this.selectedTileType) return false;
    if (!this.grid.isInside(x, y)) return false;
    const existing = this.grid.getCell(x, y);
    if (existing) return false;
    const tile = new Tile(this.selectedTileType, x, y);
    this.grid.setCell(x, y, tile);
    // adjacency bonus example
    this._applyAdjacencyBonuses(tile);
    return true;
  }
  _applyAdjacencyBonuses(tile) {
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx,dy] of dirs) {
      const nx = tile.x + dx, ny = tile.y + dy;
      const neighbor = this.grid.getCell(nx, ny);
      if (neighbor && neighbor.type === 'forest' && tile.type === 'water') {
        tile.yieldPerTurn += 1;
      }
    }
  }
}