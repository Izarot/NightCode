const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let game;

window.addEventListener('load', () => {
  game = new Game();
  game.init();
});

window.addEventListener('resize', () => {
  game.resize();
});

window.addEventListener('keydown', (e) => {
  game.handleInput('keydown', e.key);
});

window.addEventListener('keyup', (e) => {
  game.handleInput('keyup', e.key);
});

window.addEventListener('click', (e) => {
  game.handleInput('click', e);
});

window.addEventListener('touchstart', (e) => {
  game.handleInput('touchstart', e.touches[0]);
});

window.addEventListener('touchmove', (e) => {
  game.handleInput('touchmove', e.touches[0]);
});

window.addEventListener('touchend', () => {
  game.handleInput('touchend');
});

window.addEventListener('mousedown', (e) => {
  game.handleInput('mousedown', e);
});

window.addEventListener('mouseup', () => {
  game.handleInput('mouseup');
});

window.addEventListener('mousemove', (e) => {
  game.handleInput('mousemove', e);
});

window.addEventListener('DOMContentLoaded', () => {
  game.loadAssets().then(() => {
    game.start();
  });
});

function Game() {
  constructor() {
    this.canvas = canvas;
    this.ctx = ctx;
    this.config = {
      width: 800,
      height: 600,
      gravity: 0.5,
      windAmplitude: 2,
      windFrequency: 0.001,
      drag: 0.02,
      hazardSpawnRate: 1000,
      collectibleSpawnRate: 8000,
      dayNightCycle: 90000,
      particleCount: 150,
      highScoreKey: 'survivalSnowfall_save'
    };
    this.entities = {
      player: null,
      hazards: [],
      collectibles: [],
      particles: []
    };
    this.inputs = {
      keys: { left: false, right: false, up: false, down: false },
      mouse: { x: 0, y: 0, down: false },
      touch: { x: 0, y: 0, down: false }
    };
    this.audio = new AudioManager();
    this.particles = new ParticleSystem();
    this.ui = new UIManager();
    this.state = 'menu';
    this.time = 0;
    this.lastTime = performance.now();
    this.paused = false;
    this.highScore = localStorage.getItem(this.config.highScoreKey) || 0;
    this.unlockedItems = JSON.parse(localStorage.getItem('survivalSnowfall_unlocked') || '[]');
    this.snowfallSound = new Audio('snowfall.wav');
    this.snowfallSound.loop = true;
    this.snowfallSound.volume = 0.2;
    this.snowfallSound.play();
  }

  init() {
    this.resize();
    this.audio.playMusic('ambient.ogg');
    this.snowfallSound.volume = 0.2;
    this.snowfallSound.play();
    this.entities.player = new Player();
    this.entities.player.spawn();
    this.ui.updateHUD();
  }

  resize() {
    const scale = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = this.config.width * scale;
    this.canvas.height = this.config.height * scale;
    ctx.scale(scale, scale);
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((timestamp) => {
      this.gameLoop(timestamp);
    });
  }

  gameLoop(timestamp) {
    if (this.paused) return;
    this.time += (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    this.update();
    this.render();
    requestAnimationFrame((timestamp) => {
      this.gameLoop(timestamp);
    });
  }

  update() {
    if (this.state === 'playing') {
      this.entities.player.update(this.time);
      this.spawnHazards();
      this.spawnCollectibles();
      this.updateParticles();
      this.checkCollisions();
      this.ui.updateHUD();
      this.audio.update();
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.config.width, this.config.height);
    this.renderBackground();
    this.renderEntities();
    this.particles.render();
    this.ui.render();
  }

  renderBackground() {
    // Parallax layers
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    // Ground
    this.ctx.fillStyle = '#222';
    this.ctx.fillRect(0, this.config.height - 50, this.config.width, 50);
  }

  renderEntities() {
    this.entities.player.render();
    this.entities.hazards.forEach(h => h.render());
    this.entities.collectibles.forEach(c => c.render());
  }

  updateParticles() {
    this.particles.update(this.time);
  }

  checkCollisions() {
    const player = this.entities.player;
    this.entities.hazards.forEach(h => {
      if (player.isAlive && player.checkCollision(h)) {
        if (h.type === 'tree_foliage' || h.type === 'rock' || h.type === 'bird' || h.type === 'icicle') {
          player.takeDamage(h.damage);
        }
      }
    });
    this.entities.collectibles.forEach(c => {
      if (player.checkCollision(c)) {
        player.collect(c);
        this.entities.collectibles = this.entities.collectibles.filter(cc => cc.id !== c.id);
      }
    });
  }

  spawnHazards() {
    if (this.time % this.config.hazardSpawnRate < 16.67) {
      const type = ['tree_foliage', 'rock', 'bird', 'icicle'][Math.floor(Math.random() * 4)];
      const hazard = new Hazard(type);
      this.entities.hazards.push(hazard);
    }
  }

  spawnCollectibles() {
    if (this.time % this.config.collectibleSpawnRate < 16.67) {
      const type = ['coal', 'umbrella', 'scarf', 'mitten'][Math.floor(Math.random() * 4)];
      const collectible = new Collectible(type);
      this.entities.collectibles.push(collectible);
    }
  }

  handleInput(type, data) {
    if (type === 'keydown') {
      switch (data) {
        case 'ArrowLeft': this.inputs.keys.left = true; break;
        case 'ArrowRight': this.inputs.keys.right = true; break;
        case 'ArrowUp': this.inputs.keys.up = true; break;
        case 'ArrowDown': this.inputs.keys.down = true; break;
        case ' ': this.entities.player.usePowerUp(); break;
      }
    }
    if (type === 'keyup') {
      switch (data) {
        case 'ArrowLeft': this.inputs.keys.left = false; break;
        case 'ArrowRight': this.inputs.keys.right = false; break;
        case 'ArrowUp': this.inputs.keys.up = false; break;
        case 'ArrowDown': this.inputs.keys.down = false; break;
      }
    }
    if (type === 'click' || type === 'touchstart') {
      this.inputs.mouse.down = true;
      this.inputs.mouse.x = data.offsetX || data.clientX - canvas.offsetLeft;
      this.inputs.mouse.y = data.offsetY || data.clientY - canvas.offsetTop;
    }
    if (type === 'touchmove') {
      this.inputs.touch.x = data.clientX - canvas.offsetLeft;
      this.inputs.touch.y = data.clientY - canvas.offsetTop;
    }
    if (type === 'touchend' || type === 'mouseup') {
      this.inputs.mouse.down = false;
      this.inputs.touch.down = false;
    }
    if (type === 'mousemove') {
      this.inputs.mouse.x = data.offsetX;
      this.inputs.mouse.y = data.offsetY;
    }
  }

  pause() {
    this.paused = true;
    this.ui.showPauseOverlay();
  }

  resume() {
    this.paused = false;
    this.ui.hidePauseOverlay();
  }

  gameOver() {
    this.state = 'gameOver';
    this.audio.playSound('lose.wav');
    const finalScore = Math.floor(this.time * 10);
    if (finalScore > this.highScore) {
      this.highScore = finalScore;
      localStorage.setItem(this.config.highScoreKey, this.highScore);
    }
    this.ui.showGameOver(this.time, finalScore);
  }

  loadAssets() {
    return Promise.all([
      loadImage('snowflake.png'),
      loadImage('tree_trunk.png'),
      loadImage('tree_foliage.png'),
      loadImage('rock.png'),
      loadImage('bird.png'),
      loadImage('coal.png'),
      loadImage('umbrella.png'),
      loadImage('scarf.png'),
      loadImage('mitten.png'),
      loadImage('snowflake_particle.png')
    ]);
  }
}

function Player() {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.health = 3;
    this.temperature = 50;
    this.powerUpActive = false;
    this.powerUpTimer = 0;
    this.alive = true;
    this.frozen = false;
    this.freezeTimer = 0;
    this.snowflakeSprite = new Sprite('snowflake.png', 6);
  }

  spawn() {
    this.x = Math.random() * this.config.width;
    this.y = -50;
    this.vx = 0;
    this.vy = 0;
    this.health = 3;
    this.temperature = 50;
    this.powerUpActive = false;
    this.alive = true;
    this.frozen = false;
    this.freezeTimer = 0;
  }

  update(time) {
    if (!this.alive) return;
    if (this.frozen) {
      this.freezeTimer -= 16.67;
      if (this.freezeTimer <= 0) {
        this.alive = false;
        game.gameOver();
      }
      return;
    }
    // Apply gravity
    this.vy += game.config.gravity * 16.67;
    // Apply wind
    const wind = game.config.windAmplitude * Math.sin(game.time * game.config.windFrequency);
    this.vx += wind * 16.67;
    // Apply drag
    this.vx *= (1 - game.config.drag * 16.67);
    // Apply player input
    if (game.inputs.keys.left) this.vx -= 0.8 * 16.67;
    if (game.inputs.keys.right) this.vx += 0.8 * 16.67;
    // Wrap X
    if (this.x < 0) this.x = game.config.width;
    if (this.x > game.config.width) this.x = 0;
    // Update position
    this.x += this.vx * 16.67;
    this.y += this.vy * 16.67;
    // Check temperature
    this.temperature -= 1 * 16.67 / 1000;
    if (this.temperature <= 20) {
      this.frozen = true;
      this.freezeTimer = 5000;
    }
    // Update sprite
    this.snowflakeSprite.update(time);
  }

  render() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.snowflakeSprite.currentFrame * (Math.PI / 3));
    ctx.drawImage(this.snowflakeSprite.image, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
    ctx.restore();
  }

  checkCollision(entity) {
    const dx = this.x - entity.x;
    const dy = this.y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.radius + entity.radius;
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.alive = false;
      game.gameOver();
    }
  }

  collect(collectible) {
    if (collectible.type === 'coal') {
      this.temperature += 20;
    } else if (collectible.type === 'umbrella') {
      this.powerUpActive = true;
      this.powerUpTimer = 3000;
    }
    game.audio.playSound('collect.wav');
  }

  usePowerUp() {
    if (this.powerUpActive) {
      this.powerUpActive = false;
      game.audio.playSound('powerup.wav');
    }
  }
}

function Hazard(type) {
  constructor(type) {
    this.type = type;
    this.x = Math.random() * game.config.width;
    this.y = game.config.height;
    this.radius = 20;
    this.speed = 2;
    this.rotation = 0;
    this.image = new Image();
    this.image.src = `assets/hazards/${type}.png`;
  }

  update() {
    this.y -= this.speed * 16.67;
    this.rotation += 0.01 * 16.67;
  }

  render() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.drawImage(this.image, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
    ctx.restore();
  }
}

function Collectible(type) {
  constructor(type) {
    this.type = type;
    this.x = Math.random() * game.config.width;
    this.y = game.config.height;
    this.radius = 10;
    this.speed = 1;
    this.image = new Image();
    this.image.src = `assets/collectibles/${type}.png`;
  }

  update() {
    this.y -= this.speed * 16.67;
  }

  render() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.drawImage(this.image, -this.radius, -this.radius, this.radius * 2, this.radius * 2);
    ctx.restore();
  }
}

function ParticleSystem() {
  constructor() {
    this.particles = [];
    this.maxParticles = 200;
  }

  update(time) {
    // Generate new particles
    if (this.particles.length < this.maxParticles) {
      const count = Math.floor(Math.random() * 5) + 1;
      for (let i = 0; i < count; i++) {
        this.particles.push(new Particle());
      }
    }
    // Update existing particles
    this.particles = this.particles.filter(p => {
      p.update(time);
      return p.active;
    });
  }

  render() {
    this.particles.forEach(p => p.render());
  }
}

function Particle() {
  constructor() {
    this.x = Math.random() * game.config.width;
    this.y = Math.random() * game.config.height;
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    this.size = Math.random() * 4 + 2;
    this.alpha = 1;
    this.active = true;
    this.lifetime = Math.random() * 1000 + 1000;
  }

  update(time) {
    this.x += this.vx * 16.67;
    this.y += this.vy * 16.67;
    this.lifetime -= 16.67;
    if (this.lifetime <= 0) {
      this.active = false;
    }
    this.alpha = this.lifetime / 1000;
  }

  render() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();
  }
}

function UIManager() {
  constructor() {
    this.score = 0;
    this.timer = 0;
    this.health = 3;
    this.temperature = 50;
    this.powerUpActive = false;
    this.powerUpTimer = 0;
  }

  updateHUD() {
    this.score = Math.floor(game.time * 10);
    this.timer = Math.floor(game.time);
    this.health = game.entities.player.health;
    this.temperature = game.entities.player.temperature;
    this.powerUpActive = game.entities.player.powerUpActive;
    this.updateDOM();
  }

  updateDOM() {
    document.getElementById('score').textContent = `Score: ${this.score}`;
    document.getElementById('timer').textContent = `${Math.floor(this.timer / 60).toString().padStart(2, '0')}:${(this.timer % 60).toString().padStart(2, '0')}`;
    const tempBar = document.getElementById('tempBar');
    const tempWidth = (this.temperature / 100) * 100;
    tempBar.style.width = `${tempWidth}%`;
    const hearts = document.getElementById('health');
    hearts.innerHTML = '';
    for (let i = 0; i < this.health; i++) {
      hearts.innerHTML += '<div class="heart full"></div>';
    }
    for (let i = this.health; i < 3; i++) {
      hearts.innerHTML += '<div class="heart empty"></div>';
    }
  }

  render() {
    // HUD elements
  }

  showPauseOverlay() {
    // Implement pause overlay
  }

  hidePauseOverlay() {
    // Implement hide pause overlay
  }

  showGameOver(time, score) {
    // Implement game over screen
  }
}

function AudioManager() {
  constructor() {
    this.sounds = {
      snowfall: new Audio('snowfall.wav'),
      hit: new Audio('hit.wav'),
      collect: new Audio('collect.wav'),
      powerup: new Audio('powerup.wav'),
      freeze: new Audio('freeze.wav'),
      win: new Audio('win.wav'),
      lose: new Audio('lose.wav'),
      ambient: new Audio('ambient.ogg')
    };
    this.sounds.snowfall.loop = true;
    this.sounds.ambient.loop = true;
  }

  playSound(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName].currentTime = 0;
      this.sounds[soundName].play();
    }
  }

  playMusic(musicName) {
    this.sounds.ambient.src = musicName;
    this.sounds.ambient.play();
  }

  update() {
    // Volume control
  }
}

function Sprite(imagePath, frameCount) {
  constructor(imagePath, frameCount) {
    this.image = new Image();
    this.image.src = imagePath;
    this.frameCount = frameCount;
    this.currentFrame = 0;
    this.frameDuration = 100;
    this.lastFrameTime = performance.now();
  }

  update(time) {
    const elapsed = time - this.lastFrameTime;
    if (elapsed > this.frameDuration) {
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
      this.lastFrameTime = time;
    }
  }
}

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = resolve;
    img.src = src;
  });
}