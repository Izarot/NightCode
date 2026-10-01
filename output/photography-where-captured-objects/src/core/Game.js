import { Avatar } from '../entities/Avatar.js';
import { PhotoObject } from '../entities/PhotoObject.js';
import { Viewfinder } from '../entities/Viewfinder.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { SpawningSystem } from '../systems/SpawningSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { UIManager } from '../systems/UIManager.js';
import { Timer } from '../utils/Timer.js';

export class Game {
  constructor(canvas, ctx, input, audio, storage) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.input = input;
    this.audio = audio;
    this.storage = storage;
    this.state = 'menu';
    this.lastTime = 0;
    this.accumulator = 0;
    this.DT = 1 / 60;

    this.avatar = new Avatar(400, 300);
    this.viewfinder = new Viewfinder(400, 300);
    this.objects = [];
    this.physics = new PhysicsSystem();
    this.spawner = new SpawningSystem();
    this.collision = new CollisionSystem();
    this.ui = new UIManager(ctx, storage);
    this.timer = new Timer(60); // 60 seconds

    this.score = 0;
    this.combo = 0;
    this.shotsRemaining = 20;
    this.shutterCooldown = 0;
    this.flashAlpha = 0;
    this.speedrunTime = 0;
    this.highScore = storage.getHighScore();

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.input.onShutter(() => {
      if (this.state === 'playing' && this.shutterCooldown <= 0 && this.shotsRemaining > 0) {
        this.takeSnapshot();
      }
    });
  }

  start() {
    this.state = 'playing';
    this.score = 0;
    this.combo = 0;
    this.shotsRemaining = 20;
    this.shutterCooldown = 0;
    this.objects = [];
    this.timer.reset(60);
    this.speedrunTime = 0;
    this.avatar.x = 400;
    this.avatar.y = 300;
    this.avatar.vx = 0;
    this.avatar.vy = 0;
    this.audio.playMusic();
  }

  pause() {
    this.state = 'paused';
    this.audio.pauseMusic();
  }

  resume() {
    this.state = 'playing';
    this.audio.playMusic();
  }

  takeSnapshot() {
    this.shutterCooldown = 0.5;
    this.shotsRemaining--;
    this.audio.playShutter();
    this.flashAlpha = 0.3;

    const captured = this.collision.checkCapture(this.avatar, this.viewfinder, this.objects);
    if (captured.length > 0) {
      this.audio.playCapture();
      captured.forEach(obj => {
        obj.captured = true;
        this.score += Math.round(obj.points * (1 + this.combo / 10));
        this.combo++;
        this.ui.showFloatingText(obj.x, obj.y, `+${Math.round(obj.points * (1 + this.combo / 10))}`);
      });
      this.spawner.removeCaptured(captured);
    } else {
      this.audio.playMiss();
      this.combo = 0;
    }

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.storage.saveHighScore(this.highScore);
    }
  }

  update(deltaTime) {
    if (this.state !== 'playing') return;

    const dt = this.DT;
    this.accumulator += deltaTime;
    this.speedrunTime += deltaTime;

    while (this.accumulator >= dt) {
      this.updateFixed(dt);
      this.accumulator -= dt;
    }
  }

  updateFixed(dt) {
    this.input.update();
    this.physics.update(this.avatar, this.input, dt);
    this.viewfinder.update(this.avatar, this.input, dt);
    this.spawner.update(dt, this.objects, this.avatar);
    this.collision.update(dt);
    this.timer.update(dt);
    this.ui.update(dt);

    if (this.shutterCooldown > 0) {
      this.shutterCooldown -= dt;
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha -= dt * 10;
    }

    this.objects.forEach(obj => obj.update(dt));

    if (this.timer.isFinished() || this.shotsRemaining <= 0) {
      this.endGame();
    }
  }

  endGame() {
    this.state = 'gameover';
    this.audio.stopMusic();
    document.getElementById('end-screen').style.display = 'flex';
    document.getElementById('final-score').textContent = `Score: ${this.score}`;
    document.getElementById('high-score').textContent = `High Score: ${this.highScore}`;
    document.getElementById('time-survived').textContent = `Time: ${Math.floor(this.speedrunTime)}s`;
    document.getElementById('shutter-btn').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'none';
    document.getElementById('settings-btn').style.display = 'none';
  }

  render() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    // Clear
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw objects
    this.objects.forEach(obj => obj.render(ctx));

    // Draw avatar
    this.avatar.render(ctx);

    // Draw viewfinder
    this.viewfinder.render(ctx);

    // Draw HUD
    this.ui.render(this.score, this.timer.getTimeString(), this.shotsRemaining, this.combo, this.speedrunTime);

    // Draw flash
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flashAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }
  }
}
