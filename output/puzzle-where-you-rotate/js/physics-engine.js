class PhysicsEngine {
  constructor(ball, level){
    this.ball = ball;
    this.level = level;
    this.gravity = new Vector2D(0, GRAVITY);
    this.targetAngle = 0;
    this.currentAngle = 0;
    this.rotating = false;
    this.startTime = 0;
  }
  rotateTo(angle){
    if(this.rotating) return;
    this.targetAngle = angle;
    this.rotating = true;
    this.startTime = performance.now();
  }
  update(dt){
    if(this.rotating){
      const elapsed = performance.now() - this.startTime;
      const t = Math.min(elapsed / ROTATION_TIME, 1);
      const eased = easeInOutCubic(t);
      this.currentAngle = this.targetAngle;
      if(t >= 1) this.rotating = false;
    }
    this.ball.vel.add(this.gravity);
    this.ball.vel.mul(FRICTION);
    const speed = Math.hypot(this.ball.vel.x, this.ball.vel.y);
    if(speed > MAX_SPEED){ const scale = MAX_SPEED / speed; this.ball.vel.mul(scale); }
    this.ball.pos.add(this.ball.vel);
    this.ball.updateTrail();
  }