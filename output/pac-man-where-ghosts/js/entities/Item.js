export class Item {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'ghost_charm', 'speed_boost', 'shield'
    this.collected = false;
  }
}
