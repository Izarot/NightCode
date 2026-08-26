export class Snake {
  constructor(x, y, startLength) {
    this.segments = [];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.growth = 0;

    for (let i = startLength - 1; i >= 0; i--) {
      this.segments.push({ x: x - i * CELL_SIZE, y });
    }
  }

  update(portals) {
    this.direction = { ...this.nextDirection };

    const newHead = {
      x: this.segments[0].x + this.direction.x * CELL_SIZE,
      y: this.segments[0].y + this.direction.y * CELL_SIZE
    };

    for (const portal of portals) {
      const isPortalArea = 
        (this.direction.x === 1 && newHead.x >= portal.x - 5 && Math.abs(newHead.y - portal.y) < 20) ||
        (this.direction.x === -1 && newHead.x <= portal.x + 5 && Math.abs(newHead.y - portal.y) < 20) ||
        (this.direction.y === 1 && newHead.y >= portal.y - 5 && Math.abs(newHead.x - portal.x) < 20) ||
        (this.direction.y === -1 && newHead.y <= portal.y + 5 && Math.abs(newHead.x - portal.x) < 20);

      if (isPortalArea) {
        const paired = this._getPairedPortal(portal);
        newHead.x = paired.x;
        newHead.y = paired.y;
        break;
      }
    }

    this.segments.unshift(newHead);

    if (this.growth > 0) {
      this.growth--;
    } else {
      this.segments.pop();
    }

    return newHead;
  }

  _getPairedPortal(portal) {
    for (const p of this.portals) {
      if (p.id !== portal.id) return p;
    }
    return portal;
  }

  occupies(x, y) {
    return this.segments.some(s => s.x === x && s.y === y);
  }
}