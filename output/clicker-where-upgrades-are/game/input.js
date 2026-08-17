// Input handling for mouse, touch, and keyboard
const Input = {
  mouseX: 0,
  mouseY: 0,
  targetX: 0,
  targetY: 0,
  velocityX: 0,
  velocityY: 0,
  speed: 200,
  maxSpeed: 600,
  baseSpeed: 200,
  shiftPressed: false,
  lastClickTime: 0,
  clickCooldown: 30,
  init(canvas) {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.targetX = e.clientX - rect.left;
      this.targetY = e.clientY - rect.top;
    });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.handleClick(canvas);
    });
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.targetX = touch.clientX - rect.left;
      this.targetY = touch.clientY - rect.top;
      this.handleClick(canvas);
    });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.targetX = touch.clientX - rect.left;
      this.targetY = touch.clientY - rect.top;
      this.shiftPressed = true;
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') this.shiftPressed = true;
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') this.shiftPressed = false;
    });
  },
  handleClick(canvas) {
    const now = performance.now();
    if (now - this.lastClickTime < this.clickCooldown) return;
    this.lastClickTime = now;
    const baseClickValue = 1;
    const boostMultiplier = 1 + 0.05 * GameState.clickBoostLevel;
    const energyGained = baseClickValue * boostMultiplier * (1 + GameState.prestigeLevel * 0.1);
    GameState.energy += energyGained;
    GameState.clicks += 1;
    if (GameState.energy > GameState.highScore) GameState.highScore = GameState.energy;
    emitParticles(this.targetX, this.targetY);
    playSound('click');
    const energyEl = document.getElementById('energy');
    if (energyEl) {
      energyEl.classList.add('pulse');
      setTimeout(() => energyEl.classList.remove('pulse'), 300);
    }
  },
  update(dt) {
    const desiredSpeed = this.shiftPressed ? this.maxSpeed : this.baseSpeed;
    this.speed = interpolate(this.speed, desiredSpeed, 1 - Math.pow(0.01, dt));
    const dx = this.targetX - this.mouseX;
    const dy = this.targetY - this.mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 1) {
      const ax = (dx / dist) * this.speed;
      const ay = (dy / dist) * this.speed;
      this.velocityX = interpolate(this.velocityX, ax, 1 - Math.pow(0.01, dt));
      this.velocityY = interpolate(this.velocityY, ay, 1 - Math.pow(0.01, dt));
    } else {
      this.velocityX = interpolate(this.velocityX, 0, 1 - Math.pow(0.01, dt));
      this.velocityY = interpolate(this.velocityY, 0, 1 - Math.pow(0.01, dt));
    }
    this.mouseX += this.velocityX * dt;
    this.mouseY += this.velocityY * dt;
    const speedFill = document.getElementById('speedFill');
    if (speedFill) speedFill.style.width = ((this.speed - this.baseSpeed) / (this.maxSpeed - this.baseSpeed) * 100).toFixed(0) + '%';
  }
};

function interpolate(a, b, t) {
  return a + (b - a) * t;
}

let particles = [];
function emitParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 150;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * 4,
      life: 0.6,
      maxLife: 0.6
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles(ctx) {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = '#00e676';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}
