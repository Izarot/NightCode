export class Pathfinder {
  static astar(grid, start, goal) {
    // Minimal A* implementation
    const cols = grid[0].length;
    const rows = grid.length;
    const open = [];
    const closed = Array.from({ length: rows }, () => Array(cols).fill(false));
    const gScore = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
    const cameFrom = Array.from({ length: rows }, () => Array(cols).fill(null));
    gScore[start.y][start.x] = 0;
    open.push({ ...start, f: 0 });
    while (open.length > 0) {
      open.sort((a, b) => a.f - b.f);
      const current = open.shift();
      if (current.x === goal.x && current.y === goal.y) {
        const path = [];
        let c = current;
        while (c) {
          path.unshift(c);
          c = cameFrom[c.y][c.x];
        }
        return path;
      }
      closed[current.y][current.x] = true;
      const neighbors = [
        { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }
      ];
      for (const n of neighbors) {
        const nx = current.x + n.x;
        const ny = current.y + n.y;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        if (grid[ny][nx] === 1 || closed[ny][nx]) continue;
        const tentative = gScore[current.y][current.x] + 1;
        if (tentative < gScore[ny][nx]) {
          cameFrom[ny][nx] = current;
          gScore[ny][nx] = tentative;
          const f = tentative + Math.abs(goal.x - nx) + Math.abs(goal.y - ny);
          open.push({ x: nx, y: ny, f });
        }
      }
    }
    return [];
  }
}
