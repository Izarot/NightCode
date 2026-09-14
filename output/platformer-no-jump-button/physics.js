export class Physics {
  resolveCollision(entity, level) {
    const tiles = level.tiles;
    const tw = level.tileSize;
    const th = level.tileSize;
    const grid = level.grid;
    const left = Math.floor(entity.x / tw);
    const right = Math.floor((entity.x + entity.width) / tw);
    const top = Math.floor(entity.y / th);
    const bottom = Math.floor((entity.y + entity.height) / th);
    entity.onGround = false;
    entity.wallLeft = false;
    entity.wallRight = false;
    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        if (tx < 0 || ty < 0 || tx >= grid[0].length || ty >= grid.length) continue;
        if (grid[ty][tx] === 1) {
          const tile = { x: tx * tw, y: ty * th, w: tw, h: th };
          const pen = this.getPenetration(entity, tile);
          if (pen) {
            entity.x += pen.x;
            entity.y += pen.y;
            if (pen.normal === 'bottom') entity.onGround = true;
            if (pen.normal === 'left') entity.wallLeft = true;
            if (pen.normal === 'right') entity.wallRight = true;
          }
        }
      }
    }
  }

  getPenetration(a, b) {
    const dx = (a.x + a.width / 2) - (b.x + b.w / 2);
    const dy = (a.y + a.height / 2) - (b.y + b.h / 2);
    const px = (a.width + b.w) / 2 - Math.abs(dx);
    const py = (a.height + b.h) / 2 - Math.abs(dy);
    if (px > 0 && py > 0) {
      if (px < py) {
        return { x: px * Math.sign(dx), y: 0, normal: dx > 0 ? 'right' : 'left' };
      } else {
        return { x: 0, y: py * Math.sign(dy), normal: dy > 0 ? 'bottom' : 'top' };
      }
    }
    return null;
  }
}
