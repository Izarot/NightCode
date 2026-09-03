export class Collision {
  resolve(a, b) {
    // Simple AABB push resolution
    const ax = a.x - a.w/2, ay = a.y - a.h;
    const bx = b.x - b.w/2, by = b.y - b.h;
    const aw = a.w, ah = a.h;
    const bw = b.w, bh = b.h;
    if (ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by) {
      const overlapX = Math.min(ax + aw - bx, bx + bw - ax);
      const overlapY = Math.min(ay + ah - by, by + bh - ay);
      if (overlapX < overlapY) {
        if (a.x < b.x) { a.x -= overlapX/2; b.x += overlapX/2; }
        else { a.x += overlapX/2; b.x -= overlapX/2; }
      } else {
        if (a.y < b.y) { a.y -= overlapY/2; b.y += overlapY/2; }
        else { a.y += overlapY/2; b.y -= overlapY/2; }
      }
    }
  }
}