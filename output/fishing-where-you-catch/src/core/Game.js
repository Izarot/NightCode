import { Input } from './Input.js';
import { Physics } from './Physics.js';
import { Renderer } from './Renderer.js';
import { AssetLoader } from './AssetLoader.js';
import { StateMachine } from './StateMachine.js';
import { AudioManager } from '../systems/Audio.js';
import { Persistence } from '../systems/Persistence.js';
import { LevelManager } from '../systems/Level.js';
import { UIManager } from '../ui/HUD.js';
import { Ship } from '../entities/Ship.js';
import { Garbage } from '../entities/Garbage.js';
import { Line } from '../entities/Line.js';
import { Particle } from '../entities/Particle.js';

export class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.input = new Input();
    this.physics = new Physics();
    this.renderer = new Renderer(ctx);
    this.assets = new AssetLoader();
    this.state = new StateMachine();
    this.audio = new AudioManager();
    this.persist = new Persistence();
    this.levels = new LevelManager();
    this.ui = new UIManager(ctx);
    this.ship = new Ship(640, 360);
    this.garbage = [];
    this.line = new Line();
    this.particles = [];
    this.oceanHealth = 0;
    this.score = 0;
    this.highScore = this.persist.getHighScore();
    this.timer = 180; // 3 minutes
    this.speedrunStart = null;
    this.speedrunTime = 0;
    this.init();
  }

  init() {
    this.spawnGarbage(10);
    this.speedrunStart = performance.now();
  }

  spawnGarbage(count) {
    for (let i = 0; i < count; i++) {
      this.garbage.push(new Garbage(Math.random() * 1280, Math.random() * 720));
    }
  }

  update() {
    const dt = 1/60;
    this.input.update();
    this.ship.update(this.input, dt);
    this.line.update(this.ship, this.input, dt);
    this.garbage.forEach(g => g.update(dt));
    this.particles.forEach((p, i) => {
      p.update(dt);
      if (p.life <= 0) this.particles.splice(i, 1);
    });
    if (this.line.caught && this.line.caught.type) {
      const g = this.line.caught;
      this.score += g.points;
      this.oceanHealth += g.healthContribution;
      this.audio.playCollect(g.type);
      this.particles.push(new Particle(g.x, g.y, g.type));
      this.line.reset();
      const idx = this.garbage.indexOf(g);
      if (idx >= 0) this.garbage.splice(idx, 1);
      this.spawnGarbage(1);
    }
    this.timer -= dt;
    if (this.timer <= 0 || this.oceanHealth >= 100) {
      this.endLevel();
    }
    this.speedrunTime = (performance.now() - this.speedrunStart) / 1000;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.persist.saveHighScore(this.highScore);
    }
  }

  endLevel() {
    this.persist.saveHighScore(this.highScore);
    this.persist.saveScore(this.score);
    this.state.change('levelComplete');
  }

  render() {
    this.renderer.clear(this.ctx);
    this.renderer.drawBackground(this.ctx);
    this.renderer.drawParallax(this.ctx, this.ship.x, this.ship.y);
    this.ship.render(this.ctx);
    this.garbage.forEach(g => g.render(this.ctx));
    this.line.render(this.ctx);
    this.particles.forEach(p => p.render(this.ctx));
    this.ui.render(this.ctx, {
      oceanHealth: this.oceanHealth,
      score: this.score,
      highScore: this.highScore,
      timer: this.timer,
      speedrunTime: this.speedrunTime,
      ship: this.ship
    });
  }
}
