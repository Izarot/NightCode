import { Player } from './player.js';
import { Level } from './level.js';
import { Physics } from './physics.js';
import { Input } from './input.js';
import { AudioManager } from './audio.js';
import { HUD } from './hud.js';
import { ParticleSystem } from './particles.js';
import { Hook } from './hook.js';

export class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.player = new Player(100, 500);
    this.level = new Level(1);
    this.physics = new Physics();
    this.input = new Input();
    this.audio = new AudioManager();
    this.hud = new HUD();
    this.particles = new ParticleSystem();
    this.hook = new Hook();
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedDelta = 1 / 60;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
    this.startTime = 0;
    this.running = false;
  }

  start() {
    this.running = true;
    this.startTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(timestamp) {
    if (!this.running) return;
    const delta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    this.accumulator += delta;
    while (this.accumulator >= this.fixedDelta) {
      this.update(this.fixedDelta);
      this.accumulator -= this.fixedDelta;
    }
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.input.update();
    this.player.update(dt, this.input, this.level, this.physics, this.audio, this.particles, this.hook);
    this.hook.update(dt, this.player, this.level, this.physics, this.audio);
    this.level.update(dt);
    this.particles.update(dt);
    this.hud.update(this.player, this.score, this.highScore, this.hook, this.startTime);
    if (this.player.score > this.highScore) {
      this.highScore = this.player.score;
      localStorage.setItem('highScore', this.highScore);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.level.render(ctx);
    this.hook.render(ctx);
    this.particles.render(ctx);
    this.player.render(ctx);
    this.hud.render(ctx);
  }
}
