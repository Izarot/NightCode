import { Car } from './car.js';
import { Gear } from './gear.js';
import { ParticleSystem } from './particle.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { loadImages, loadAudio, saveHighScore, loadHighScore } from './utils.js';
import { tilemap } from './level.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.car = new Car(this.canvas);
    this.gears = [];
    this.particles = new ParticleSystem();
    this.input = new Input();
    this.ui = new UI(this.ctx);
    this.lastTime = 0;
    this.isRunning = false;
    this.paused = false;
    this.highScore = parseFloat(loadHighScore()) || 0;
    this.lapComplete = false;
    this.startTime = 0;
  }

  init() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.ctx.scale(dpr, dpr);
    const imgSources = {
      car: 'assets/car.png',
      gear: 'assets/gear.png',
      track: 'assets/track.png'
    };
    const audioSources = {
      engine: 'assets/engine.wav',
      gear: 'assets/gear.wav',
      brake: 'assets/brake.wav',
      collision: 'assets/collision.wav',
      lap: 'assets/lap.wav'
    };
    Promise.all([loadImages(imgSources), loadAudio(audioSources)])
      .then(([images, audioData]) => {
        this.images = images;
        this.audio = audioData;
        this.audio.load(audioSources);
        this.startGame();
      })
      .catch(err => console.error(err));
  }

  startGame() {
    this.isRunning = true;
    this.paused = false;
    this.lapComplete = false;
    this.car = new Car(this.canvas);
    this.gears = [];
    this.particles = new ParticleSystem();
    this.ui = new UI(this.ctx);
    this.ui.lapTime = 0;
    this.highScore = parseFloat(loadHighScore()) || 0;
    this.startTime = performance.now();
    this.updateLoop();
  }

  updateLoop(timestamp) {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    if (this.isRunning && !this.paused) {
      this.update(dt);
      this.render();
    }
    requestAnimationFrame(this.updateLoop.bind(this));
  }

  update(dt) {
    this.ui.update(dt);
    this.car.update(this.input, dt);
    for (let i = this.gears.length - 1; i >= 0; i--) {
      const gear = this.gears[i];
      if (gear.isColliding(this.car.pos, this.car.width / 2)) {
        this.gears.splice(i, 1);
        this.ui.setGearCount(this.ui.gears + 1);
        this.car.maxSpeed += gear.speedBonus;
        this.audio.play('gear');
        this.particles.emit(5, this.car.pos.x, this.car.pos.y);
      }
    }
    if (
      this.car.pos.x < 0 ||
      this.car.pos.x > this.canvas.width ||
      this.car.pos.y < 0 ||
      this.car.pos.y > this.canvas.height
    ) {
      this.isRunning = false;
      this.endLap();
    }
    const speed = Math.hypot(this.car.vel.x, this.car.vel.y);
    this.ui.setSpeed(speed);
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, '#0a0a2a');
    gradient.addColorStop(1, '#111');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = '#555';
    this.ctx.fillRect(0, this.height - 20, this.width, 20);
    this.car.render(this.ctx);
    this.gears.forEach(g => g.render(this.ctx));
    this.particles.update(dt);
    this.particles.draw(this.ctx);
    this.ui.draw();
    if (this.paused) {
      this.ctx.fillStyle = 'rgba(0,0,0,0.6)';
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.width / 2, this.height / 2 - 20);
    }
  }

  endLap() {
    const lapTime = this.ui.lapTime;
    this.lapComplete = true;
    if (lapTime < this.highScore) {
      this.highScore = lapTime;
      saveHighScore(this.highScore);
      this.ui.setHighScore(this.highScore);
    }
    this.ui.togglePause(true);
    const resumeBtn = document.getElementById('resumeBtn');
    const restartBtn = document.getElementById('restartBtn');
    resumeBtn.onclick = () => {
      this.paused = false;
      this.ui.togglePause(false);
    };
    restartBtn.onclick = () => {
      this.startGame();
    };
  }
}