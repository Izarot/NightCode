export class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.map = new Map();
  }
  insert(entity) {
    const key = this._key(entity.x, entity.y);
    if (!this.map.has(key)) this.map.set(key, []);
    this.map.get(key).push(entity);
  }
  query(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const result = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = this._key(cx + dx, cy + dy);
        if (this.map.has(key)) result.push(...this.map.get(key));
      }
    }
    return result;
  }
  _key(x, y) {
    return `${x},${y}`;
  }
}