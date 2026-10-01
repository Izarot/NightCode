export class Viewfinder {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 120;
    this.angle = 0;
    this.color = 'rgba(255, 255, 255, 0.2)';
    this.borderColor = '#4ecdc4';
  }

  update(avatar, input, dt) {
    this.x = avatar.x;
    this.y = avatar.y;
    this.angle = input.getAimAngle();
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Viewfinder circle
    ctx.strokeStyle = this.borderColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Crosshair
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.lineTo(20, 0);
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 20);
    ctx.stroke();

    ctx.restore();
  }
}
