export class Physics {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    
    // Paddle properties
    this.paddle = {
      x: 0,
      y: height / 2,
      width: 20,
      height: 100,
      velocityY: 0,
      restY: height / 2,
      targetY: height / 2,
      color: '#00BFFF',
      springConstant: 12,
      dampingFactor: 0.08
    };
    
    // Ball properties
    this.ball = {
      x: 0,
      y: 0,
      radius: 10,
      velocityX: 0,
      velocityY: 0,
      speed: 400, // base horizontal speed
      launched: false,
      trail: [],
      maxTrail: 12,
      color: '#FFD700',
      glowColor: '#FFA500'
    };
    
    this.reset();
  }

  reset() {
    this.paddle.y = this.height / 2;
    this.paddle.velocityY = 0;
    this.paddle.restY = this.height / 2;
    this.paddle.targetY = this.height / 2;
    this.ball.x = this.paddle.width + this.ball.radius;
    this.ball.y = this.paddle.y;
    this.ball.velocityX = 0;
    this.ball.velocityY = 0;
    this.ball.launched = false;
    this.ball.trail = [];
  }

  setPaddleTarget(y) {
    this.paddle.targetY = Math.max(this.paddle.height / 2, Math.min(this.height - this.paddle.height / 2, y));
  }

  movePaddleTarget(direction) {
    const speed = 300; // pixels per second for target movement
    this.paddle.targetY += direction * speed * (1/60); // approximate per frame
    this.paddle.targetY = Math.max(this.paddle.height / 2, Math.min(this.height - this.paddle.height / 2, this.paddle.targetY));
  }

  launchBall() {
    if (!this.ball.launched) {
      this.ball.launched = true;
      this.ball.velocityX = this.ball.speed;
      this.ball.velocityY = (Math.random() - 0.5) * 200;
    }
  }

  update(dt) {
    // Spring paddle physics
    const displacement = this.paddle.targetY - this.paddle.y;
    const springForce = this.paddle.springConstant * displacement;
    const dampingForce = -this.paddle.dampingFactor * this.paddle.velocityY;
    const acceleration = springForce + dampingForce;
    this.paddle.velocityY += acceleration * dt;
    this.paddle.y += this.paddle.velocityY * dt;
    
    // Clamp paddle to screen
    const halfH = this.paddle.height / 2;
    if (this.paddle.y < halfH) {
      this.paddle.y = halfH;
      this.paddle.velocityY *= -0.5;
    } else if (this.paddle.y > this.height - halfH) {
      this.paddle.y = this.height - halfH;
      this.paddle.velocityY *= -0.5;
    }

    // Ball physics
    if (this.ball.launched) {
      // Store trail
      this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
      if (this.ball.trail.length > this.ball.maxTrail) this.ball.trail.shift();

      this.ball.x += this.ball.velocityX * dt;
      this.ball.y += this.ball.velocityY * dt;

      // Top/bottom walls
      if (this.ball.y - this.ball.radius < 0) {
        this.ball.y = this.ball.radius;
        this.ball.velocityY = Math.abs(this.ball.velocityY);
      } else if (this.ball.y + this.ball.radius > this.height) {
        this.ball.y = this.height - this.ball.radius;
        this.ball.velocityY = -Math.abs(this.ball.velocityY);
      }

      // Right wall (bounce back)
      if (this.ball.x + this.ball.radius > this.width) {
        this.ball.x = this.width - this.ball.radius;
        this.ball.velocityX = -Math.abs(this.ball.velocityX);
      }

      // Left wall (paddle side) - if ball goes past paddle, it's a life loss (handled in gameManager)
      // Paddle collision
      if (this.ball.x - this.ball.radius < this.paddle.width &&
          this.ball.y > this.paddle.y - halfH &&
          this.ball.y < this.paddle.y + halfH &&
          this.ball.velocityX < 0) {
        this.ball.x = this.paddle.width + this.ball.radius;
        this.ball.velocityX = Math.abs(this.ball.velocityX);
        // Adjust vertical velocity based on hit position
        const hitPos = (this.ball.y - this.paddle.y) / halfH; // -1 to 1
        this.ball.velocityY += hitPos * 300;
        // Add paddle velocity
        this.ball.velocityY += this.paddle.velocityY * 0.5;
        // Limit vertical speed
        const maxV = this.ball.speed * 1.5;
        this.ball.velocityY = Math.max(-maxV, Math.min(maxV, this.ball.velocityY));
        return 'paddleHit';
      }
    } else {
      // Ball follows paddle before launch
      this.ball.x = this.paddle.width + this.ball.radius;
      this.ball.y = this.paddle.y;
    }
    return null;
  }

  checkBrickCollision(brick) {
    if (!this.ball.launched) return false;
    const ball = this.ball;
    const halfW = brick.width / 2;
    const halfH = brick.height / 2;
    const bx = brick.x + halfW;
    const by = brick.y + halfH;
    
    // AABB vs Circle
    const dx = Math.abs(ball.x - bx);
    const dy = Math.abs(ball.y - by);
    if (dx > halfW + ball.radius || dy > halfH + ball.radius) return false;
    
    // Determine collision side
    const overlapX = halfW + ball.radius - dx;
    const overlapY = halfH + ball.radius - dy;
    
    if (overlapX < overlapY) {
      // Horizontal collision
      if (ball.x < bx) ball.x = bx - halfW - ball.radius;
      else ball.x = bx + halfW + ball.radius;
      ball.velocityX = -ball.velocityX;
    } else {
      // Vertical collision
      if (ball.y < by) ball.y = by - halfH - ball.radius;
      else ball.y = by + halfH + ball.radius;
      ball.velocityY = -ball.velocityY;
    }
    // Slight speed loss
    ball.velocityX *= 0.99;
    ball.velocityY *= 0.99;
    return true;
  }
}