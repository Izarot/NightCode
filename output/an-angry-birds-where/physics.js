class Physics {
  constructor() {
    this.gravity = 0.5;
    this.wind = 0;
    this.drag = 0.98;
  }
  update(obj) {
    if (obj.launched || obj.falling) {
      obj.vy += this.gravity;
      obj.vx *= this.drag;
      obj.vy *= this.drag;
      obj.vx += this.wind;
      obj.x += obj.vx;
      obj.y += obj.vy;
      obj.rotation += obj.vx * 0.1;
    }
  }
  checkCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
}
const physics = new Physics();