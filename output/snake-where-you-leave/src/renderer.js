import { CONFIG } from '../config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.dripTimer = 0;
    this.time = 0;
  }

  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    this.ctx.fillStyle = CONFIG.COLORS.BG;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render(gameState, snake, food, slimeGrid, interpolation, deltaTime) {
    this.time += deltaTime;
    this.clear();

    // Render stale slime trail
    this.renderSlimeTrail(slimeGrid);

    // Render turn splats
    this.renderTurnSplats(snake.getTurnSplats());

    // Render food
    if (food) this.renderFood(food, interpolation);

    // Render snake with interpolation
   this.renderSnake(snake, interpolation);

    // Render particles
    this.renderParticles(deltaTime);

    // Render drip particles from snake body
    this.updateDrips(snake, deltaTime);
  }

  renderSlimeTrail(slimeGrid) {
    const cellSize = this.canvas.width / CONFIG.GRID_SIZE;
    slimeGrid.forEach((tile, x, y) => {
      if (tile.state === 'stale') {
        const alpha = Math.max(0.1, 0.3 * (1 - tile.age / CONFIG.SLIME_STALE_MS));
        this.ctx.fillStyle = `rgba(0, 51, 34, ${alpha})`;
        this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      } else if (tile.state === 'fresh') {
        const alpha = 0.15 * (1 - tile.age / CONFIG.SLIME_FADE_MS);
        this.ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
        this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    });
  }

  renderTurnSplats(splats) {
    const cellSize = this.canvas.width / CONFIG.GRID_SIZE;
    const now = performance.now();
    splats.forEach(splat => {
      const age = now - splat.time;
      if (age > 500) return;
      const progress = age / 500;
      const size = cellSize * (0.5 + progress * 0.5);
      const alpha = 1 - progress;
      const x = (splat.x + 0.5) * cellSize;
      const y = (splat.y + 0.5) * cellSize;
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(Math.atan2(splat.dir.y, splat.dir.x));
      this.ctx.fillStyle = `rgba(0, 255, 136, ${alpha * 0.6})`;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, size * 0.6, size * 0.3, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  renderFood(food, interpolation) {
    const cellSize = this.canvas.width / CONFIG.GRID_SIZE;
    const x = (food.x + 0.5) * cellSize;
    const y = (food.y + 0.5) * cellSize;
    const pulse = Math.sin(this.time * 0.005) * 0.15 + 0.85;
    const radius = cellSize * 0.35 * pulse;

    // Glow
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    gradient.addColorStop(0, 'rgba(255, 0, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - radius * 2, y - radius * 2, radius * 4, radius * 4);

    // Core
    this.ctx.fillStyle = CONFIG.COLORS.FOOD_CORE;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2);
    this.ctx.fill();

    // Outer
    this.ctx.fillStyle = CONFIG.COLORS.FOOD;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderSnake(snake, interpolation) {
    const cellSize = this.canvas.width / CONFIG.GRID_SIZE;
    const segments = snake.getSegments();
    const direction = snake.getDirection();
    const isBoost = snake.isBoostActive();
    const isSlipping = snake.isSlipLocked();

    // Interpolate head position for smooth movement
    let headX = segments[0].x;
    let headY = segments[0].y;
    if (interpolation < 1 && segments.length > 1) {
      headX = segments[1].x + (segments[0].x - segments[1].x) * interpolation;
      headY = segments[1].y + (segments[0].y - segments[1].y) * interpolation;
    }

    // Render body segments
    for (let i = segments.length - 1; i >= 0; i--) {
      let seg = segments[i];
      let x, y;

      if (i === 0) {
        x = (headX + 0.5) * cellSize;
        y = (headY + 0.5) * cellSize;
      } else {
        x = (seg.x + 0.5) * cellSize;
        y = (seg.y + 0.5) * cellSize;
      }

      const progress = i / Math.max(1, segments.length - 1);
      const radius = cellSize * 0.45 * (0.7 + 0.3 * (1 - progress));

      // Color gradient from head to tail
      const r = Math.floor(0 * (1 - progress) + 0 * progress);
      const g = Math.floor(255 * (1 - progress) + 102 * progress);
      const b = Math.floor(136 * (1 - progress) + 68 * progress);

      this.ctx.save();
      this.ctx.translate(x, y);

      // Boost glow
      if (isBoost) {
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 20;
      }

      // Slip distortion
      if (isSlipping && i === 0) {
        this.ctx.rotate(Math.sin(this.time * 0.05) * 0.2);
      }

      // Segment shape
      this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Highlight
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.beginPath();
      this.ctx.arc(-radius * 0.2, -radius * 0.2, radius * 0.3, 0, Math.PI * 2);
      this.ctx.fill();

      // Eyes on head
      if (i === 0) {
        const eyeOffset = radius * 0.35;
        const eyeRadius = radius * 0.18;
        const dirAngle = Math.atan2(direction.y, direction.x);
        this.ctx.rotate(dirAngle);
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(eyeOffset, -eyeOffset, eyeRadius, 0, Math.PI * 2);
        this.ctx.arc(eyeOffset, eyeOffset, eyeRadius, 0, Math.PI * 2);
        this.ctx.fill();
        // Pupils
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(eyeOffset + 1, -eyeOffset - 1, eyeRadius * 0.4, 0, Math.PI * 2);
        this.ctx.arc(eyeOffset + 1, eyeOffset - 1, eyeRadius * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  updateDrips(snake, deltaTime) {
    this.dripTimer += deltaTime;
    if (this.dripTimer >= CONFIG.DRIP_INTERVAL_MS) {
      this.dripTimer = 0;
      const segments = snake.getSegments();
      const dripsToSpawn = Math.max(1, Math.floor(segments.length * CONFIG.DRIP_PER_SEGMENT / 10));
      for (let i = 0; i < dripsToSpawn; i++) {
        const seg = segments[Math.floor(Math.random() * segments.length)];
        this.particles.push({
          x: (seg.x + 0.5) * (this.canvas.width / CONFIG.GRID_SIZE),
          y: (seg.y + 0.5) * (this.canvas.width / CONFIG.GRID_SIZE),
          vx: (Math.random() - 0.5) * 0.5,
          vy: Math.random() * 1.5 + 0.5,
          radius: Math.random() * 3 + 2,
          life: 1,
          color: snake.isBoostActive() ? '#00ffff' : '#00ff88'
        });
      }
    }
  }

  addEvaporationParticles(x, y, color) {
    for (let i = 0; i < CONFIG.EVAPORATION_PARTICLES; i++) {
      const angle = (Math.PI * 2 / CONFIG.EVAPORATION_PARTICLES) * i + Math.random() * 0.5;
      const speed = Math.random() * 1.5 + 0.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2 + 1,
        life: 1,
        color: color || '#00ff88',
        fade: true
      });
    }
  }

  renderParticles(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.life -= deltaTime / 1000;
      if (p.fade) p.life -= deltaTime / 500;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const alpha = Math.max(0, p.life);
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, Math.max(0.5, p.radius * alpha), 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  renderBoostMeter(ratio) {
    // Called from game.js for UI overlay
  }
}
