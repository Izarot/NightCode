class Ball {
  constructor(x,y,r){
    this.pos = new Vector2D(x,y);
    this.vel = new Vector2D(0,0);
    this.r = r;
    this.trail = [];
  }
  updateTrail(){
    this.trail.push(this.pos.copy());
    if(this.trail.length > TRAIL_LENGTH) this.trail.shift();
  }
  draw(ctx, angle){
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(angle * Math.PI / 180);
    this.trail.forEach((p,i) => {
      const alpha = i / this.trail.length;
      ctx.fillStyle = COLORS.trail;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x - this.pos.x, p.y - this.pos.y, this.r * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.ball;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = COLORS.wallGlow;
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }