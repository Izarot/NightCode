export class CollisionService {
  checkFood(head, food) {
    return Math.abs(head.x - food.x) < 20 && Math.abs(head.y - food.y) < 20;
  }

  checkSelf(snake) {
    for (let i = 1; i < snake.segments.length; i++) {
      if (snake.segments[0].x === snake.segments[i].x && snake.segments[0].y === snake.segments[i].y) {
        return { type: 'self' };
      }
    }
    return null;
  }

  checkWall(head, width, height) {
    if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) {
      return { type: 'wall' };
    }
    return null;
  }

  checkPortal(head, portals) {
    for (const portal of portals) {
      const distance = Math.hypot(head.x - portal.x, head.y - portal.y);
      if (distance < 40) {
        return { portal, exit: this._getPairedPortal(portal) };
      }
    }
    return null;
  }
}