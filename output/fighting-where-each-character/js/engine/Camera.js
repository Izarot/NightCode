export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 1280;
    this.height = 720;
  }
  update(players) {
    const centerX = (players[0].x + players[1].x) / 2;
    this.x = centerX - this.width/2;
  }
}