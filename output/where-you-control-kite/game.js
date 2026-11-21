// Aether Kite - Complete Game Implementation
// Vibrant Color Palette
const PALETTE = {
  bgDeep: '#0a0a1a',
  bgMid: '#1a1a3a',
  bgLight: '#2a2a5a',
  accentCyan: '#00ffff',
  accentMagenta: '#ff00ff',
  accentOrange: '#ff6b35',
  accentGold: '#ffd700',
  accentPink: '#ff6b9d',
  accentGreen: '#00ff88',
  kitePrimary: '#ffffff',
  kiteSecondary: '#00ffff',
  lineSafe: '#00ff88',
  lineCaution: '#ffd700',
  lineDanger: '#ff3366',
  thermalCore: '#ff6b35',
  thermalOuter: '#ffaa00',
  particleColors: ['#00ffff', '#ff00ff', '#ff6b35', '#ffd700', '#ffffff']
};

// Constants
const CONSTANTS = {
  PHYSICS_HZ: 30,
  MAX_SUBSTEPS: 4,
  KITE_MASS: 1.5,
  KITE_INERTIA: 0.8,
  KITE_AREA: 2.5,
  LINE_LENGTH_MIN: 50,
  LINE_LENGTH_MAX: 400,
  LINE_SPRING_K: 0.08,
  LINE_DAMPER_C: 0.15,
  LINE_BREAK_TENSION: 1200,
  LIFT_COEFF: 0.12,
  DRAG_COEFF: 0.04,
  GRAVITY: 9.81,
  WIND_ZONE_TRANSITION_TIME: 2.5,
  THERMAL_RADIUS: 80,
  THERMAL_STRENGTH: 25,
  TRICK_SPIN_TORQUE: 180,
  TRICK_DIVE_TORQUE: -120,
  COMBO_TIMEOUT: 2.0,
  TURBO_DURATION: 5.0,
  TURBO_MULTIPLIER: 2.5
};

// Vector2 Utility
class Vec2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  static fromAngle(angle, length = 1) { return new Vec2(Math.cos(angle) * length, Math.sin(angle) * length); }
  copy() { return new Vec2(this.x, this.y); }
  set(x, y) { this.x = x; this.y = y; return this; }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  mul(s) { this.x *= s; this.y *= s; return this; }
  div(s) { this.x /= s; this.y /= s; return this; }
  length() { return Math.hypot(this.x, this.y); }
  lengthSq() { return this.x * this.x + this.y * this.y; }
  normalize() { const l = this.length(); if (l > 0) this.div(l); return this; }
  dot(v) { return this.x * v.x + this.y * v.y; }
  cross(v) { return this.x * v.y - this.y * v.x; }
  angle() { return Math.atan2(this.y, this.x); }
  distance(v) { return Math.hypot(this.x - v.x, this.y - v.y); }
  lerp(v, t) { this.x += (v.x - this.x) * t; this.y += (v.y - this.y) * t; return this; }
  rotate(angle) { const c = Math.cos(angle), s = Math.sin(angle); const nx = this.x * c - this.y * s; this.y = this.x * s + this.y * c; this.x = nx; return this; }
  static add(a, b) { return new Vec2(a.x + b.x, a.y + b.y); }
  static sub(a, b) { return new Vec2(a.x - b.x, a.y - b.y); }
  static mul(v, s) { return new Vec2(v.x * s, v.y * s); }
  static lerp(a, b, t) { return new Vec2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t); }
}

// Wind Zone Definitions
const WIND_ZONES = [
  { id: 'laminar_start', name: 'Calm Stratus', wind: new Vec2(8, -2), turbulence: 0.1, color: '#0066cc', thermals: [] },
  { id: 'gusty_hills', name: 'Gusty Hills', wind: new Vec2(12, 3), turbulence: 0.6, color: '#cc4400', thermals: [{ x: 800, y: 300, r: 100, strength: 30 }] },
  { id: 'thermal_column', name: 'Great Thermal', wind: new Vec2(5, -5), turbulence: 0.2, color: '#00aa44', thermals: [{ x: 1500, y: 200, r: 150, strength: 40 }, { x: 2200, y: 350, r: 120, strength: 35 }] },
  { id: 'jet_stream', name: 'Jet Stream', wind: new Vec2(25, 0), turbulence: 0.4, color: '#8800cc', thermals: [] },
  { id: 'easter_egg', name: 'Retrograde Zone', wind: new Vec2(-15, 10), turbulence: 0.8, color: '#ff00ff', thermals: [{ x: 4000, y: 100, r: 200, strength: 50 }], hidden: true }
];

// Audio System
class AudioSystem {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.sounds = {};
  }
  async unlock() {
    if (this.unlocked) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    await this.ctx.resume();
    this.createSounds();
    this.unlocked = true;
  }
  createSounds() {
    // Wind whoosh
    this.sounds.wind = () => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    };
    // Trick chime
    this.sounds.trick = () => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    };
    // Tension warning
    this.sounds.tension = () => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    };
    // Thermal enter
    this.sounds.thermal = () => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    };
    // Line snap
    this.sounds.snap = () => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    };
  }
  play(name) {
    if (!this.unlocked || !this.sounds[name]) return;
    try { this.sounds[name](); } catch (e) {}
  }
}

// Particle System
class ParticleSystem {
  constructor() { this.particles = []; this.windParticles = []; }
  add(x, y, vx, vy, life, color, size, type = 'normal') {
    this.particles.push({ x, y, vx, vy, life, maxLife: life, color, size, type, rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.1 });
  }
  addWind(x, y, windDir, windSpeed) {
    const angle = windDir + (Math.random() - 0.5) * 0.5;
    const speed = windSpeed * 0.3 + Math.random() * 2;
    this.windParticles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1.5 + Math.random() * 1.5,
      maxLife: 2,
      color: PALETTE.particleColors[Math.floor(Math.random() * PALETTE.particleColors.length)],
      size: 1 + Math.random() * 2,
      alpha: 0.3 + Math.random() * 0.4
    });
  }
  update(dt, windDir, windSpeed, kiteX, kiteY) {
    // Normal particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;
      p.vy += CONSTANTS.GRAVITY * 0.1 * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    // Wind visualization particles
    if (Math.random() < 0.3 * windSpeed * dt) {
      this.addWind(kiteX + (Math.random() - 0.5) * 20, kiteY + (Math.random() - 0.5) * 20, windDir, windSpeed);
    }
    for (let i = this.windParticles.length - 1; i >= 0; i--) {
      const p = this.windParticles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) this.windParticles.splice(i, 1);
    }
  }
  render(ctx, camera) {
    ctx.save();
    // Wind particles
    for (const p of this.windParticles) {
      const alpha = (p.life / p.maxLife) * p.alpha;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // Normal particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.translate(p.x - camera.x, p.y - camera.y);
      ctx.rotate(p.rotation);
      if (p.type === 'spark') {
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.rotate(-p.rotation);
      ctx.translate(-(p.x - camera.x), -(p.y - camera.y));
    }
    ctx.restore();
  }
}

// Kite Physics
class Kite {
  constructor() {
    this.pos = new Vec2(400, 300);
    this.vel = new Vec2(0, 0);
    this.angle = -Math.PI / 2; // Pointing up
    this.angularVel = 0;
    this.lineLength = 150;
    this.targetLineLength = 150;
    this.anchor = new Vec2(400, 550); // Player position on ground
    this.tension = 0;
    this.maxTension = 0;
    this.inThermal = false;
    this.thermalBoost = 0;
    this.turboTimer = 0;
    this.turboActive = false;
    this.rideBonus = 0;
    this.lastTrickTime = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.spinCount = 0;
    this.totalRotation = 0;
    this.crashed = false;
    this.distance = 0;
    this.maxHeight = 0;
  }
  update(dt, wind, input, zones, particles, audio) {
    if (this.crashed) return;
    
    // Update anchor (player follows kite horizontally slowly)
    this.anchor.x += (this.pos.x - this.anchor.x) * 0.02;
    this.anchor.y = 550;
    
    // Line length control
    const lineSpeed = 80 * dt;
    if (input.lineIn) this.targetLineLength = Math.max(CONSTANTS.LINE_LENGTH_MIN, this.targetLineLength - lineSpeed);
    if (input.lineOut) this.targetLineLength = Math.min(CONSTANTS.LINE_LENGTH_MAX, this.targetLineLength + lineSpeed);
    this.lineLength += (this.targetLineLength - this.lineLength) * 5 * dt;
    
    // Wind force at kite position
    const windForce = wind.copy();
    
    // Aerodynamic forces
    const relativeWind = Vec2.sub(windForce, this.vel);
    const windSpeed = relativeWind.length();
    if (windSpeed > 0.1) {
      const windDir = relativeWind.angle();
      const aoa = this.angle - windDir; // Angle of attack
      const aoaClamped = Math.max(-Math.PI/2, Math.min(Math.PI/2, aoa));
      
      // Lift perpendicular to relative wind
      const liftDir = new Vec2(-Math.sin(windDir), Math.cos(windDir));
      const liftMag = CONSTANTS.LIFT_COEFF * CONSTANTS.KITE_AREA * windSpeed * windSpeed * Math.sin(aoaClamped * 2);
      
      // Drag opposite to relative wind
      const dragDir = relativeWind.copy().normalize().mul(-1);
      const dragMag = CONSTANTS.DRAG_COEFF * CONSTANTS.KITE_AREA * windSpeed * windSpeed;
      
      const aeroForce = Vec2.add(Vec2.mul(liftDir, liftMag), Vec2.mul(dragDir, dragMag));
      this.vel.add(Vec2.mul(aeroForce, dt / CONSTANTS.KITE_MASS));
    }
    
    // Gravity
    this.vel.y += CONSTANTS.GRAVITY * dt;
    
    // Line tension spring-damper
    const toAnchor = Vec2.sub(this.anchor, this.pos);
    const dist = toAnchor.length();
    const lineDir = dist > 0 ? toAnchor.mul(1/dist) : new Vec2(0, -1);
    
    const springForce = CONSTANTS.LINE_SPRING_K * (dist - this.lineLength);
    const damperForce = CONSTANTS.LINE_DAMPER_C * this.vel.dot(lineDir);
    this.tension = Math.max(0, springForce + damperForce);
    this.maxTension = Math.max(this.maxTension, this.tension);
    
    if (this.tension > 0) {
      const tensionForce = Vec2.mul(lineDir, this.tension / CONSTANTS.KITE_MASS);
      this.vel.add(Vec2.mul(tensionForce, dt));
    }
    
    // Line break check
    if (this.tension > CONSTANTS.LINE_BREAK_TENSION) {
      this.crashed = true;
      audio.play('snap');
      particles.add(this.pos.x, this.pos.y, 0, 0, 1, PALETTE.lineDanger, 8, 'spark');
      for(let i=0;i<30;i++) particles.add(this.pos.x, this.pos.y, (Math.random()-0.5)*200, (Math.random()-0.5)*200, 2, PALETTE.lineDanger, 4);
    }
    
    // Torque from AoA (weathercock stability)
    if (windSpeed > 1) {
      const windDir = relativeWind.angle();
      const aoa = this.angle - windDir;
      const stabilityTorque = -aoa * 3 * (windSpeed / 20);
      this.angularVel += stabilityTorque * dt;
    }
    
    // Input torque
    if (input.pitchUp) this.angularVel -= 4 * dt;
    if (input.pitchDown) this.angularVel += 4 * dt;
    
    // Trick inputs
    const now = performance.now() / 1000;
    if (input.trick && now - this.lastTrickTime > 0.3) {
      if (input.pitchDown) {
        // Dive
        this.angularVel += CONSTANTS.TRICK_DIVE_TORQUE * dt * 10;
        this.lastTrickTime = now;
        this.addCombo('DIVE', particles, audio);
      } else if (input.pitchUp || input.yawLeft || input.yawRight) {
        // Spin
        const dir = input.yawLeft ? -1 : (input.yawRight ? 1 : (Math.random() > 0.5 ? 1 : -1));
        this.angularVel += CONSTANTS.TRICK_SPIN_TORQUE * dir * dt * 10;
        this.spinCount++;
        this.lastTrickTime = now;
        this.addCombo('SPIN', particles, audio);
      } else {
        // Generic air
        this.angularVel += (Math.random() > 0.5 ? 1 : -1) * 90 * dt * 10;
        this.lastTrickTime = now;
        this.addCombo('AIR', particles, audio);
      }
    }
    
    // Angular damping
    this.angularVel *= 0.98;
    this.angle += this.angularVel * dt;
    this.totalRotation += Math.abs(this.angularVel) * dt;
    
    // Update position
    this.pos.add(Vec2.mul(this.vel, dt));
    
    // Ground collision
    if (this.pos.y > 540) {
      this.pos.y = 540;
      this.vel.y = Math.min(0, this.vel.y);
      if (this.vel.length() > 30) {
        this.crashed = true;
        audio.play('snap');
      }
      this.vel.mul(0.5);
    }
    
    // Ceiling
    if (this.pos.y < 20) {
      this.pos.y = 20;
      this.vel.y = Math.max(0, this.vel.y);
    }
    
    // Thermal detection
    this.inThermal = false;
    this.thermalBoost = 0;
    for (const zone of zones) {
      for (const thermal of zone.thermals) {
        const d = this.pos.distance(new Vec2(thermal.x, thermal.y));
        if (d < thermal.r) {
          this.inThermal = true;
          const strength = thermal.strength * (1 - d / thermal.r);
          this.vel.y -= strength * dt;
          this.thermalBoost = strength;
          this.rideBonus = Math.min(1, this.rideBonus + dt * 0.3);
          if (this.rideBonus >= 1 && !this.turboActive) {
            this.activateTurbo(particles, audio);
          }
          // Thermal particles
          if (Math.random() < 0.1) {
            particles.add(thermal.x + (Math.random()-0.5)*thermal.r, thermal.y + thermal.r/2, (Math.random()-0.5)*10, -20-Math.random()*30, 1, PALETTE.thermalCore, 3);
          }
        }
      }
    }
    if (!this.inThermal) this.rideBonus = Math.max(0, this.rideBonus - dt * 0.2);
    
    // Turbo timer
    if (this.turboActive) {
      this.turboTimer -= dt;
      if (this.turboTimer <= 0) this.turboActive = false;
    }
    
    // Combo timer
    if (this.combo > 1) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }
    
    // Distance tracking
    this.distance = Math.max(this.distance, this.pos.x - 400);
    this.maxHeight = Math.max(this.maxHeight, 550 - this.pos.y);
  }
  addCombo(type, particles, audio) {
    this.combo = Math.min(10, this.combo + 1);
    this.comboTimer = CONSTANTS.COMBO_TIMEOUT;
    audio.play('trick');
    for(let i=0;i<10;i++) particles.add(this.pos.x, this.pos.y, (Math.random()-0.5)*100, (Math.random()-0.5)*100, 0.5, PALETTE.accentGold, 3, 'spark');
  }
  activateTurbo(particles, audio) {
    this.turboActive = true;
    this.turboTimer = CONSTANTS.TURBO_DURATION;
    audio.play('thermal');
    for(let i=0;i<30;i++) particles.add(this.pos.x, this.pos.y, (Math.random()-0.5)*200, (Math.random()-0.5)*200, 1, PALETTE.accentOrange, 4);
  }
}

// Input System
class InputSystem {
  constructor() {
    this.keys = {};
    this.touch = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
    this.gamepadIndex = -1;
    this.bindEvents();
  }
  bindEvents() {
    window.addEventListener('keydown', e => this.keys[e.code] = true);
    window.addEventListener('keyup', e => this.keys[e.code] = false);
    window.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        this.touch.active = true;
        this.touch.startX = e.touches[0].clientX;
        this.touch.startY = e.touches[0].clientY;
        this.touch.currentX = this.touch.startX;
        this.touch.currentY = this.touch.startY;
      }
    }, { passive: true });
    window.addEventListener('touchmove', e => {
      if (this.touch.active && e.touches.length === 1) {
        this.touch.currentX = e.touches[0].clientX;
        this.touch.currentY = e.touches[0].clientY;
      }
    }, { passive: true });
    window.addEventListener('touchend', () => this.touch.active = false);
    window.addEventListener('gamepadconnected', e => { this.gamepadIndex = e.gamepad.index; });
    window.addEventListener('gamepaddisconnected', () => this.gamepadIndex = -1);
  }
  getInput() {
    const input = {
      pitchUp: false,
      pitchDown: false,
      yawLeft: false,
      yawRight: false,
      lineIn: false,
      lineOut: false,
      trick: false
    };
    // Keyboard
    if (this.keys['ArrowUp'] || this.keys['KeyW']) input.pitchUp = true;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) input.pitchDown = true;
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) input.yawLeft = true;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) input.yawRight = true;
    if (this.keys['KeyQ']) input.lineIn = true;
    if (this.keys['KeyE']) input.lineOut = true;
    if (this.keys['Space']) input.trick = true;
    // Touch
    if (this.touch.active) {
      const dx = this.touch.currentX - this.touch.startX;
      const dy = this.touch.currentY - this.touch.startY;
      if (dy < -30) input.pitchUp = true;
      if (dy > 30) input.pitchDown = true;
      if (dx < -30) input.yawLeft = true;
      if (dx > 30) input.yawRight = true;
      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) input.trick = true;
    }
    // Gamepad
    if (this.gamepadIndex >= 0) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp) {
        if (gp.axes[1] < -0.3) input.pitchUp = true;
        if (gp.axes[1] > 0.3) input.pitchDown = true;
        if (gp.axes[0] < -0.3) input.yawLeft = true;
        if (gp.axes[0] > 0.3) input.yawRight = true;
        if (gp.buttons[4]?.pressed) input.lineIn = true;
        if (gp.buttons[5]?.pressed) input.lineOut = true;
        if (gp.buttons[0]?.pressed) input.trick = true;
      }
    }
    return input;
  }
}

// Camera System
class Camera {
  constructor() { this.pos = new Vec2(0, 0); this.target = new Vec2(0, 0); }
  update(kite, dt) {
    this.target.x = kite.pos.x - 400;
    this.target.y = kite.pos.y - 300;
    this.pos.lerp(this.target, 1 - Math.pow(0.001, dt));
  }
}

// Zone Manager
class ZoneManager {
  constructor() { this.currentZone = 0; this.transition = 0; this.nextZone = 0; }
  update(kite) {
    const zoneWidth = 2000;
    const targetZone = Math.floor(kite.pos.x / zoneWidth);
    const clampedTarget = Math.max(0, Math.min(WIND_ZONES.length - 1, targetZone));
    if (clampedTarget !== this.currentZone && this.transition === 0) {
      this.nextZone = clampedTarget;
      this.transition = 1;
    }
    if (this.transition > 0) {
      this.transition -= 1 / (CONSTANTS.WIND_ZONE_TRANSITION_TIME * 60);
      if (this.transition <= 0) {
        this.transition = 0;
        this.currentZone = this.nextZone;
      }
    }
  }
  getWind(pos) {
    const current = WIND_ZONES[this.currentZone];
    let wind = current.wind.copy();
    // Turbulence
    const turb = current.turbulence;
    if (turb > 0) {
      const noise = (Math.sin(pos.x * 0.01 + performance.now() * 0.001) + Math.cos(pos.y * 0.01 + performance.now() * 0.0013)) * 0.5;
      wind.x += noise * turb * 5;
      wind.y += noise * turb * 3;
    }
    // Transition blend
    if (this.transition > 0 && this.nextZone < WIND_ZONES.length) {
      const next = WIND_ZONES[this.nextZone];
      const t = 1 - this.transition;
      wind.x = wind.x * (1 - t) + next.wind.x * t;
      wind.y = wind.y * (1 - t) + next.wind.y * t;
    }
    return { wind, zone: current, transition: this.transition, nextZone: this.nextZone };
  }
}

// Renderer
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }
  render(kite, camera, zones, particles, windInfo, score, highScore, time, combo) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(-camera.pos.x, -camera.pos.y);
    
    // Sky gradient based on zone
    const zone = windInfo.zone;
    const grad = ctx.createLinearGradient(0, 0, 0, this.height + camera.pos.y);
    grad.addColorStop(0, zone.color + '22');
    grad.addColorStop(0.5, PALETTE.bgMid);
    grad.addColorStop(1, PALETTE.bgDeep);
    ctx.fillStyle = grad;
    ctx.fillRect(camera.pos.x, camera.pos.y, this.width, this.height);
    
    // Stars
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 127 + camera.pos.x * 0.1) % (this.width + camera.pos.x * 2);
      const y = (i * 311 + camera.pos.y * 0.1) % (this.height + camera.pos.y);
      const size = (i % 3) + 0.5;
      ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Ground
    const groundY = 550;
    const groundGrad = ctx.createLinearGradient(0, groundY - 50, 0, groundY + 50);
    groundGrad.addColorStop(0, '#1a1a2e');
    groundGrad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(camera.pos.x - 100, groundY, this.width + 200, 100);
    
    // Ground detail lines
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;
    for (let x = -1000; x < 10000; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, groundY + 100);
      ctx.stroke();
    }
    
    // Thermals
    for (const z of zones) {
      for (const t of z.thermals) {
        const pulse = Math.sin(performance.now() * 0.003) * 0.2 + 0.8;
        const grad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.r * pulse);
        grad.addColorStop(0, PALETTE.thermalCore + '40');
        grad.addColorStop(0.5, PALETTE.thermalOuter + '20');
        grad.addColorStop(1, PALETTE.thermalOuter + '00');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r * pulse, 0, Math.PI * 2);
        ctx.fill();
        // Thermal ring
        ctx.strokeStyle = PALETTE.thermalCore + '60';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.lineDashOffset = -performance.now() * 0.05;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    
    // Wind visualization lines
    ctx.strokeStyle = PALETTE.accentCyan + '15';
    ctx.lineWidth = 1;
    for (let x = camera.pos.x - 100; x < camera.pos.x + this.width + 100; x += 80) {
      for (let y = camera.pos.y - 100; y < camera.pos.y + this.height + 100; y += 80) {
        const wx = windInfo.wind.x;
        const wy = windInfo.wind.y;
        const len = Math.hypot(wx, wy) * 2;
        if (len > 2) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + wx * 2, y + wy * 2);
          ctx.stroke();
        }
      }
    }
    
    // Particles
    particles.render(ctx, camera.pos);
    
    // Kite line
    const tensionRatio = Math.min(1, kite.tension / CONSTANTS.LINE_BREAK_TENSION);
    const lineColor = tensionRatio < 0.5 ? PALETTE.lineSafe : tensionRatio < 0.8 ? PALETTE.lineCaution : PALETTE.lineDanger;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2 + tensionRatio * 3;
    ctx.beginPath();
    ctx.moveTo(kite.anchor.x, kite.anchor.y);
    // Curved line with segments
    const segments = 8;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = kite.anchor.x + (kite.pos.x - kite.anchor.x) * t + Math.sin(t * Math.PI) * 10 * (1 - t) * tensionRatio;
      const y = kite.anchor.y + (kite.pos.y - kite.anchor.y) * t;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Kite body
    ctx.save();
    ctx.translate(kite.pos.x, kite.pos.y);
    ctx.rotate(kite.angle);
    
    // Turbo glow
    if (kite.turboActive) {
      const turboPulse = Math.sin(performance.now() * 0.01) * 0.3 + 0.7;
      ctx.shadowColor = PALETTE.accentOrange;
      ctx.shadowBlur = 30 * turboPulse;
    }
    
    // Kite diamond shape
    const kiteW = 40;
    const kiteH = 50;
    ctx.fillStyle = kite.turboActive ? PALETTE.accentOrange : PALETTE.kitePrimary;
    ctx.beginPath();
    ctx.moveTo(0, -kiteH/2);
    ctx.lineTo(kiteW/2, 0);
    ctx.lineTo(0, kiteH/2);
    ctx.lineTo(-kiteW/2, 0);
    ctx.closePath();
    ctx.fill();
    
    // Kite pattern
    ctx.strokeStyle = kite.turboActive ? PALETTE.accentGold : PALETTE.kiteSecondary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -kiteH/2);
    ctx.lineTo(0, kiteH/2);
    ctx.moveTo(-kiteW/2, 0);
    ctx.lineTo(kiteW/2, 0);
    ctx.stroke();
    
    // Tail ribbons
    ctx.strokeStyle = PALETTE.accentPink;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * 8;
      ctx.beginPath();
      ctx.moveTo(offset, kiteH/2);
      for (let j = 1; j <= 10; j++) {
        const t = j / 10;
        const wave = Math.sin(performance.now() * 0.01 + t * 5 + i) * 15 * t;
        ctx.lineTo(offset + wave, kiteH/2 + t * 60);
      }
      ctx.stroke();
    }
    
    ctx.restore();
    
    // Anchor (player)
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(kite.anchor.x, kite.anchor.y, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.arc(kite.anchor.x, kite.anchor.y - 20, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // UI is handled by HTML overlay
  }
}

// Game Manager
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new Renderer(this.canvas);
    this.input = new InputSystem();
    this.audio = new AudioSystem();
    this.particles = new ParticleSystem();
    this.kite = new Kite();
    this.camera = new Camera();
    this.zones = new ZoneManager();
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('aetherKiteHighScore') || '0');
    this.time = 0;
    this.running = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.dt = 1 / CONSTANTS.PHYSICS_HZ;
    this.debug = false;
    
    this.bindUI();
    this.initAudio();
    this.loop();
  }
  async initAudio() {
    const unlock = async () => {
      await this.audio.unlock();
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('touchstart', unlock);
  }
  bindUI() {
    document.getElementById('highScore').textContent = `BEST: ${this.highScore}`;
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyD' && e.ctrlKey) {
        e.preventDefault();
        this.debug = !this.debug;
        document.getElementById('debugPanel').classList.toggle('hidden', !this.debug);
      }
      if (e.code === 'KeyR') this.reset();
      if (e.code === 'Escape') this.running = !this.running;
    });
    // Prevent space scroll
    window.addEventListener('keydown', e => { if (e.code === 'Space') e.preventDefault(); }, { passive: false });
  }
  reset() {
    this.kite = new Kite();
    this.score = 0;
    this.time = 0;
    this.camera.pos.set(0, 0);
    this.camera.target.set(0, 0);
    this.zones = new ZoneManager();
    this.particles = new ParticleSystem();
    this.running = true;
  }
  updateUI(windInfo) {
    // Wind indicator
    const wind = windInfo.wind;
    const windAngle = Math.atan2(wind.y, wind.x);
    const windSpeed = wind.length();
    document.getElementById('windArrow').style.transform = `rotate(${windAngle}rad)`;
    document.getElementById('windSpeed').textContent = `${windSpeed.toFixed(1)} m/s`;
    
    // Altitude
    const altitude = Math.max(0, Math.round(550 - this.kite.pos.y));
    document.getElementById('altitudeValue').textContent = `${altitude} m`;
    
    // Thermal indicator
    const thermalEl = document.getElementById('thermalIndicator');
    if (this.kite.inThermal) {
      thermalEl.textContent = `THERMAL: ${this.kite.thermalBoost.toFixed(1)} m/s ↑`;
      thermalEl.style.opacity = 1;
    } else {
      thermalEl.style.opacity = 0;
    }
    
    // Tension bar
    const tensionPct = Math.min(100, (this.kite.tension / CONSTANTS.LINE_BREAK_TENSION) * 100);
    const fill = document.getElementById('tensionFill');
    fill.style.width = `${tensionPct}%`;
    fill.style.background = tensionPct < 50 ? PALETTE.lineSafe : tensionPct < 80 ? PALETTE.lineCaution : PALETTE.lineDanger;
    
    // Score & combo
    document.getElementById('scoreValue').textContent = Math.floor(this.score);
    document.getElementById('comboValue').textContent = `x${this.kite.combo}`;
    document.getElementById('comboValue').style.opacity = this.kite.combo > 1 ? 1 : 0.3;
    
    // Timer
    const mins = Math.floor(this.time / 60);
    const secs = (this.time % 60).toFixed(3).padStart(6, '0');
    document.getElementById('timer').textContent = `${mins}:${secs}`;
    
    // Trick prompt
    const prompt = document.getElementById('trickPrompt');
    if (this.kite.turboActive) {
      prompt.textContent = `TURBO ACTIVE! ${this.kite.turboTimer.toFixed(1)}s`;
      prompt.classList.remove('hidden');
    } else if (this.kite.rideBonus > 0.5) {
      prompt.textContent = `Riding thermal... ${(this.kite.rideBonus * 100).toFixed(0)}%`;
      prompt.classList.remove('hidden');
    } else {
      prompt.classList.add('hidden');
    }
    
    // Zone name
    if (windInfo.transition > 0) {
      document.getElementById('windIndicator').childNodes[0].textContent = `TRANSITION: ${WIND_ZONES[windInfo.nextZone].name}`;
    } else {
      document.getElementById('windIndicator').childNodes[0].textContent = `WIND: ${windInfo.zone.name}`;
    }
    
    // Debug panel
    if (this.debug) {
      document.getElementById('debugPanel').innerHTML = `
        Pos: ${this.kite.pos.x.toFixed(1)}, ${this.kite.pos.y.toFixed(1)}<br>
        Vel: ${this.kite.vel.x.toFixed(1)}, ${this.kite.vel.y.toFixed(1)}<br>
        Angle: ${this.kite.angle.toFixed(2)}<br>
        Tension: ${this.kite.tension.toFixed(1)}<br>
        Line: ${this.kite.lineLength.toFixed(1)}<br>
        Zone: ${windInfo.zone.name}<br>
        Combo: ${this.kite.combo}<br>
        Turbo: ${this.kite.turboActive ? 'ON' : 'OFF'}
      `;
    }
  }
  loop(timestamp = 0) {
    const frameTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    
    if (this.running) {
      this.time += frameTime;
      this.accumulator += frameTime;
      
      const input = this.input.getInput();
      const windInfo = this.zones.getWind(this.kite.pos);
      
      // Fixed timestep physics
      let substeps = 0;
      while (this.accumulator >= this.dt && substeps < CONSTANTS.MAX_SUBSTEPS) {
        this.kite.update(this.dt, windInfo.wind, input, WIND_ZONES, this.particles, this.audio);
        this.particles.update(this.dt, windInfo.wind.angle(), windInfo.wind.length(), this.kite.pos.x, this.kite.pos.y);
        this.zones.update(this.kite);
        this.accumulator -= this.dt;
        substeps++;
      }
      
      // Scoring
      const altitude = Math.max(0, 550 - this.kite.pos.y);
      const heightScore = altitude * 0.1;
      const distanceScore = this.kite.distance * 0.05;
      const comboMultiplier = this.kite.combo * (this.kite.turboActive ? CONSTANTS.TURBO_MULTIPLIER : 1);
      this.score = (heightScore + distanceScore) * comboMultiplier;
      
      this.camera.update(this.kite, frameTime);
      this.updateUI(windInfo);
      
      if (this.kite.crashed) {
        this.running = false;
        if (this.score > this.highScore) {
          this.highScore = Math.floor(this.score);
          localStorage.setItem('aetherKiteHighScore', this.highScore.toString());
          document.getElementById('highScore').textContent = `BEST: ${this.highScore}`;
        }
        document.getElementById('trickPrompt').textContent = `CRASHED! Score: ${Math.floor(this.score)} - Press R to restart`;
        document.getElementById('trickPrompt').classList.remove('hidden');
      }
    }
    
    this.renderer.render(this.kite, this.camera, WIND_ZONES, this.particles, this.zones.getWind(this.kite.pos), this.score, this.highScore, this.time, this.kite.combo);
    
    requestAnimationFrame(t => this.loop(t));
  }
}

// Start game
new Game();