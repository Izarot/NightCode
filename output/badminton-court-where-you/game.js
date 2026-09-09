class Vector2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vector2(this.x - v.x, this.y - v.y); }
  mul(s) { return new Vector2(this.x * s, this.y * s); }
  mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  normalize() { let m = this.mag(); return m > 0 ? this.mul(1 / m) : new Vector2(); }
}

class Shuttle {
  constructor() {
    this.pos = new Vector2(0, 0);
    this.vel = new Vector2(0, 0);
    this.trail = [];
    this.spin = 0;
  }
  update(dt) {
    this.vel.y += 9.8 * dt;
    let drag = this.vel.mag() * 0.02;
    if (drag > 0) {
      let dir = this.vel.normalize();
      this.vel = this.vel.sub(dir.mul(drag * dt));
    }
    this.pos = this.pos.add(this.vel.mul(dt));
    if (this.trail.length < 10 && Math.random() < 0.5) this.trail.push({ x: this.pos.x, y: this.pos.y });
    if (this.trail.length > 10) this.trail.shift();
  }
  draw(ctx, camera) {
    ctx.save();
    ctx.translate(camera.x + this.pos.x * 40, camera.y - this.pos.y * 40);
    ctx.rotate((this.vel.x * 0.1 + this.spin) * 0.017);
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, -12);
    ctx.lineTo(0, -20);
    ctx.lineTo(-8, -12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e6b800';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 204, 0, 0.4)';
    this.trail.forEach(p => {
      ctx.beginPath();
      ctx.arc(camera.x + p.x * 40, camera.y - p.y * 40, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

class Player {
  constructor(x, y, color) {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(0, 0);
    this.color = color;
    this.width = 32;
    this.height = 48;
    this.facing = 1;
    this.isRunning = false;
    this.frame = 0;
    this.blinkTimer = 0;
  }
  update(dt, input) {
    let speed = 4.5;
    if (input.sprint) speed *= 1.5;
    let acc = 12, dec = 10;
    if (input.left) this.vel.x = -speed;
    else if (input.right) this.vel.x = speed;
    else this.vel.x *= (1 - dec * dt);
    if (input.up) this.vel.y = -speed;
    else if (input.down) this.vel.y = speed;
    else this.vel.y *= (1 - dec * dt);
    this.pos = this.pos.add(this.vel.mul(dt));
    this.pos.x = Math.max(-2, Math.min(2, this.pos.x));
    this.pos.y = Math.max(0, Math.min(1.5, this.pos.y));
    this.isRunning = Math.abs(this.vel.x) > 0.1 || Math.abs(this.vel.y) > 0.1;
    this.facing = this.vel.x >= 0 ? 1 : -1;
    this.blinkTimer += dt;
    if (this.blinkTimer > 2) this.blinkTimer = 0;
    this.frame += dt * 5;
    if (this.frame > 4) this.frame = 0;
  }
  draw(ctx, camera) {
    ctx.save();
    ctx.translate(camera.x + this.pos.x * 40, camera.y - this.pos.y * 40);
    ctx.scale(this.facing, 1);
    ctx.fillStyle = this.color;
    ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
    if (this.blinkTimer > 1.8) {
      ctx.fillStyle = '#000';
      ctx.fillRect(-6, -38, 4, 4);
      ctx.fillRect(2, -38, 4, 4);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(-6, -38, 4, 4);
      ctx.fillRect(2, -38, 4, 4);
    }
    ctx.restore();
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.shuttle = new Shuttle();
    this.player = new Player(-1, 0.5, '#3498db');
    this.ai = new Player(1, 0.5, '#e74c3c');
    this.camera = { x: canvas.width / 2, y: canvas.height / 2 };
    this.input = { left: false, right: false, up: false, down: false, sprint: false, drop: false, smash: false };
    this.keys = {};
    this.lastTime = 0;
    this.accumulator = 0;
    this.dt = 1 / 60;
    this.score = 0;
    this.accuracy = 0;
    this.totalShots = 0;
    this.successfulShots = 0;
    this.timeLeft = 30;
    this.speedrunTime = 0;
    this.powerHold = 0;
    this.powerActive = false;
    this.drill = 'High Clear';
    this.setupEventListeners();
    this.audioCtx = null;
    this.sounds = {};
    this.loadSounds();
    this.loadHighScore();
  }
  setupEventListeners() {
    window.addEventListener('keydown', e => { this.keys[e.code] = true; });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    this.canvas.addEventListener('mousedown', e => { this.handleMouseDown(e); });
    this.canvas.addEventListener('touchstart', e => { this.handleTouchStart(e); });
    this.canvas.addEventListener('touchend', e => { this.handleTouchEnd(e); });
  }
  handleMouseDown(e) {
    if (e.button === 0) this.input.drop = true;
    if (e.button === 2) this.powerActive = true;
  }
  handleTouchStart(e) {
    e.preventDefault();
    let touch = e.touches[0];
    let rect = this.canvas.getBoundingClientRect();
    let x = touch.clientX - rect.left;
    if (x < rect.width / 2) this.input.drop = true;
    else this.powerActive = true;
  }
  handleTouchEnd() { this.input.drop = false; this.powerActive = false; }
  loadSounds() {
    try { this.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { console.warn('Web Audio not supported'); }
  }
  playSound(type, speed = 1) {
    if (!this.audioCtx) return;
    let osc = this.audioCtx.createOscillator();
    let gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    if (type === 'whoosh') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200 + speed * 100, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
    } else if (type === 'tap') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
    } else if (type === 'ding') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.2);
    }
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.3);
  }
  loadHighScore() {
    let saved = localStorage.getItem('badmintonHighScore');
    this.highScore = saved ? parseInt(saved) : 0;
  }
  saveHighScore() {
    localStorage.setItem('badmintonHighScore', this.score.toString());
  }
  updateInput() {
    this.input.left = !!this.keys['KeyA'] || !!this.keys['ArrowLeft'];
    this.input.right = !!this.keys['KeyD'] || !!this.keys['ArrowRight'];
    this.input.up = !!this.keys['KeyW'] || !!this.keys['ArrowUp'];
    this.input.down = !!this.keys['KeyS'] || !!this.keys['ArrowDown'];
    this.input.sprint = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];
    if (this.keys['Space']) {
      if (!this.input.drop) { this.input.drop = true; this.checkSmash(); }
    } else {
      this.input.drop = false;
    }
  }
  checkSmash() {
    let now = Date.now();
    if (now - (this.lastSpacePress || 0) < 300) {
      this.input.smash = true;
      this.lastSpacePress = 0;
    } else {
      this.lastSpacePress = now;
    }
  }
  serve() {
    let speed = 5 + Math.random() * 7;
    let angle = Math.random() * 15 * Math.PI / 180;
    this.shuttle.pos = new Vector2(this.player.pos.x, 0.2);
    this.shuttle.vel = new Vector2(Math.cos(angle) * speed * this.player.facing, Math.sin(angle) * speed);
    this.shuttle.trail = [];
    this.shuttle.spin = 0;
    this.playSound('whoosh', speed);
  }
  hitShuttle() {
    let speed = 8 + Math.random() * 6;
    let angle = (45 + (Math.random() - 0.5) * 20) * Math.PI / 180;
    this.shuttle.vel = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.shuttle.spin = (Math.random() - 0.5) * 60;
    this.playSound('whoosh', speed);
  }
  dropShuttle() {
    let speed = 4 + Math.random() * 3;
    let angle = (15 + (Math.random() - 0.5) * 10) * Math.PI / 180;
    this.shuttle.vel = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.shuttle.spin = (Math.random() - 0.5) * 30;
    this.playSound('whoosh', speed);
  }
  smashShuttle() {
    let speed = 12 + Math.random() * 6;
    let angle = (70 + (Math.random() - 0.5) * 10) * Math.PI / 180;
    this.shuttle.vel = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.shuttle.spin = (Math.random() - 0.5) * 90;
    this.playSound('whoosh', speed);
  }
  update(dt) {
    this.updateInput();
    this.player.update(dt, this.input);
    this.ai.update(dt, { left: false, right: false, up: false, down: false, sprint: false });
    this.shuttle.update(dt);
    if (this.shuttle.pos.y < -0.1 && this.shuttle.vel.y < 0) {
      this.shuttle.pos.y = 0.2;
      this.shuttle.vel.y *= -0.7;
      this.shuttle.vel.x *= 0.9;
      this.playSound('tap');
    }
    if (this.shuttle.pos.y > 1.5) {
      this.shuttle.pos.y = 1.5;
      this.shuttle.vel.y *= -0.5;
      this.shuttle.vel.x *= 0.95;
    }
    if (Math.abs(this.shuttle.pos.x) > 2) {
      this.shuttle.pos.x = Math.sign(this.shuttle.pos.x) * 2;
      this.shuttle.vel.x *= -0.8;
    }
    if (this.shuttle.pos.x < this.player.pos.x + 0.3 && this.shuttle.pos.x > this.player.pos.x - 0.3 &&
        this.shuttle.pos.y < this.player.pos.y + 0.3 && this.shuttle.pos.y > this.player.pos.y - 0.3 &&
        this.shuttle.vel.mag() > 0.5) {
      this.hitShuttle();
      this.totalShots++;
      this.checkAccuracy();
    }
    if (this.shuttle.pos.x < this.ai.pos.x + 0.3 && this.shuttle.pos.x > this.ai.pos.x - 0.3 &&
        this.shuttle.pos.y < this.ai.pos.y + 0.3 && this.shuttle.pos.y > this.ai.pos.y - 0.3 &&
        this.shuttle.vel.mag() > 0.5) {
      this.dropShuttle();
      this.playSound('tap');
    }
    if (this.input.drop) { this.dropShuttle(); this.input.drop = false; this.totalShots++; this.checkAccuracy(); }
    if (this.input.smash) { this.smashShuttle(); this.input.smash = false; this.totalShots++; this.checkAccuracy(); }
    if (this.powerActive) {
      this.powerHold += dt;
      if (this.powerHold > 2) this.powerHold = 2;
      this.updatePowerFill();
    } else if (this.powerHold > 0) {
      let speed = 8 + (this.powerHold / 2) * 6;
      let angle = (45 + (Math.random() - 0.5) * 20) * Math.PI / 180;
      this.shuttle.vel = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
      this.shuttle.spin = (Math.random() - 0.5) * 60;
      this.playSound('whoosh', speed);
      this.totalShots++;
      this.checkAccuracy();
      this.powerHold = 0;
      this.updatePowerFill();
    }
    this.timeLeft -= dt;
    this.speedrunTime += dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endDrill();
    }
  }
  checkAccuracy() {
    let targetAngle = 45;
    let actualAngle = Math.atan2(this.shuttle.vel.y, this.shuttle.vel.x) * 180 / Math.PI;
    let diff = Math.abs(actualAngle - targetAngle);
    if (diff < 10) {
      this.successfulShots++;
      this.score += 10;
      this.playSound('ding');
    } else if (diff < 15) {
      this.score += 5;
    } else {
      this.playSound('tap');
    }
    this.accuracy = this.totalShots > 0 ? Math.round((this.successfulShots / this.totalShots) * 100) : 0;
    this.updateHUD();
  }
  updatePowerFill() {
    let fill = document.getElementById('powerFill');
    let pct = (this.powerHold / 2) * 100;
    fill.style.width = pct + '%';
    let hue = (1 - pct / 100) * 120;
    fill.style.background = `hsl(${hue}, 100%, 50%)`;
  }
  updateHUD() {
    document.getElementById('score').textContent = `Score: ${this.score} / Accuracy: ${this.accuracy}%`;
    document.getElementById('timer').textContent = `Time: ${Math.floor(this.timeLeft / 60).toString().padStart(2, '0')}:${Math.floor(this.timeLeft % 60).toString().padStart(2, '0')}`;
    document.getElementById('speedrun').textContent = `Speedrun: ${Math.floor(this.speedrunTime / 60).toString().padStart(2, '0')}:${(this.speedrunTime % 60).toFixed(2).padStart(5, '0')}`;
    let wheel = document.getElementById('progressWheel');
    wheel.style.borderTopColor = this.accuracy > 80 ? '#4caf50' : this.accuracy > 50 ? '#ff9800' : '#f44336';
  }
  endDrill() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
    alert(`Drill Complete!\nScore: ${this.score}\nAccuracy: ${this.accuracy}%\nHigh Score: ${this.highScore}`);
    this.score = 0;
    this.totalShots = 0;
    this.successfulShots = 0;
    this.accuracy = 0;
    this.timeLeft = 30;
    this.speedrunTime = 0;
    this.serve();
  }
  drawCourt(ctx) {
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(-2.5, -0.5, 5, 3);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.02;
    ctx.beginPath();
    ctx.rect(-2, 0, 4, 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2, 0.75); ctx.lineTo(2, 0.75);
    ctx.stroke();
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(-0.1, 0.2, 0.2, 0.02);
  }
  render() {
    let ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.translate(this.camera.x, this.camera.y);
    ctx.scale(40, -40);
    this.drawCourt(ctx);
    this.shuttle.draw(ctx, { x: 0, y: 0 });
    this.player.draw(ctx, { x: 0, y: 0 });
    this.ai.draw(ctx, { x: 0, y: 0 });
    ctx.restore();
  }
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    let frameTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    this.accumulator += frameTime / 1000;
    while (this.accumulator >= this.dt) {
      this.update(this.dt);
      this.accumulator -= this.dt;
    }
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }
  start() {
    this.serve();
    this.updateHUD();
    document.getElementById('instructions').style.display = 'block';
    requestAnimationFrame(this.loop.bind(this));
  }
}

function toggleInstructions() {
  document.getElementById('instructions').style.display = 'none';
}

window.addEventListener('load', () => {
  let canvas = document.getElementById('gameCanvas');
  let game = new Game(canvas);
  game.start();
});
