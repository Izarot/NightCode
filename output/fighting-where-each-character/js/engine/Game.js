import { InputManager } from './Input.js';
import { Physics } from './Physics.js';
import { Collision } from './Collision.js';
import { AudioEngine } from './Audio.js';
import { Camera } from './Camera.js';
import { ParticleSystem } from './ParticleSystem.js';
import { Hud } from '../ui/Hud.js';
import { Menu } from '../ui/Menus.js';
import { StageManager } from '../stages/StageManager.js';
import { Violin } from '../characters/Violin.js';
import { Trumpet } from '../characters/Trumpet.js';
import { Piano } from '../characters/Piano.js';
import { Drums } from '../characters/Drums.js';
import { Flute } from '../characters/Flute.js';
import { Didgeridoo } from '../characters/Didgeridoo.js';
import { CpuController } from '../ai/CpuController.js';

export class Game {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.input = new InputManager();
    this.physics = new Physics();
    this.collision = new Collision();
    this.audio = new AudioEngine();
    this.camera = new Camera();
    this.particles = new ParticleSystem();
    this.hud = new Hud(ctx);
    this.menu = new Menu(ctx, this);
    this.stages = new StageManager();
    this.lastTime = 0;
    this.accumulator = 0;
    this.dt = 1/60;
    this.state = 'MENU';
    this.players = [];
    this.round = 1;
    this.timer = 99;
    this.speedrunStart = 0;
    this.highScore = localStorage.getItem('resonanceHighScore') || 0;
  }

  start() {
    this.speedrunStart = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  setupMatch() {
    const chars = [Violin, Trumpet, Piano, Drums, Flute, Didgeridoo];
    this.players = [
      new chars[0](0, 'P1'),
      new chars[1](0, 'P2')
    ];
    this.players[1].controller = new CpuController(this.players[1], this.players[0], 1); // Normal CPU
    this.stage = this.stages.get('ConcertHall');
    this.timer = 99;
    this.round = 1;
  }

  loop(timestamp) {
    const delta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    this.accumulator += delta;
    while (this.accumulator >= this.dt) {
      this.update(this.dt);
      this.accumulator -= this.dt;
    }
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    if (this.state === 'MENU') {
      this.menu.update(this.input, dt);
      return;
    }
    if (this.state === 'PLAY') {
      this.input.update();
      this.players.forEach(p => p.update(this.input, dt, this.players));
      this.collision.resolve(this.players[0], this.players[1]);
      this.particles.update(dt);
      this.camera.update(this.players);
      this.timer -= dt;
      if (this.timer <= 0 || this.checkWin()) {
        this.endRound();
      }
    }
  }

  checkWin() {
    return this.players[0].hp <= 0 || this.players[1].hp <= 0;
  }

  endRound() {
    const winner = this.players[0].hp > this.players[1].hp ? 0 : 1;
    this.players[winner].roundsWon++;
    if (this.players[winner].roundsWon >= 2) {
      this.state = 'MENU';
      const elapsed = ((performance.now() - this.speedrunStart) / 1000).toFixed(2);
      if (elapsed < this.highScore || this.highScore === 0) {
        this.highScore = elapsed;
        localStorage.setItem('resonanceHighScore', this.highScore);
      }
    } else {
      this.round++;
      this.setupMatch();
    }
  }

  render() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (this.state === 'MENU') {
      this.menu.render();
    } else if (this.state === 'PLAY') {
      this.stage.render(ctx, this.camera);
      this.players.forEach(p => p.render(ctx, this.camera));
      this.particles.render(ctx, this.camera);
      this.hud.render(this.players, this.timer, this.round);
    }
    // Speedrun timer
    const elapsed = ((performance.now() - this.speedrunStart) / 1000).toFixed(2);
    ctx.fillStyle = '#FFD700';
    ctx.font = '16px monospace';
    ctx.fillText('Speedrun: ' + elapsed + 's', 10, 30);
    ctx.fillText('High Score: ' + (this.highScore || '--') + 's', 10, 50);
  }
}
