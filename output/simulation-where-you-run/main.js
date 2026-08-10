const dpr = window.devicePixelRatio || 1;
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1280 * dpr;
canvas.height = 720 * dpr;
ctx.scale(dpr, dpr);

const ACCEL_CONST = 400;
const FRICTION_CONST = 8;
const MAX_SPEED = 200;
const BASE_TIME = { SM: 8, MD: 12, LG: 16 };
const TOPPING_MODIFIERS = { Pepperoni: 0.10, Pineapple: 0.25, Jalapeno: 0.05, ExtraCheese: 0.15 };
const COIN_REWARD = { SM: 10, MD: 15, LG: 20 };
const HIGH_SCORE_KEY = 'pizzaRushHighScore';

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(frequency, duration) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'ine';
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.2;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  oscillator.stop(audioCtx.currentTime + duration);
}

function rand(min, max) { return Math.random() * (max - min) + min; }

class PlayerAvatar {
  constructor() {
    this.x = 640;
    this.y = 360;
    this.vx = 0;
    this.vy = 0;
    this.w = 40;
    this.h = 40;
    this.state = 'idle';
    this.acceleration = 0;
  }
  update(dt) {
    this.vx += this.acceleration * dt;
    this.vy += this.acceleration * dt;
    this.vx *= (1 - FRICTION_CONST * dt);
    this.vy *= (1 - FRICTION_CONST * dt);
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > MAX_SPEED) {
      const factor = MAX_SPEED / speed;
      this.vx *= factor;
      this.vy *= factor;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
  draw(ctx) {
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(this.x - this.w/2, this.y - this.h/2, this.w, this.h);
  }
}

class Customer {
  constructor(order) {
    this.order = order;
    this.patience = 30;
    this.timer = 0;
    this.state = 'waiting';
    this.x = rand(100, canvas.width / dpr - 100);
    this.y = rand(100, canvas.height / dpr - 100);
    this.pizza = null;
  }
  update(dt) {
    if (this.state === 'waiting') {
      this.timer += dt;
      if (this.timer >= this.patience) this.state = 'leaving';
    } else if (this.state === 'leaving') {
      this.x += 100 * dt;
    }
  }
  draw(ctx) {
    ctx.fillStyle = this.state === 'leaving'? '#f00' : '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 15, 0, Math.PI*2);
    ctx.fill();
  }
}

class Pizza {
  constructor(size, sauce, cheese, toppings) {
    this.size = size;
    this.sauce = sauce;
    this.cheese = cheese;
    this.toppings = [...toppings];
    this.state = 'prepping';
    this.cookProgress = 0;
    this.cookTime = BASE_TIME[size];
    this.x = 0;
    this.y = 0;
  }
  update(dt) {
    if (this.state === 'cooking') {
      this.cookProgress += dt / this.cookTime;
      if (this.cookProgress >= 1) this.state = 'eady';
    }
  }
  draw(ctx) {
    ctx.fillStyle = this.state === 'eady'? '#ffcc00' : '#bbb';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 30, 0, Math.PI*2);
    ctx.fill();
  }
}

class Station {
  constructor(x, y, type, w=100, h=50) {
    this.x = x; this.y = y; this.type = type; this.w = w; this.h = h;
  }
  draw(ctx) {
    ctx.fillStyle = this.type === 'prep'? '#8b4513' : '#556b2f';
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class Game {
  constructor() {
    this.lastTime = 0;
    this.running = false;
    this.player = null;
    this.customers = [];
    this.pizzas = [];
    this.stations = [];
    this.coins = 0;
    this.day = 1;
    this.highScore = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || 0);
    this.speedrunStart = performance.now();
    this.paused = false;
    this.selectedTopping = null;
    this.stations.push(new Station(200, 300, 'prep'));
    this.stations.push(new Station(600, 300, 'oven', 120, 80));
  }
  init() {
    this.player = new PlayerAvatar();
    this.running = true;
    requestAnimationFrame(this.loop.bind(this));
  }
  loop(timestamp) {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    if (this.running &&!this.paused) this.update(dt);
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }
  update(dt) {
    this.handleInput(dt);
    this.player.update(dt);
    this.customers.forEach(c => c.update(dt));
    this.pizzas.forEach(p => p.update(dt));
    if (Math.random() < 0.005) this.customers.push(new Customer({size: 'MD', sauce: 'Tomato', cheese: 'Extra', toppings: []}));
  }
  handleInput(dt) {
    const keys = {};
    const onKeyDown = (e) => keys[e.key] = true;
    const onKeyUp = (e) => keys[e.key] = false;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    let dx = 0, dy = 0;
    if (keys['ArrowUp'] || keys['w']) dy -= 1;
    if (keys['ArrowDown'] || keys['s']) dy += 1;
    if (keys['ArrowLeft'] || keys['a']) dx -= 1;
    if (keys['ArrowRight'] || keys['d']) dx += 1;
    
    const len = Math.hypot(dx, dy);
    if (len > 0) {
      this.player.acceleration = (dx/len * ACCEL_CONST) + (dy/len * ACCEL_CONST);
    } else {
      this.player.acceleration = 0;
    }
  }
  render() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#222';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    this.stations.forEach(s => s.draw(ctx));
    this.player.draw(ctx);
    this.customers.forEach(c => c.draw(ctx));
    this.pizzas.forEach(p => p.draw(ctx));
    this.drawHUD();
  }
  drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Day ${this.day}`, 20, 30);
    ctx.fillText(`Coins: ${this.coins}`, 20, 60);
    const elapsed = (performance.now() - this.speedrunStart) / 1000;
    ctx.fillText(`Time: ${elapsed.toFixed(1)}s`, canvas.width/dpr - 150, 30);
  }
}

const game = new Game();
window.addEventListener('load', () => game.init());