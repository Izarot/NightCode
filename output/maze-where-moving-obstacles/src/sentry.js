const VIEW_ANGLE = Math.PI / 3;
const VIEW_DISTANCE = 250;

export class Sentry {
  constructor(data) {
    this.path = data.path;
    this.currentNodeIndex = 0;
    this.pos = { x: data.path[0].x, y: data.path[0].y };
    this.facing = { x: 1, y: 0 };
    this.targetFacing = { x: 1, y: 0 };
    this.speed = data.speed || 90;
    this.viewAngle = (data.viewAngle || 60) * Math.PI / 180;
    this.viewDistance = data.viewDistance || VIEW_DISTANCE;
    this.pauseTimer = 0;
    this.color = '#ff3864';
    this.coneAlpha = 0.4;
  }

  update(dt) {
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      return;
    }
    const target = this.path[this.currentNodeIndex];
    const dx = target.x - this.pos.x;
    const dy = target.y - this.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) {
      this.pauseTimer = target.pause || 0;
      this.currentNodeIndex = (this.currentNodeIndex + 1) % this.path.length;
      return;
    }
    const nx = dx / dist;
    const ny = dy / dist;
    this.pos.x += nx * this.speed * dt;
    this.pos.y += ny * this.speed * dt;
    this.targetFacing.x = nx;
    this.targetFacing.y = ny;
    this.facing = this.lerpFacing(this.facing, this.targetFacing, dt * 3);
  }

  lerpFacing(a, b, t) {
    let x = a.x + (b.x - a.x) * Math.min(1, t);
    let y = a.y + (b.y - a.y) * Math.min(1, t);
    const l = Math.hypot(x, y);
    if (l > 0) { x /= l; y /= l; }
    return { x, y };
  }

  detects(player) {
    const dx = player.pos.x - this.pos.x;
    const dy = player.pos.y - this.pos.y;
    const dist = Math.hypot(dx, dy);
    if (dist > this.viewDistance + player.radius) return false;
    const nx = dx / (dist || 1);
    const ny = dy / (dist || 1);
    const dot = nx * this.facing.x + ny * this.facing.y;
    const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
    if (angle > this.viewAngle / 2) return false;
    if (dist < player.radius + 8) return true;
    return true;
  }

  render(ctx) {
    ctx.save();
    const grad = ctx.createRadialGradient(this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, this.viewDistance);
    grad.addColorStop(0, 'rgba(255, 56, 100, 0.45)');
    grad.addColorStop(0.6, 'rgba(255, 56, 100, 0.18)');
    grad.addColorStop(1, 'rgba(255, 56, 100, 0)');
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    const a1 = Math.atan2(this.facing.y, this.facing.x) - this.viewAngle / 2;
    const a2 = Math.atan2(this.facing.y, this.facing.x) + this.viewAngle / 2;
    ctx.arc(this.pos.x, this.pos.y, this.viewDistance, a1, a2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 56, 100, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    ctx.lineTo(this.pos.x + this.facing.x * 16, this.pos.y + this.facing.y * 16);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}
