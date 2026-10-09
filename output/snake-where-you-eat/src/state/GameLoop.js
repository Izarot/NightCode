export class GameLoop {
  constructor(fsm, grid, snake, apple, particles, ui, audio, ctx, canvas, tileSize) {
    this.fsm = fsm;
    this.grid = grid;
    this.snake = snake;
    this.apple = apple;
    this.particles = particles;
    this.ui = ui;
    this.audio = audio;
    this.ctx = ctx;
    this.canvas = canvas;
    this.tileSize = tileSize;
    this.lastTime = 0;
    this.accumulator = 0;
    this.tickRate = 15;
    this.tickTime = 1000 / this.tickRate;
    this.hungerTimer = 0;
    this.hungerInterval = 4000;
    this.starveTimer = 0;
    this.noEatTimer = 0;
    this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
    this.soundOn = localStorage.getItem('soundOn') !== 'false';
    this.speed = 0;
    this.shakeFrames = 0;
    this.initInput();
  }

  initInput() {
    window.addEventListener('keydown', (e) => {
      if (this.fsm.is('PLAYING')) {
        let dir = null;
        if (e.key === 'ArrowUp' || e.key === 'w') dir = { x: 0, y: -1 };
        else if (e.key === 'ArrowDown' || e.key === 's') dir = { x: 0, y: 1 };
        else if (e.key === 'ArrowLeft' || e.key === 'a') dir = { x: -1, y: 0 };
        else if (e.key === 'ArrowRight' || e.key === 'd') dir = { x: 1, y: 0 };
        if (dir) this.snake.queueInput(dir);
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (this.fsm.is('MENU')) this.startGame();
        else if (this.fsm.is('GAMEOVER')) this.startGame();
        else if (this.fsm.is('PAUSED')) this.fsm.set('PLAYING');
      } else if (e.key === 'Escape') {
        if (this.fsm.is('PLAYING')) this.fsm.set('PAUSED');
        else if (this.fsm.is('PAUSED')) this.fsm.set('PLAYING');
      }
    });

    let touchStart = null;
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.fsm.is('PLAYING')) {
        const t = e.touches[0];
        touchStart = { x: t.clientX, y: t.clientY };
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (!touchStart || !this.fsm.is('PLAYING')) return;
      const touchEnd = e.changedTouches[0];
      const dx = touchEnd.clientX - touchStart.x;
      const dy = touchEnd.clientY - touchStart.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      let dir = null;
      if (Math.max(absDx, absDy) > 30) {
        if (absDx > absDy) {
          dir = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
        } else {
          dir = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
        }
        if (dir) this.snake.queueInput(dir);
      }
      touchStart = null;
    }, { passive: false });
  }

  startGame() {
    this.snake.reset();
    this.apple.reset();
    this.particles.clear();
    this.fsm.set('PLAYING');
    this.snake.score = 0;
    this.snake.hunger = 10;
    this.snake.hp = 100;
    this.snake.length = 1;
    this.hungerTimer = 0;
    this.noEatTimer = 0;
    this.tickRate = 15;
    this.tickTime = 1000 / this.tickRate;
    this.shakeFrames = 0;
  }

  start() {
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(timestamp) {
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.accumulator += dt;

    if (this.fsm.is('PLAYING')) {
      while (this.accumulator >= this.tickTime) {
        this.update();
        this.accumulator -= this.tickTime;
      }
      this.hungerTimer += dt;
      this.noEatTimer += dt;
    } else if (this.fsm.is('MENU') || this.fsm.is('GAMEOVER') || this.fsm.is('PAUSED')) {
      this.accumulator = 0;
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update() {
    this.snake.move();

    if (this.snake.checkCollision(this.grid)) {
      this.die();
      return;
    }

    if (this.apple.checkEat(this.snake)) {
      this.snake.grow(this.apple.type);
      this.apple.spawn(this.grid, this.snake);
      this.particles.emit(this.apple.x, this.apple.y, this.apple.type);
      this.noEatTimer = 0;
      if (this.apple.type === 'golden') {
        this.audio.play('goldenEat');
      } else {
        this.audio.play('eat');
      }
      if (this.snake.score > this.highScore) {
        this.highScore = this.snake.score;
        localStorage.setItem('highScore', this.highScore);
      }
    } else {
      this.snake.popTail();
    }

    this.apple.update(this.hungerTimer, this.noEatTimer);

    if (this.hungerTimer >= this.hungerInterval) {
      this.snake.hunger = Math.min(100, this.snake.hunger + 1);
      this.hungerTimer = 0;
      if (this.snake.hunger > 80) {
        this.audio.play('warning');
      }
    }

    if (this.snake.hunger >= 100) {
      this.snake.hp = Math.max(0, this.snake.hp - 1);
      if (this.snake.hp <= 0) {
        this.die();
        return;
      }
    }

    if (this.snake.eatenCount > 0 && this.snake.eatenCount % 5 === 0) {
      this.tickRate = Math.min(25, this.tickRate + 0.5);
      this.tickTime = 1000 / this.tickRate;
      this.snake.eatenCount = 0;
    }

    this.particles.update();
  }

  die() {
    this.fsm.set('GAMEOVER');
    this.shakeFrames = 10;
    this.audio.play('death');
  }

  render() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const ts = this.tileSize;
    const cols = this.grid.cols;
    const rows = this.grid.rows;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = Math.min(canvas.width / (cols * ts), canvas.height / (rows * ts));
    const offsetX = (canvas.width - cols * ts * scale) / 2;
    const offsetY = (canvas.height - rows * ts * scale) / 2;

    ctx.save();
    if (this.shakeFrames > 0) {
      ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
      this.shakeFrames--;
    }

    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1E1E1E';
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + x * ts * scale, offsetY);
      ctx.lineTo(offsetX + x * ts * scale, offsetY + rows * ts * scale);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + y * ts * scale);
      ctx.lineTo(offsetX + cols * ts * scale, offsetY + y * ts * scale);
      ctx.stroke();
    }

    this.grid.draw(ctx, offsetX, offsetY, scale, ts);
    this.apple.draw(ctx, offsetX, offsetY, scale, ts);
    this.snake.draw(ctx, offsetX, offsetY, scale, ts);
    this.particles.draw(ctx, offsetX, offsetY, scale, ts);

    this.ui.draw(this.fsm.state, this.snake, this.apple, this.highScore, this.soundOn, this.hungerTimer, this.noEatTimer);

    ctx.restore();
  }
}
