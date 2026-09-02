import { Input } from './input.js';
import { Level } from './level.js';
import { Player } from './player.js';
import { Sentry } from './sentry.js';
import { UI } from './ui.js';
import { AudioManager } from './audio.js';
import { levels } from '../assets/levels.js';

const STATE = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE'
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input();
    this.audio = new AudioManager();
    this.ui = new UI(this.ctx, canvas);
    this.state = STATE.MENU;
    this.currentLevelIndex = 0;
    this.level = null;
    this.player = null;
    this.sentries = [];
    this.timer = 0;
    this.lastTime = 0;
    this.accumulator = 0;
    this.timestep = 1 / 60;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.highScore = parseInt(localStorage.getItem('predator_highscore') || '0', 10);
    this.menuSelection = 0;
    this.transitionAlpha = 0;
    this.cameraShake = 0;
    this.cameraShakeX = 0;
    this.cameraShakeY = 0;
    this.responsiveScale = 1;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const scaleX = rect.width / 960;
    const scaleY = rect.height / 540;
    this.responsiveScale = Math.min(scaleX, scaleY) * 0.95;
    this.canvas.style.width = (960 * this.responsiveScale) + 'px';
    this.canvas.style.height = (540 * this.responsiveScale) + 'px';
  }

  start() {
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(timestamp) {
    const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;
    this.accumulator += deltaTime;
    while (this.accumulator >= this.timestep) {
      this.update(this.timestep);
      this.accumulator -= this.timestep;
    }
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.state === STATE.PLAYING) {
      this.elapsedTime += dt;
      this.player.update(dt, this.input, this.level);
      this.sentries.forEach(s => s.update(dt));
      this.checkCollisions();
      this.cameraShake *= 0.9;
      this.cameraShakeX = (Math.random() - 0.5) * this.cameraShake;
      this.cameraShakeY = (Math.random() - 0.5) * this.cameraShake;
      if (this.player.dead) {
        this.audio.playDetection();
        this.state = STATE.GAME_OVER;
        this.transitionAlpha = 0;
      }
      if (this.level.isAtExit(this.player.pos)) {
        this.audio.playLevelComplete();
        if (this.currentLevelIndex >= levels.length - 1) {
          const finalTime = this.elapsedTime;
          if (this.highScore === 0 || finalTime < this.highScore) {
            this.highScore = finalTime;
            localStorage.setItem('predator_highscore', Math.floor(finalTime).toString());
          }
        }
        this.state = STATE.LEVEL_COMPLETE;
        this.transitionAlpha = 0;
      }
    } else if (this.state === STATE.MENU) {
      if (this.input.isPressed('Enter') || this.input.isPressed(' ')) {
        this.startLevel(this.currentLevelIndex);
      }
    } else if (this.state === STATE.GAME_OVER || this.state === STATE.LEVEL_COMPLETE) {
      this.transitionAlpha = Math.min(1, this.transitionAlpha + dt * 2);
      if (this.transitionAlpha >= 1 && (this.input.isPressed('Enter') || this.input.isPressed(' '))) {
        if (this.state === STATE.GAME_OVER) {
          this.startLevel(this.currentLevelIndex);
        } else if (this.state === STATE.LEVEL_COMPLETE) {
          if (this.currentLevelIndex < levels.length - 1) {
            this.startLevel(this.currentLevelIndex + 1);
          } else {
            this.state = STATE.MENU;
          }
        }
      }
    }
    this.input.endFrame();
  }

  startLevel(index) {
    this.currentLevelIndex = index;
    this.level = new Level(levels[index]);
    this.player = new Player(this.level.startPos);
    this.sentries = this.level.sentries.map(s => new Sentry(s));
    this.elapsedTime = 0;
    this.state = STATE.PLAYING;
    this.transitionAlpha = 0;
    this.cameraShake = 0;
  }

  checkCollisions() {
    this.sentries.forEach(s => {
      const detected = s.detects(this.player);
      if (detected) {
        this.cameraShake = 6;
        this.player.takeHit();
      }
    });
  }

  render() {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, 960, 540);

    if (this.state === STATE.PLAYING || this.state === STATE.GAME_OVER || this.state === STATE.LEVEL_COMPLETE) {
      ctx.translate(this.cameraShakeX, this.cameraShakeY);
      this.level.render(ctx);
      this.sentries.forEach(s => s.render(ctx));
      this.player.render(ctx);
      this.ui.renderHUD(this);
      if (this.state === STATE.GAME_OVER || this.state === STATE.LEVEL_COMPLETE) {
        this.ui.renderOverlay(this);
      }
    } else if (this.state === STATE.MENU) {
      this.ui.renderMenu(this);
    }
    ctx.restore();
  }
}
