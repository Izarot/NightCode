export const gameService = {
  canvas: null,
  ctx: null,
  paddle: { width: 100, height: 20, x: 0, y: 0, speed: 8 },
  objects: [],
  objectRadius: 20,
  objectSpeed: 3,
  spawnInterval: 800,
  lastSpawn: 0,
  score: 0,
  highScore: 0,
  startTime: 0,
  elapsedTime: 0,
  animationFrameId: null,
  isGameOver: false,
  catchSound: null,
  missSound: null,
  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
    this.loadHighScore();
    this.createSounds();
    this.start();
  },
  resizeCanvas() {
    const scale = Math.min(window.innerWidth / 800, window.innerHeight / 600);
    this.canvas.width = 800 * scale;
    this.canvas.height = 600 * scale;
    this.paddle.y = this.canvas.height - this.paddle.height - 10;
    this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
  },
  createSounds() {
    this.catchSound = this.createBeep(440, 0.1);
    this.missSound = this.createBeep(220, 0.2);
  },
  createBeep(frequency, duration) {
    return () => {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    };
  },
  start() {
    this.resetGame();
    this.loop();
  },
  resetGame() {
    this.score = 0;
    this.objects = [];
    this.objectSpeed = 3;
    this.spawnInterval = 800;
    this.lastSpawn = 0;
    this.isGameOver = false;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.paddle.x = (this.canvas.width - this.paddle.width) / 2;
    document.getElementById('score').textContent = this.score;
    document.getElementById('highScore').textContent = this.highScore;
    document.getElementById('timer').textContent = '0.0s';
  },
  loop(timestamp) {
    if (!this.lastRender) this.lastRender = timestamp;
    const delta = timestamp - this.lastRender;
    this.lastRender = timestamp;
    this.update(delta);
    this.draw();
    if (!this.isGameOver) {
      this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
    }
  },
  update(delta) {
    this.elapsedTime = (Date.now() - this.startTime) / 1000;
    document.getElementById('timer').textContent = this.elapsedTime.toFixed(1) + 's';
    if (Date.now() - this.lastSpawn > this.spawnInterval) {
      this.spawnObject();
      this.lastSpawn = Date.now();
      this.objectSpeed += 0.05;
      this.spawnInterval = Math.max(200, this.spawnInterval - 5);
    }
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      obj.y += this.objectSpeed * (delta / 16);
      if (
        obj.y + obj.radius > this.paddle.y &&
        obj.x > this.paddle.x &&
        obj.x < this.paddle.x + this.paddle.width
      ) {
        this.score++;
        document.getElementById('score').textContent = this.score;
        this.catchSound();
        this.objects.splice(i, 1);
        continue;
      }
      if (obj.y - obj.radius > this.canvas.height) {
        this.missSound();
        this.objects.splice(i, 1);
        this.endGame();
        return;
      }
    }
  },
  spawnObject() {
    const radius = this.objectRadius;
    const x = Math.random() * (this.canvas.width - 2 * radius) + radius;
    this.objects.push({ x, y: -radius, radius });
  },
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--paddle-color').trim();
    this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--object-color').trim();
    for (const obj of this.objects) {
      this.ctx.beginPath();
      this.ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  },
  handleKeyDown(e) {
    if (this.isGameOver) return;
    const step = this.paddle.speed;
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      this.paddle.x = Math.max(0, this.paddle.x - step);
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      this.paddle.x = Math.min(this.canvas.width - this.paddle.width, this.paddle.x + step);
    }
  },
  handleTouchStart(e) {
    if (this.isGameOver) return;
    e.preventDefault();
    this.touchStartX = e.touches[0].clientX;
  },
  handleTouchMove(e) {
    if (this.isGameOver) return;
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    const deltaX = touchX - this.touchStartX;
    const step = Math.abs(deltaX) > 10 ? (deltaX > 0 ? 15 : -15) : 0;
    this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.width, this.paddle.x + step));
    this.touchStartX = touchX;
  },
  endGame() {
    this.isGameOver = true;
    cancelAnimationFrame(this.animationFrameId);
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('highScore', this.highScore.toString());
      document.getElementById('highScore').textContent = this.highScore;
    }
    this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '30px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 20);
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    this.ctx.fillText('Tap to restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
    this.canvas.addEventListener('touchstart', () => {
      this.canvas.removeEventListener('touchstart', arguments.callee);
      this.start();
    }, { once: true });
    this.canvas.addEventListener('click', () => {
      this.canvas.removeEventListener('click', arguments.callee);
      this.start();
    }, { once: true });
  },
  loadHighScore() {
    const saved = localStorage.getItem('highScore');
    if (saved) {
      this.highScore = parseInt(saved, 10);
      document.getElementById('highScore').textContent = this.highScore;
    }
  }
};