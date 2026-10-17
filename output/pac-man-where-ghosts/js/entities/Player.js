export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 10;
    this.frame = 0;
    this.frameTimer = 0;
  }

  update(dt) {
    this.frameTimer += dt;
    if (this.frameTimer >= 0.1) {
      this.frame = (this.frame + 1) % 4;
      this.frameTimer = 0;
    }
  }
}
