class Physics {
  constructor() {
    this.bird = { x: 80, y: 150, vx: 0, vy: 0, radius: CONFIG.birdRadius };
    this.pipes = [];
    this.lastPipeTime = 0;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
    this.particles = [];
    this.gameState = STATE.IDLE;
    this.startTime = 0;
    this.elapsedTime = 0;
  }

  reset() {
    this.bird = { x: 80, y: 150, vx: 0, vy: 0, radius: CONFIG.birdRadius };
    this.pipes = [];
    this.lastPipeTime = 0;
    this.score = 0;
    this.particles = [];
    this.gameState = STATE.PLAYING;
    this.startTime = performance.now();
    this.elapsedTime = 0;
  }

  update(deltaTime) {
    if (this.gameState !== STATE.PLAYING) return;

    this.elapsedTime = (performance.now() - this.startTime) / 1000;

    // Apply gravity
    this.bird.vy += CONFIG.gravity;
    this.bird.y += this.bird.vy;

    // Clamp to ground
    if (this.bird.y + this.bird.radius > CONFIG.groundY) {
      this.bird.y = CONFIG.groundY - this.bird.radius;
      this.bird.vy = 0;
    }

    // Spawn pipes
    this.lastPipeTime += deltaTime;
    if (this.lastPipeTime > CONFIG.pipeInterval) {
      this.spawnPipe();
      this.lastPipeTime = 0;
    }

    // Update pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const pipe = this.pipes[i];
      pipe.x -= CONFIG.maxHorizontalSpeed;

      // Score check
      if (!pipe.passed && pipe.x + CONFIG.pipeWidth < this.bird.x) {
        this.score++;
        pipe.passed = true;
        this.createParticles(pipe.x + CONFIG.pipeWidth / 2, pipe.gapY);
        this.updateHighScore();
      }

      // Remove off-screen pipes
      if (pipe.x + CONFIG.pipeWidth < 0) {
        this.pipes.splice(i, 1);
      }
    }

    // Collision detection
    for (const pipe of this.pipes) {
      if (this.checkCollision(this.bird, pipe)) {
        this.gameState = STATE.GAME_OVER;
        this.updateHighScore();
      }
    }

    // Boundary check
    if (this.bird.y - this.bird.radius < 0 || this.bird.y + this.bird.radius > CONFIG.groundY) {
      this.gameState = STATE.GAME_OVER;
      this.updateHighScore();
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= deltaTime / 1000;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  spawnPipe() {
    const gapY = Math.random() * (CONFIG.groundY - 100 - CONFIG.pipeGap) + 50;
    this.pipes.push({
      x: CONFIG.canvasWidth,
      gapY: gapY,
      passed: false
    });
  }

  checkCollision(bird, pipe) {
    const distX = Math.max(pipe.x, Math.min(bird.x, pipe.x + CONFIG.pipeWidth));
    const distY = Math.max(pipe.gapY - CONFIG.pipeGap / 2, Math.min(bird.y, pipe.gapY + CONFIG.pipeGap / 2));
    const dx = bird.x - distX;
    const dy = bird.y - distY;
    return (dx * dx + dy * dy) < (bird.radius * bird.radius);
  }

  createParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1
      });
    }
  }

  updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('highScore', this.highScore);
    }
  }

  jump() {
    if (this.gameState === STATE.PLAYING) {
      this.bird.vy = CONFIG.jumpStrength;
    }
  }
}

const physics = new Physics();