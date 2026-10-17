export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  render(levelManager, physics, input) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // Draw maze
    levelManager.maze.draw(ctx);
    // Draw dots
    levelManager.dots.forEach(dot => {
      if (!dot.collected) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // Draw items
    levelManager.items.forEach(item => {
      if (!item.collected) {
        ctx.fillStyle = '#ff6ec7';
        ctx.fillRect(item.x - 8, item.y - 8, 16, 16);
      }
    });
    // Draw goal
    const goal = levelManager.goal;
    ctx.strokeStyle = levelManager.dots.some(d => !d.collected) ? '#555555' : '#00ff00';
    ctx.lineWidth = 4;
    ctx.strokeRect(goal.x - 16, goal.y - 16, 32, 32);
    // Draw player
    const p = physics.player;
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 10, 0.2 * Math.PI, 1.8 * Math.PI);
    ctx.lineTo(p.x, p.y);
    ctx.fill();
    // Draw ghosts
    levelManager.ghosts.forEach(ghost => {
      ctx.fillStyle = ghost.isAlly ? '#00ff00' : ghost.color;
      ctx.beginPath();
      ctx.arc(ghost.x, ghost.y, 10, 0, Math.PI * 2);
      ctx.fill();
      if (ghost.isAlly) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  }
}
