class Render {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const aspectRatio = CONFIG.canvasWidth / CONFIG.canvasHeight;

    let newWidth, newHeight;
    if (containerWidth / containerHeight > aspectRatio) {
      newHeight = containerHeight;
      newWidth = newHeight * aspectRatio;
    } else {
      newWidth = containerWidth;
      newHeight = newWidth / aspectRatio;
    }

    this.canvas.width = CONFIG.canvasWidth;
    this.canvas.height = CONFIG.canvasHeight;
    this.canvas.style.width = newWidth + 'px';
    this.canvas.style.height = newHeight + 'px';
  }

  clear() {
    this.ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
  }

  drawBackground() {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.canvasHeight);
    gradient.addColorStop(0, CONFIG.colors.skyTop);
    gradient.addColorStop(1, CONFIG.colors.skyBottom);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    // Draw clouds
    this.ctx.fillStyle = CONFIG.colors.cloud;
    this.drawCloud(50, 80);
    this.drawCloud(200, 60);
    this.drawCloud(320, 100);
  }

  drawCloud(x, y) {
    this.ctx.beginPath();
    this.ctx.arc(x, y, 20, 0, Math.PI * 2);
    this.ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
    this.ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
    this.ctx.fill();
  }

  drawGround() {
    this.ctx.fillStyle = CONFIG.colors.ground;
    this.ctx.fillRect(0, CONFIG.groundY, CONFIG.canvasWidth, CONFIG.canvasHeight - CONFIG.groundY);
  }

  drawPipes() {
    for (const pipe of physics.pipes) {
      // Top pipe
      this.ctx.fillStyle = CONFIG.colors.pipeBody;
      this.ctx.strokeStyle = CONFIG.colors.pipeBorder;
      this.ctx.lineWidth = 2;
      this.ctx.fillRect(pipe.x, 0, CONFIG.pipeWidth, pipe.gapY - CONFIG.pipeGap / 2);
      this.ctx.strokeRect(pipe.x, 0, CONFIG.pipeWidth, pipe.gapY - CONFIG.pipeGap / 2);

      // Bottom pipe
      const bottomY = pipe.gapY + CONFIG.pipeGap / 2;
      this.ctx.fillRect(pipe.x, bottomY, CONFIG.pipeWidth, CONFIG.groundY - bottomY);
      this.ctx.strokeRect(pipe.x, bottomY, CONFIG.pipeWidth, CONFIG.groundY - bottomY);
    }
  }

  drawBird() {
    const bird = physics.bird;
    const rotation = bird.vy * 0.02;

    this.ctx.save();
    this.ctx.translate(bird.x, bird.y);
    this.ctx.rotate(rotation);

    // Body
    this.ctx.fillStyle = CONFIG.colors.birdBody;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Eye
    this.ctx.fillStyle = CONFIG.colors.birdEye;
    this.ctx.beginPath();
    this.ctx.arc(-5, -3, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Beak
    this.ctx.fillStyle = CONFIG.colors.birdBeak;
    this.ctx.beginPath();
    this.ctx.moveTo(5, 0);
    this.ctx.lineTo(15, -3);
    this.ctx.lineTo(15, 3);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  drawParticles() {
    for (const p of physics.particles) {
      this.ctx.fillStyle = CONFIG.colors.birdBody;
      this.ctx.globalAlpha = p.life;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    }
  }

  drawHUD() {
    // Score
    this.ctx.fillStyle = CONFIG.colors.hudBg;
    this.ctx.fillRect(10, 10, 120, 80);

    this.ctx.fillStyle = CONFIG.colors.scoreText;
    this.ctx.font = '48px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(physics.score, 20, 60);

    this.ctx.fillStyle = CONFIG.colors.highScoreText;
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Best: ' + physics.highScore, 20, 85);

    // Timer
    this.ctx.fillStyle = CONFIG.colors.highScoreText;
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Time: ' + physics.elapsedTime.toFixed(2) + 's', 20, 110);
  }

  drawStartScreen() {
    this.ctx.fillStyle = CONFIG.colors.hudBg;
    this.ctx.fillRect(50, 150, 300, 300);

    this.ctx.fillStyle = CONFIG.colors.scoreText;
    this.ctx.font = '36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Flappy Bird Inverted', 200, 220);

    this.ctx.fillStyle = CONFIG.colors.highScoreText;
    this.ctx.font = '20px Arial';
    this.ctx.fillText('Tap/Drag Downward to Jump', 200, 270);
    this.ctx.fillText('Press SPACE to Start', 200, 310);
  }

  drawGameOverScreen() {
    this.ctx.fillStyle = CONFIG.colors.hudBg;
    this.ctx.fillRect(50, 150, 300, 300);

    this.ctx.fillStyle = CONFIG.colors.scoreText;
    this.ctx.font = '48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Game Over', 200, 220);

    this.ctx.fillStyle = CONFIG.colors.highScoreText;
    this.ctx.font = '24px Arial';
    this.ctx.fillText('Score: ' + physics.score, 200, 270);
    this.ctx.fillText('Best: ' + physics.highScore, 200, 310);
    this.ctx.fillText('Press SPACE to Restart', 200, 350);
  }

  render() {
    this.clear();
    this.drawBackground();
    this.drawGround();
    this.drawPipes();
    this.drawBird();
    this.drawParticles();
    this.drawHUD();

    if (physics.gameState === STATE.IDLE) {
      this.drawStartScreen();
    } else if (physics.gameState === STATE.GAME_OVER) {
      this.drawGameOverScreen();
    }
  }
}

const renderer = new Render();