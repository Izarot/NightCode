export class Camera {
  constructor(width, height) {
    this.x = width / 2;
    this.y = height / 2;
    this.width = width;
    this.height = height;
  }

  follow(targetX, targetY, level) {
    const tileSize = 32;
    const levelWidth = level.cols * tileSize;
    const levelHeight = level.rows * tileSize;
    this.x += (targetX - this.x) * 0.1;
    this.y += (targetY - this.y) * 0.1;
    this.x = Math.max(this.width / 2, Math.min(this.x, levelWidth - this.width / 2));
    this.y = Math.max(this.height / 2, Math.min(this.y, levelHeight - this.height / 2));
  }
}
