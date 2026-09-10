export class GameManager {
  constructor(width, height, physics) {
    this.width = width;
    this.height = height;
    this.physics = physics;
    this.bricks = [];
    this.score = 0;
    this.lives = 3;
    this.highScore = parseInt(localStorage.getItem('springPaddleHighScore')) || 0;
    this.timer = 0;
    this.level = 1;
    this.brickColors = [
      '#FF6B6B', '#FF8E53', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6', '#FF69B4'
    ];
  }

  init() {
    this.score = 0;
    this.lives = 3;
    this.timer = 0;
    this.level = 1;
    this.createBricks();
  }

  createBricks() {
    this.bricks = [];
    const rows = 5 + this.level;
    const cols = 10;
    const brickWidth = 60;
    const brickHeight = 24;
    const padding = 8;
    const offsetX = this.physics.paddle.width + 50;
    const offsetY = 50;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = offsetX + col * (brickWidth + padding);
        const y = offsetY + row * (brickHeight + padding);
        const color = this.brickColors[row % this.brickColors.length];
        const hits = row < 2 ? 2 : 1;
        this.bricks.push({
          x, y,
          width: brickWidth,
          height: brickHeight,
          color,
          hits,
          maxHits: hits,
          alive: true
        });
      }
    }
  }

  update(dt, physics) {
    this.timer += dt;
    
    // Ball-brick collisions
    for (let i = this.bricks.length - 1; i >= 0; i--) {
      const brick = this.bricks[i];
      if (!brick.alive) continue;
      
      if (physics.checkBrickCollision(brick)) {
        brick.hits--;
        this.score += 10 * (brick.maxHits - brick.hits + 1);
        
        if (brick.hits <= 0) {
          brick.alive = false;
          this.score += 50;
          physics.ball.velocityX *= 1.02;
          physics.ball.velocityY *= 1.02;
        }
        break; // Only one brick collision per frame
      }
    }
    
    // Check if ball lost (past paddle)
    if (physics.ball.launched && physics.ball.x - physics.ball.radius < 0) {
      this.loseLife();
    }
    
    // Check level complete
    const aliveBricks = this.bricks.filter(b => b.alive).length;
    if (aliveBricks === 0) {
      this.level++;
      this.createBricks();
      physics.reset();
      this.score += 500 * this.level;
    }
  }

  loseLife() {
    this.lives--;
    this.physics.reset();
  }

  updateHighScore(score) {
    if (score > this.highScore) {
      this.highScore = score;
      localStorage.setItem('springPaddleHighScore', score.toString());
    }
    return this.highScore;
  }

  drawBricks(renderer) {
    this.bricks.forEach(brick => {
      if (brick.alive) renderer.drawBrick(brick);
    });
  }
}