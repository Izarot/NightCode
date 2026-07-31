class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.birds = [];
    this.structures = [];
    this.pigs = [];
    this.slingshotX = 100;
    this.slingshotY = 400;
    this.currentBird = null;
    this.isDragging = false;
    this.dragStart = {x:0, y:0};
    this.colors = ['#1a1a2e','#16213e','#0f3460','#e94560','#1b998b'];
    this.init();
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  init() {
    this.structures.push(new Structure(400, 350, 60, 30, 'wood'));
    this.structures.push(new Structure(460, 350, 60, 30, 'stone'));
    this.structures.push(new Structure(430, 300, 60, 30, 'wood'));
    this.pigs.push(new Pig(460, 335, 'basic'));
    this.pigs.push(new Pig(430, 285, 'stone'));
    this.spawnBird();
    this.loop();
  }
  spawnBird() {
    if (hud.birdsRemaining <= 0) return;
    const type = birdTypes[Math.floor(Math.random() * birdTypes.length)];
    this.currentBird = new Bird(type, this.slingshotX, this.slingshotY);
    this.birds.push(this.currentBird);
  }
  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (this.currentBird && !this.currentBird.launched) {
      const dx = x - this.currentBird.x;
      const dy = y - this.currentBird.y;
      if (Math.sqrt(dx*dx + dy*dy) < 50) {
        this.isDragging = true;
        this.dragStart = {x, y};
      }
    }
  }
  handleMouseMove(e) {
    if (!this.isDragging || !this.currentBird) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = this.dragStart.x - x;
    const dy = this.dragStart.y - y;
    const dist = Math.min(Math.sqrt(dx*dx + dy*dy), 80);
    const angle = Math.atan2(dy, dx);
    this.currentBird.x = this.slingshotX - Math.cos(angle) * dist;
    this.currentBird.y = this.slingshotY - Math.sin(angle) * dist;
  }
  handleMouseUp(e) {
    if (!this.isDragging || !this.currentBird) return;
    const dx = this.dragStart.x - (e.clientX - this.canvas.getBoundingClientRect().left);
    const dy = this.dragStart.y - (e.clientY - this.canvas.getBoundingClientRect().top);
    const vx = dx * 0.1;
    const vy = dy * 0.1;
    this.currentBird.launch(vx, vy);
    hud.launchBird();
    this.isDragging = false;
    setTimeout(() => this.spawnBird(), 500);
  }
  update() {
    this.birds.forEach(b => b.update());
    this.checkCollisions();
    hud.updateTimer();
  }
  checkCollisions() {
    this.birds.forEach(bird => {
      if (!bird.launched) return;
      this.structures.forEach(s => {
        if (physics.checkCollision(bird, s)) {
          const destroyed = s.damage(1);
          if (destroyed) {
            const idx = this.structures.indexOf(s);
            if (idx > -1) this.structures.splice(idx, 1);
            hud.addScore(100);
          }
          bird.activateAbility();
          bird.vx *= -0.5;
          bird.vy *= -0.5;
        }
      });
      this.pigs.forEach(p => {
        if (bird.x < p.x + p.r && bird.x + bird.w > p.x - p.r &&
            bird.y < p.y + p.r && bird.y + bird.h > p.y - p.r) {
          const idx = this.pigs.indexOf(p);
          if (idx > -1) this.pigs.splice(idx, 1);
          hud.addScore(200);
          bird.vx *= -0.5;
          bird.vy *= -0.5;
        }
      });
    });
  }
  draw() {
    this.ctx.fillStyle = this.colors[0];
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = this.colors[1];
    this.ctx.fillRect(0, this.canvas.height - 50, this.canvas.width, 50);
    this.ctx.strokeStyle = '#8BC34A';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(this.slingshotX, this.slingshotY);
    this.ctx.lineTo(this.slingshotX, this.slingshotY - 50);
    this.ctx.stroke();
    this.structures.forEach(s => s.draw(this.ctx));
    this.pigs.forEach(p => p.draw(this.ctx));
    this.birds.forEach(b => b.draw(this.ctx));
    if (this.isDragging && this.currentBird) {
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5,5]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.slingshotX, this.slingshotY);
      this.ctx.lineTo(this.currentBird.x + this.currentBird.w/2, this.currentBird.y + this.currentBird.h/2);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }
  loop = () => {
    this.update();
    this.draw();
    requestAnimationFrame(this.loop);
  };
}
const game = new Game();
window.addEventListener('mousedown', e => game.handleMouseDown(e));
window.addEventListener('mousemove', e => game.handleMouseMove(e));
window.addEventListener('mouseup', e => game.handleMouseUp(e));
window.addEventListener('touchstart', e => {
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousedown', {clientX: touch.clientX, clientY: touch.clientY});
  window.dispatchEvent(mouseEvent);
});
window.addEventListener('touchmove', e => {
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousemove', {clientX: touch.clientX, clientY: touch.clientY});
  window.dispatchEvent(mouseEvent);
});
window.addEventListener('touchend', e => {
  const mouseEvent = new MouseEvent('mouseup', {clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY});
  window.dispatchEvent(mouseEvent);
});