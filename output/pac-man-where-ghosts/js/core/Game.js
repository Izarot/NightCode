import { InputHandler } from './InputHandler.js';
import { Physics } from './Physics.js';
import { Renderer } from '../systems/Renderer.js';
import { HUD } from '../systems/HUD.js';
import { LevelManager } from '../systems/LevelManager.js';
import { AudioManager } from '../utils/AudioManager.js';
import { HighScore } from '../utils/HighScore.js';

export class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.input = new InputHandler();
    this.physics = new Physics();
    this.renderer = new Renderer(ctx);
    this.hud = new HUD(ctx);
    this.levelManager = new LevelManager();
    this.audio = new AudioManager();
    this.highScore = new HighScore();
    this.running = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedStep = 1 / 60;
    this.score = 0;
    this.lives = 3;
    this.timer = 180;
    this.speedrunStart = 0;
    this.speedrunTime = 0;
  }

  start() {
    this.running = true;
    this.speedrunStart = performance.now();
    this.levelManager.loadLevel(1);
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(timestamp) {
    if (!this.running) return;
    const delta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    this.accumulator += delta;
    while (this.accumulator >= this.fixedStep) {
      this.update(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    this.input.update();
    this.physics.update(dt);
    this.levelManager.update(dt);
    this.timer -= dt;
    this.speedrunTime = (performance.now() - this.speedrunStart) / 1000;
    if (this.timer <= 0 || this.lives <= 0) {
      this.running = false;
      this.audio.play('gameover');
      this.highScore.save(this.score);
      document.getElementById('game-over').style.display = 'block';
    }
  }

  render() {
    this.renderer.render(this.levelManager, this.physics, this.input);
    this.hud.render(this.score, this.timer, this.lives, this.speedrunTime);
  }
}
