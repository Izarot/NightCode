class PaperPlane {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vx = 2; this.vy = 0;
    this.angle = 0;
    this.wingAngle = 0;
    this.flap = 0;
    this.alive = true;
    this.landed = false;
    this.stalled = false;
    this.trail = [];
  }
  update(dt, input) {
    if (!this.alive || this.landed) return;
    const g = 0.8;
    // Pitch controls
    if (input.left) this.angle -= 3 * dt;
    if (input.right) this.angle += 3 * dt;
    this.angle = Math.max(-60, Math.min(60, this.angle));
    // Thrust
    let thrust = 0;
    if (input.up) thrust = 0.4;
    if (input.down) thrust = -0.3;
    if (input.flap) { thrust += 0.6; this.flap = Math.min(1, this.flap + 0.2*dt); }
    else this.flap *= 0.9;
    // Dive
    if (input.dive) { this.angle += 2*dt; thrust += 0.3; }
    // Velocity along facing
    const rad = this.angle * Math.PI/180;
    this.vx += Math.cos(rad) * thrust * dt;
    this.vy += Math.sin(rad) * thrust * dt;
    // Gravity
    this.vy += g * dt;
    // Lift from angle of attack (angle relative to velocity)
    const speed = Math.hypot(this.vx, this.vy);
    let aoa = this.angle;
    if (speed > 0.1) {
      const vAng = Math.atan2(this.vy, this.vx) * 180/Math.PI;
      aoa = this.angle - vAng;
    }
    this.stalled = Math.abs(aoa) > 25;
    const lift = this.stalled ? 0 : Math.sin(aoa * Math.PI/180) * speed * 0.05;
    this.vy -= lift * dt * 60;
    // Drag
    this.vx *= 0.995;
    this.vy *= 0.995;
    // Speed cap
    if (speed > 120) { this.vx *= 120/speed; this.vy *= 120/speed; }
    // Move
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // Trail
    this.trail.push({x:this.x, y:this.y});
    if (this.trail.length > 40) this.trail.shift();
  }
  draw(ctx) {
    // Trail
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2; ctx.beginPath();
    for (let i=0;i<this.trail.length;i++) { const p=this.trail[i]; if(i===0)ctx.moveTo(p.x,p.y); else ctx.lineTo(p.x,p.y); }
    ctx.stroke();
    // Plane
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle * Math.PI/180);
    const flapOff = Math.sin(Date.now()/60) * this.flap * 8;
    // Body
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ff3b6b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 0); ctx.lineTo(-12, -10+flapOff); ctx.lineTo(-6, 0); ctx.lineTo(-12, 10-flapOff); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Accent
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(-6,0); ctx.lineTo(-12,3); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  bounds() { return {x:this.x-12, y:this.y-10, w:24, h:20}; }
}
