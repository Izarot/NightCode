class CollisionSystem {
  static circleRect(cx, cy, r, rx, ry, rw, rh){
    let dx = cx - Math.max(rx, Math.min(cx, rx + rw));
    let dy = cy - Math.max(ry, Math.min(cy, ry + rh));
    return (dx * dx + dy * dy) < (r * r);
  }
  static resolve(ball, wall, restitution){
    const closestX = Math.max(wall.x, Math.min(ball.pos.x, wall.x + wall.w));
    const closestY = Math.max(wall.y, Math.min(ball.pos.y, wall.y + wall.h));
    const dx = ball.pos.x - closestX;
    const dy = ball.pos.y - closestY;
    if(dx * dx + dy * dy < ball.r * ball.r){
      const dist = Math.hypot(dx, dy);
      const nx = dx / dist, ny = dy / dist;
      ball.pos.x = closestX + nx * ball.r;
      ball.pos.y = closestY + ny * ball.r;
      const dot = ball.vel.x * nx + ball.vel.y * ny;
      ball.vel.x -= (1 + restitution) * dot * nx;
      ball.vel.y -= (1 + restitution) * dot * ny;
    }
  }