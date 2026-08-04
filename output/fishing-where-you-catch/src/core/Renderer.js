export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }
  clear(ctx) {
    ctx.clearRect(0, 0, 1280, 720);
  }
  drawBackground(ctx) {
    ctx.fillStyle = '#0a2a4d';
    ctx.fillRect(0, 0, 1280, 720);
  }
  drawParallax(ctx, shipX, shipY) {
    ctx.fillStyle = '#005588';
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc((i * 37 + shipX * 0.2) % 1280, (i * 53 + shipY * 0.1) % 720, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
