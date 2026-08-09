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
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.2;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  oscillator.stop(audioCtx.currentTime + duration);
}

function rand(min, max) { return Math.random() * (max - min) + min; }

function randElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

class PlayerAvatar {
  constructor() {
    this.x = 640;
    this.y = 360;
    this.vx = 0;
    this.vy = 0;
    this.w = 40;
    this.h = 40;
    this.state = 'idle';
    this.direction = 'down';
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
  constructor(order, stations) {
    this.order = order;
    this.patience = 30 + order.size * 5 - order.toppings.length * 2;
    this.timer = 0;
    this.state = 'waiting';
    this.target = null;
    this.satisfaction = 0;
    this.x = rand(100, canvas.width - 100);
    this.y = rand(100, canvas.height - 100);
    this.stations = stations;
    this.pizza = null;
  }
  update(dt) {
    if (this.state === 'waiting') {
      const target = this.stations.find(s => s.type === 'prep');
      if (target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
          const speed = 80;
          this.x += (dx / dist) * speed * dt;
          this.y += (dy / dist) * speed * dt;
        }
        if (dist < 32) {
          this.state = 'interacting';
        }
      }
    } else if (this.state === 'interacting') {
      this.timer += dt;
      if (this.timer >= this.patience) {
        this.state = 'leaving';
        this.timer = 0;
      }
    }
  }
  draw(ctx) {
    ctx.fillStyle = this.state === 'served' ? '#0f0' : (this.state === 'leaving' ? '#f00' : '#fff');
    ctx.beginPath();
    ctx.arc(this.x, this.y, 15, 0, Math.PI*2);
    ctx.fill();
  }
}

class Pizza {
  constructor(size, sauce, cheese, toppings) {
    this.size = size;
    this.baseDiameter = { SM: 30, MD: 40, LG: 50 }[size];
    this.diameter = this.baseDiameter;
    this.sauce = sauce;
    this.cheese = cheese;
    this.toppings = [...toppings];
    this.cookProgress = 0;
    this.state = 'prepping';
    this.cookTime = BASE_TIME[size] * (1 + this._calcModifier());
  }
  _calcModifier() {
    let mod = 0;
    for (const t of this.toppings) {
      mod += TOPPING_MODIFIERS[t.type] || 0;
    }
    return mod;
  }
  update(dt) {
    if (this.state === 'cooking') {
      this.cookProgress += dt / this.cookTime;
      if (this.cookProgress >= 1) this.state = 'ready';
      else if (this.cookProgress > 1.2) this.state = 'burnt';
    }
  }
  draw(ctx) {
    ctx.fillStyle = this.state === 'ready' ? '#ffcc00' : (this.state === 'burnt' ? '#550' : '#bbb');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.diameter/2, 0, Math.PI*2);
    ctx.fill();
  }
}

class Station {
  constructor(x, y, type, width=100, height=50) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.w = width;
    this.h = height;
    this.occupied = [];
  }
  contains(pizza) {
    return pizza.x >= this.x && pizza.x <= this.x+this.w && pizza.y >= this.y && pizza.y <= this.y+this.h;
  }
  draw(ctx) {
    ctx.fillStyle = this.type === 'prep' ? '#8b4513' : '#556b2f';
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
}

class Game {
  constructor() {
    this.lastTime = 0;
    this.dt = 0;
    this.running = false;
    this.entities = [];
    this.player = null;
    this.customers = [];
    this.pizzas = [];
    this.stations = [];
    this.coins = 0;
    this.day = 0;
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
    this.timerSpawn = 0;
    this.spawnInterval = 5; // seconds
    requestAnimationFrame(this.loop.bind(this));
  }
  loop(timestamp) {
    this.dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    this.update(this.dt);
    this.render();
    if (this.running) requestAnimationFrame(this.loop.bind(this));
  }
  update(dt) {
    if (this.paused) return;
    this.handleInput(dt);
    this.updateEntities(dt);
    this.checkCollisions();
    this.updateCooking(dt);
    this.updateCustomers(dt);
    this.updateSpeedrun();
  }
  handleInput(dt) {
    const keys = {};
    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup', e => keys[e.key] = false);
    const dir = { x:0, y:0 };
    if (keys['ArrowUp'] || keys['w']) dir.y -= 1;
    if (keys['ArrowDown'] || keys['s']) dir.y += 1;
    if (keys['ArrowLeft'] || keys['a']) dir.x -= 1;
    if (keys['ArrowRight'] || keys['d']) dir.x += 1;
    const len = Math.hypot(dir.x, dir.y);
    if (len > 0) {
      dir.x /= len;
      dir.y /= len;
      this.player.acceleration = dir.x * ACCEL_CONST * dt;
      this.player.acceleration += dir.y * ACCEL_CONST * dt;
    } else {
      this.player.acceleration = 0;
    }
    this.player.update(dt);
  }
  updateEntities(dt) {
    for (const cust of this.customers) cust.update(dt);
    for (const pizza of this.pizzas) pizza.update(dt);
  }
  checkCollisions() {
    for (const station of this.stations) {
      const dx = this.player.x - station.x;
      const dy = this.player.y - station.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 32) {
        this.player.state = 'interacting';
      }
    }
  }
  updateCooking(dt) {
    for (const pizza of this.pizzas) {
      if (pizza.state === 'cooking') pizza.update(dt);
    }
  }
  updateCustomers(dt) {
    for (const cust of this.customers) {
      if (cust.state === 'waiting') {
        const target = this.stations.find(s => s.type === 'prep');
        if (target) {
          const dx = target.x - cust.x;
          const dy = target.y - cust.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1) {
            const speed = 80;
            cust.x += (dx / dist) * speed * dt;
            cust.y += (dy / dist) * speed * dt;
          }
          if (dist < 32) {
            cust.state = 'interacting';
            if (!cust.pizza) {
              const order = cust.order;
              const pizza = new Pizza(order.size, order.sauce, order.cheese, order.toppings);
              const prepStation = this.stations.find(s => s.type === 'prep');
              pizza.x = prepStation.x + prepStation.w/2;
              pizza.y = prepStation.y + prepStation.h/2;
              cust.pizza = pizza;
              this.pizzas.push(pizza);
            }
          }
        }
      }
    }
  }
  updateSpeedrun() {
    // speedrun timer displayed in HUD
  }
  render() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // background
    ctx.fillStyle = '#222';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // stations
    for (const s of this.stations) s.draw(ctx);
    // entities
    this.player.draw(ctx);
    for (const cust of this.customers) cust.draw(ctx);
    for (const pizza of this.pizzas) pizza.draw(ctx);
    // HUD
    this.drawHUD();
  }
  drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Day ${this.day}`, canvas.width/2 - 50, 30);
    ctx.fillText(`Coins: ${this.coins}`, 20, 30);
    const elapsed = (performance.now() - this.speedrunStart) / 1000;
    ctx.fillText(`Time: ${elapsed.toFixed(1)}s`, canvas.width - 120, 30);
  }
}

window.addEventListener('load', () => {
  const game = new Game();
  game.init();
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * dpr;
  const y = (e.clientY - rect.top) * dpr;
  for (const pizza of game.pizzas) {
    const dx = x - pizza.x;
    const dy = y - pizza.y;
    const dist = Math.hypot(dx, dy);
    if (dist < pizza.diameter/2) {
      if (game.selectedTopping) {
        pizza.toppings.push({type: game.selectedTopping, x, y});
        playBeep(440, 0.1);
      }
      break;
    }
  });

window.addEventListener('keydown', e => {
  if (e.key === 'e' && game.player.state === 'interacting') {
    const prepStation = game.stations.find(s => s.type === 'prep');
    const pizza = game.pizzas.find(p => p.x >= prepStation.x && p.x <= prepStation.x+prepStation.w && p.y >= prepStation.y && p.y <= prepStation.y+prepStation.h);
    if (pizza) {
      pizza.state = 'cooking';
      playBeep(600, 0.2);
    }
  }
});

// Simple audio setup (no background music for now)
// You can extend this with more sounds as needed.

// End of main.js
