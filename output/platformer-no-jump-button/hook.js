export class Hook {
  constructor() {
    this.active = false;
    this.inFlight = false;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.speed = 10;
    this.range = 200;
  }

  shoot(x, y, dir, audio) {
    this.inFlight = true;
    this.active = false;
    this.x = x;
    this.y = y;
    this.targetX = x + dir * this.range;
    this.targetY = y;
    audio.play('hook');
  }

  update(dt, player, level, physics, audio) {
    if (this.inFlight) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.speed) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.inFlight = false;
        this.active = true;
      } else {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
      }
    }
  }

  retract(player, audio, particles) {
    this.active = false;
    this.inFlight = false;
    audio.play('collect');
    particles.burst(player.x + player.width / 2, player.y + player.height / 2, 5);
  }

  render(ctx) {
    if (this.inFlight || this.active) {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(100 + 16, 500 + 24);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
