export class Tile {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.isSelected = false;
    this.isOccupied = false;
    this.yieldPerTurn = 0;
    const yields = {
      forest: 5,
      water: 3,
      mountain: 2,
      grass: 1,
    };
    this.yieldPerTurn = yields[type] || 0;
  }
}