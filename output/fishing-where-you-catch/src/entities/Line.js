export class Line {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.length = 0;
    this.maxLength = 120;
    this.caught = null;
  }
  update(ship, input, dt) {
    if (!this.active && input.cast) {
      this.active = true;
      this.x = ship.x;
      this.y = ship.y;
      this.targetX = ship.x + Math.cos(ship.angle) * this.maxLength;
      this.targetY = ship.y + Math.sin(ship.angle) * this.maxLength;
      this.length = 0;
    }
    if (this.active) {
      if (this.length < this.maxLength) {
        this.length += 5;
      }
      if (this.caught) {
        // reeling logic
      }
    } else {
      this.reset();
    }
  }
  reset() {
    this.active = false;
    this.caught = null;
    this.length = 0;
  }
  render(ctx) {
    if (!this.active) return;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.targetX, this.targetY);
    ctx.stroke();
  }
}
