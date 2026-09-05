export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.lastTime = 0;
    this.walls = [];
    this.enemies = [];
    this.particles = [];
    this.projectiles = [];
    this.turrets = [];
    this.spawnTimer = 0;
    this.wave = 1;
    this.cash = 100;
    this.highScore = parseInt(localStorage.getItem('sandfall_hs') || '0');
    this.startTime = null;
    this.input = { x: 0, y: 0 };
    canvas.addEventListener('pointermove', e => {
      const rect = canvas.getBoundingClientRect();
      this.input.x = e.clientX - rect.left;
      this.input.y = e.clientY - rect.top;
    });
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  start(ui) {
    this.ui = ui;
    this.ui.setCash(this.cash);
    this.ui.setHighScore(this.highScore);
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    requestAnimationFrame((t) => this.loop(t));
  }
  loop(now) {
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.update(dt);
    this.draw();
    if (this.ui) this.ui.updateTimer((now - this.startTime) / 1000);
    requestAnimationFrame((t) => this.loop(t));
  }
  update(dt) {
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = 1.5;
    }
    this.enemies.forEach(e => e.update(dt));
    this.enemies = this.enemies.filter(e => !e.dead);
  }
  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1410';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.enemies.forEach(e => e.draw(ctx));
  }
  spawnEnemy() {
    const e = new Enemy(this.canvas.width / 2, 0);
    this.enemies.push(e);
  }
}

class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.speed = 60;
    this.dead = false;
  }
  update(dt) {
    this.y += this.speed * dt;
    if (this.y > 600) this.dead = true;
  }
  draw(ctx) {
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
