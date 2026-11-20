import { CONFIG, GAME_STATES, DIRECTIONS } from '../config.js';
import { Snake } from './snake.js';
import { SlimeGrid } from './slimeGrid.js';
import { Renderer } from './renderer.js';
import { InputManager } from './input.js';
import { audio } from './audio.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.slimeGrid = new SlimeGrid();
    this.snake = new Snake();
    this.food = null;
    this.state = GAME_STATES.MENU;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('slimeSerpentHighScore') || '0', 10);
    this.survivalTime = 0;
    this.gameStartTime = 0;
    this.lastTick = 0;
    this.accumulator = 0;
    this.currentTickMs = CONFIG.INITIAL_TICK_MS;
    this.animationId = null;
    this.lastFrameTime = 0;

    this.bindUI();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  bindUI() {
    this.startBtn = document.getElementById('start-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.menuScreen = document.getElementById('menu-screen');
    this.gameOverScreen = document.getElementById('gameover-screen');
    this.pauseOverlay = document.getElementById('pause-overlay');

    this.startBtn.addEventListener('click', () => this.start());
    this.restartBtn.addEventListener('click', () => this.start());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.state === GAME_STATES.PLAYING) this.pause();
        else if (this.state === GAME_STATES.PAUSED) this.resume();
      }
    });
  }

  resize() {
    const container = document.getElementById('game-container');
    const size = Math.min(container.clientWidth, container.clientHeight);
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.renderer.resize(size, size);
  }

  start() {
    this.state = GAME_STATES.PLAYING;
    this.score = 0;
    this.survivalTime = 0;
    this.gameStartTime = performance.now();
    this.currentTickMs = CONFIG.INITIAL_TICK_MS;
    this.accumulator = 0;
    this.lastTick = performance.now();

    this.snake.reset();
    this.slimeGrid.clear();
    this.renderer.particles = [];
    this.spawnFood();

    this.menuScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.pauseOverlay.classList.add('hidden');

    audio.resume();
    this.loop();
  }

  pause() {
    if (this.state !== GAME_STATES.PLAYING) return;
    this.state = GAME_STATES.PAUSED;
    this.pauseOverlay.classList.remove('hidden');
    cancelAnimationFrame(this.animationId);
  }

  resume() {
    if (this.state !== GAME_STATES.PAUSED) return;
    this.state = GAME_STATES.PLAYING;
    this.pauseOverlay.classList.add('hidden');
    this.lastTick = performance.now();
    this.loop();
  }

  gameOver() {
    this.state = GAME_STATES.GAMEOVER;
    cancelAnimationFrame(this.animationId);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('slimeSerpentHighScore', this.highScore.toString());
    }

    document.getElementById('final-score').textContent = this.score;
    document.getElementById('final-time').textContent = this.formatTime(this.survivalTime);
    document.getElementById('final-length').textContent = this.snake.getLength();
    document.getElementById('high-score').textContent = this.highScore;

    this.gameOverScreen.classList.remove('hidden');
    audio.sfxDeath();
  }

  spawnFood() {
    const emptyCells = [];
    for (let x = 0; x < CONFIG.GRID_SIZE; x++) {
      for (let y = 0; y < CONFIG.GRID_SIZE; y++) {
        const occupied = this.snake.getSegments().some(s => s.x === x && s.y === y);
        if (!occupied && !this.slimeGrid.has(x, y)) {
          emptyCells.push({ x, y });
        }
      }
    }
    if (emptyCells.length > 0) {
      this.food = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    } else {
      this.food = null;
    }
  }

  loop(timestamp = 0) {
    if (this.state !== GAME_STATES.PLAYING) return;

    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // Update survival time
    this.survivalTime = timestamp - this.gameStartTime;

    // Fixed timestep accumulator
    this.accumulator += deltaTime;
    let interpolation = 0;

    while (this.accumulator >= this.currentTickMs) {
      this.tick(this.currentTickMs);
      this.accumulator -= this.currentTickMs;
    }

    interpolation = this.accumulator / this.currentTickMs;

    // Render
    this.renderer.render(this.state, this.snake, this.food, this.slimeGrid, interpolation, deltaTime);
    this.updateHUD();

    this.animationId = requestAnimationFrame((ts) => this.loop(ts));
  }

  tick(tickMs) {
    // Poll input
    const { action, pendingDir } = this.input.poll();
    if (pendingDir) {
      this.snake.setDirection(pendingDir);
      this.input.setCurrentDir(pendingDir);
      audio.sfxMove();
    }

    // Boost activation
    if (action && this.snake.useBoost()) {
      audio.sfxBoost();
    }

    // Update snake
    const result = this.snake.update(this.food, this.slimeGrid, tickMs, tickMs);

    if (result.died) {
      this.gameOver();
      return;
    }

    if (result.ateFood) {
      this.score += 10;
      audio.sfxEat();
      this.spawnFood();
      // Increase speed
      this.currentTickMs = Math.max(CONFIG.MIN_TICK_MS, this.currentTickMs - CONFIG.TICK_DECREASE_MS);
    }

    if (result.slipOccurred) {
      audio.sfxSlip();
    }

    // Mark snake trail as fresh slime
    const head = this.snake.getHead();
    this.slimeGrid.set(head.x, head.y, 'fresh');
    // Also mark body segments
    this.snake.getSegments().forEach(seg => {
      this.slimeGrid.set(seg.x, seg.y, 'fresh');
    });

    // Boost leaves extra slime
    if (this.snake.isBoostActive()) {
      const segments = this.snake.getSegments();
      for (let i = 0; i < Math.min(3, segments.length); i++) {
        this.slimeGrid.set(segments[i].x, segments[i].y, 'fresh');
      }
    }

    // Update slime grid
    this.slimeGrid.update(tickMs, this.renderer);
    this.snake.clearOldSplats(500);
  }

  render(state, snake, food, slimeGrid, interpolation, deltaTime) {
    this.renderer.render(state, snake, food, slimeGrid, interpolation, deltaTime);
  }

  updateHUD() {
    document.getElementById('score-value').textContent = this.score;
    document.getElementById('time-value').textContent = this.formatTime(this.survivalTime);
    document.getElementById('length-value').textContent = this.snake.getLength();

    const viscosityRatio = this.snake.getViscosityRatio();
    const fill = document.getElementById('viscosity-fill');
    const meter = document.getElementById('viscosity-meter');
    const boostReady = document.getElementById('boost-ready');

    fill.style.width = `${viscosityRatio * 100}%`;
    
    if (this.snake.isBoostReady()) {
      meter.classList.add('full');
      boostReady.classList.remove('hidden');
    } else {
      meter.classList.remove('full');
      boostReady.classList.add('hidden');
    }

    const speedIndicator = document.getElementById('speed-indicator');
    const speedPercent = Math.round((1 - (this.currentTickMs - CONFIG.MIN_TICK_MS) / (CONFIG.INITIAL_TICK_MS - CONFIG.MIN_TICK_MS)) * 100);
    speedIndicator.textContent = `SPEED: ${speedPercent}%`;
  }

  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}