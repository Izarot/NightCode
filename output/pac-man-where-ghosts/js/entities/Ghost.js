export class Ghost {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.state = 'AGGRESSIVE';
    this.isAlly = false;
    this.allyExpiration = 0;
    this.radius = 10;
    this.path = [];
  }

  update(dt, player, goal, maze) {
    if (this.isAlly && performance.now() > this.allyExpiration) {
      this.isAlly = false;
      this.state = 'AGGRESSIVE';
    }
    if (this.isAlly) {
      this.state = 'ALLY';
      // Simple A* path toward goal
      if (this.path.length === 0 || this.path[0].t < dt) {
        this.path = maze.findPath(this.x, this.y, goal.x, goal.y) || [];
      } else {
        const next = this.path[0];
        this.x = next.x;
        this.y = next.y;
        this.path.shift();
      }
    } else {
      // Chase player
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        this.x += (dx / dist) * 60 * dt;
        this.y += (dy / dist) * 60 * dt;
      }
    }
  }
}
