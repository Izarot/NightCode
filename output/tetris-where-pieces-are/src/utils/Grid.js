// Grid representation: 20 rows x 10 cols
export const GRID_W = 10;
export const GRID_H = 20;

export function createEmptyGrid() {
  const grid = new Array(GRID_H);
  for (let y = 0; y < GRID_H; y++) {
    grid[y] = new Array(GRID_W);
    for (let x = 0; x < GRID_W; x++) {
      grid[y][x] = null;
    }
  }
  return grid;
}

export function cloneGrid(grid) {
  const out = new Array(GRID_H);
  for (let y = 0; y < GRID_H; y++) {
    out[y] = new Array(GRID_W);
    for (let x = 0; x < GRID_W; x++) {
      out[y][x] = grid[y][x] ? { ...grid[y][x] } : null;
    }
  }
  return out;
}

export function isRowFull(grid, y) {
  for (let x = 0; x < GRID_W; x++) {
    if (!grid[y][x]) return false;
  }
  return true;
}

export function clearRows(grid, rows) {
  const sorted = rows.slice().sort((a, b) => a - b);
  for (const y of sorted) {
    grid.splice(y, 1);
    const newRow = new Array(GRID_W).fill(null);
    grid.unshift(newRow);
  }
}
