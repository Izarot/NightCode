export class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    this.reset();
  }

  reset() {
    this.score = 0;
    this.combo = 0;
    this.multiplier = 1;
    this.energy = 100;
    this.beamColor = 'white';
    this.pattern = 'continuous';
    this.beamAngle = 0;
    this.beamSpeed = 0;
    this.slowRotate = false;
    this.isDragging = false;
    this.paused = false;
    this.wave = 1;
    this.shipsGuided = 0;
    this.shipsTotal = 0;
    this.stormLevel = 0;
    this.gameTimer = 0;
    this.ships = [];
    this.rocks = [];
    this.lastSpawn = 0;
    this.spawnInterval = 3;
    this.harbor = { x: 850, y: 540, radius: 50, capacity: 3, ships: [] };
    this.initTerrain();
  }

  init() {
    this.reset();
    this.spawnInitialShips();
  }

  initTerrain() {
    for (let i = 0; i < 10; i++) {
      this.rocks.push({
        x: 100 + Math.random() * 1720,
        y: 100 + Math.random() * 880,
        radius: 15 + Math.random() * 25
      });
    }
  }

  spawnInitialShips() {
    const types = ['cargo', 'fishing', 'liner'];
    for (let i = 0; i < 3; i++) {
      this.spawnShip(types[i]);
    }
  }

  spawnShip(type = 'cargo') {
    const colors = ['white', 'red', 'green'];
    const patterns = ['continuous', 'double', 'morse'];
    const spawnPoints = [
      { x: -50, y: 540 }, { x: 1970, y: 540 },
      { x: 960, y: -50 }, { x: 960, y: 1130 }
    ];
    const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    
    this.ships.push({
      x: sp.x, y: sp.y,
      vx: (sp.x - 960) * 0.3, vy: (sp.y - 540) * 0.3,
      angle: Math.atan2(540 - sp.y, 850 - sp.x),
      type,
      color: colors[Math.floor(Math.random() * colors.length)],
      pattern: patterns[Math.floor(Math.random() * patterns.length)],
      state: 'cruising',
      guided: false,
      hit: false
    });
  }

  update(delta) {
    this.gameTimer += delta;
    this.energy = Math.min(100, this.energy + 2 * delta);
    
    this.updateBeam(delta);
    this.updateShips(delta);
    this.updateHarbor();
    this.checkCollisions();
  }

  updateBeam(delta) {
    const speed = this.slowRotate ? 60 : 120;
    this.beamSpeed += (this.targetSpeed - this.beamSpeed) * 0.1;
    this.beamAngle += this.beamSpeed * delta * speed / 180;
    this.beamAngle %= 360;
  }

  rotateTo(x, y) {
    const dx = x - 960;
    const dy = y - 540;
    this.targetSpeed = Math.atan2(dy, dx) * 180 / Math.PI - this.beamAngle;
    this.targetSpeed = ((this.targetSpeed + 540) % 360) - 180;
  }

  setBeamColor(color) {
    if (this.beamColor !== color) {
      this.beamColor = color;
      this.energy = Math.max(0, this.energy - 3);
      this.audio?.playColorSound(color);
    }
  }

  setPattern(p) {
    if (this.pattern !== p) {
      this.pattern = p;
      this.energy = Math.max(0, this.energy - 5);
      this.audio?.playSwitchSound();
    }
  }

  superFlash() {
    if (this.energy >= 30) {
      this.energy -= 30;
      this.ships.forEach(s => {
        if (s.state === 'cruising' && !s.guided) {
          s.state = 'guided';
          s.guided = true;
          this.score += 100 * this.multiplier;
          this.combo++;
          this.multiplier = 1 + 0.5 * this.combo;
          this.audio?.playGuidedSound();
        }
      });
    }
  }

  updateShips(delta) {
    this.ships = this.ships.filter(s => !s.hit);
    
    this.ships.forEach(s => {
      if (s.state === 'guided') {
        const dx = this.harbor.x - s.x;
        const dy = this.harbor.y - s.y;
        s.vx = dx * 0.02;
        s.vy = dy * 0.02;
      }
      
      s.x += s.vx;
      s.y += s.vy;
      s.angle = Math.atan2(s.vy, s.vx);
    
      if (s.state === 'cruising') {
        const distToHarbor = Math.sqrt(Math.pow(this.harbor.x - s.x, 2) + Math.pow(this.harbor.y - s.y, 2));
        if (distToHarbor < this.harbor.radius) {
          if (this.harbor.ships.length < this.harbor.capacity) {
            s.state = 'guided';
            s.guided = true;
            this.harbor.ships.push(s);
            this.shipsGuided++;
            this.score += 100 * this.multiplier;
            this.combo++;
            this.multiplier = 1 + 0.5 * this.combo;
            this.audio?.playGuidedSound();
          }
        }
      }
    });
  }

  checkCollisions() {
    this.ships.forEach(s => {
      if (s.state === 'cruising') {
        this.rocks.forEach(r => {
          const dist = Math.sqrt(Math.pow(r.x - s.x, 2) + Math.pow(r.y - s.y, 2));
          if (dist < r.radius + 12) {
            s.hit = true;
            this.audio?.playCrashSound();
            this.combo = 0;
            this.multiplier = 1;
          }
        });
      }
    });
  }

  updateHarbor() {
    if (this.harbor.ships.length > 0) {
      this.harbor.ships = this.harbor.ships.filter(s => {
        const dist = Math.sqrt(Math.pow(this.harbor.x - s.x, 2) + Math.pow(this.harbor.y - s.y, 2));
        return dist >= this.harbor.radius;
      });
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#0a0e1a');
    skyGrad.addColorStop(1, '#1a1030');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 100; i++) {
      const x = (i * 73) % this.width;
      const y = (i * 137) % this.height;
      ctx.fillRect(x, y, 1, 1);
    }
    
    // Ocean
    ctx.fillStyle = '#0d2137';
    ctx.fillRect(0, this.height * 0.4, this.width, this.height * 0.6);
    
    // Rocks
    ctx.fillStyle = '#3a2a1a';
    this.rocks.forEach(r => {
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Harbor
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(this.harbor.x, this.harbor.y, this.harbor.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Lighthouse
    ctx.fillStyle = '#8a8a8a';
    ctx.fillRect(950, 200, 20, 340);
    ctx.fillStyle = '#b87333';
    ctx.fillRect(960, 180, 10, 20);
    
    // Beam
    ctx.save();
    ctx.translate(960, 540);
    ctx.rotate(this.beamAngle * Math.PI / 180);
    ctx.fillStyle = `rgba(${this.beamColor === 'white' ? '255,248,220' : this.beamColor === 'red' ? '220,50,50' : '50,180,80'}, 0.3)`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 400, -0.785, 0.785);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Ships
    this.ships.forEach(s => {
      ctx.fillStyle = s.color === 'white' ? '#f0e6d3' : s.color === 'red' ? '#ff6b6b' : '#51cf66';
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(12, 6);
      ctx.lineTo(0, 10);
      ctx.lineTo(-12, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  updateHUD() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('guided').textContent = `${this.shipsGuided}/${this.shipsTotal || 3}`;
    document.getElementById('wave').textContent = this.wave;
    document.getElementById('storm').textContent = this.stormLevel;
    document.getElementById('energyFill').style.width = `${this.energy}%`;
    
    const mins = Math.floor(this.gameTimer / 60);
    const secs = Math.floor(this.gameTimer % 60);
    document.getElementById('timer').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  pause() {
    this.paused = !this.paused;
  }
}