import { Game } from './src/Game.js';
import { Renderer } from './src/Renderer.js';
import { Input } from './src/Input.js';
import { AudioManager } from './src/Audio.js';
import { LevelManager } from './src/LevelManager.js';

class SpotTheDifference {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.renderer = new Renderer(this.ctx, this.canvas);
    this.audio = new AudioManager();
    this.levelManager = new LevelManager();
    this.input = new Input(this.renderer, this.audio, this.levelManager);
    this.game = new Game(this.renderer, this.input, this.audio, this.levelManager);
    this.init();
  }

  init() {
    this.setupResponsiveCanvas();
    this.bindEvents();
    this.game.start();
  }

  setupResponsiveCanvas() {
    const resize = () => {
      const container = document.getElementById('gameContainer');
      const maxWidth = 1200;
      const maxHeight = 700;
      const scale = Math.min(window.innerWidth / maxWidth, window.innerHeight / maxHeight, 1);
      this.canvas.width = maxWidth * scale;
      this.canvas.height = maxHeight * scale;
      this.canvas.style.transform = `scale(${scale})`;
      this.canvas.style.transformOrigin = 'top left';
    };
    window.addEventListener('resize', resize);
    resize();
  }

  bindEvents() {
    document.getElementById('startBtn').addEventListener('click', () => {
      const diff = document.querySelector('.difficulty-btn.active')?.dataset.diff || 'edium';
      this.game.startLevel(1, diff);
      document.getElementById('startScreen').classList.remove('active');
    });
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    document.getElementById('hintBtn').addEventListener('click', () => this.game.useHint());
    document.getElementById('soundBtn').addEventListener('click', () => this.audio.toggle());
    document.getElementById('nextBtn').addEventListener('click', () => {
      this.game.nextLevel();
      document.getElementById('completeScreen').classList.remove('active');
    });
  }
}

window.addEventListener('load', () => new SpotTheDifference());