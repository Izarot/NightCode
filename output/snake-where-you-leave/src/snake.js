import { CONFIG, DIRECTIONS, getOpposite } from '../config.js';

export class Snake {
  constructor() {
    this.reset();
  }

  reset() {
    const startX = Math.floor(CONFIG.GRID_SIZE / 2);
    const startY = Math.floor(CONFIG.GRID_SIZE / 2);
    this.segments = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this.direction = DIRECTIONS.RIGHT;
    this.nextDirection = DIRECTIONS.RIGHT;
    this.growing = false;
    this.slipLocked = 0;
    this.slipPending = false;
    this.viscosity = 0;
    this.boostActive = false;
    this.boostTimer = 0;
    this.turnSplats = []; // {x, y, dir, time}
  }

  getHead() {
    return this.segments[0];
  }

  setDirection(dir) {
    this.nextDirection = dir;
  }

  // Returns { ateFood, died, slipOccurred }
  update(food, slimeGrid, tickMs, deltaTime) {
    // Handle boost timer
    if (this.boostActive) {
      this.boostTimer -= tickMs;
      if (this.boostTimer <= 0) {
        this.boostActive = false;
      }
    }

    // Handle slip lock
    if (this.slipLocked > 0) {
      this.slipLocked--;
      if (this.slipLocked === 0) {
        this.slipPending = false;
      }
    }

    // Apply direction change if not slip locked
    if (!this.slipLocked && this.nextDirection) {
      const opposite = getOpposite(this.direction);
      if (this.nextDirection.x !== opposite.x || this.nextDirection.y !== opposite.y) {
        // Record turn splat at current head position
        this.turnSplats.push({
          x: this.segments[0].x,
          y: this.segments[0].y,
          dir: this.direction,
          time: performance.now()
        });
        this.direction = this.nextDirection;
      }
      this.nextDirection = null;
    }

    // Calculate new head position
    let newHead = {
      x: this.segments[0].x + this.direction.x,
      y: this.segments[0].y + this.direction.y
    };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= CONFIG.GRID_SIZE || newHead.y < 0 || newHead.y >= CONFIG.GRID_SIZE) {
      return { ateFood: false, died: true, slipOccurred: false };
    }

    // Self collision (fresh slime = body)
    const selfCollision = this.segments.some(seg => seg.x === newHead.x && seg.y === newHead.y);
    if (selfCollision) {
      return { ateFood: false, died: true, slipOccurred: false };
    }

    // Check for stale slime (slip)
    const slimeTile = slimeGrid.get(newHead.x, newHead.y);
    let slipOccurred = false;
    if (slimeTile && slimeTile.state === 'stale') {
      slipOccurred = true;
      // Move an extra 0.5 cell in same direction
      newHead.x += this.direction.x * 0.5;
      newHead.y += this.direction.y * 0.5;
      this.slipLocked = CONFIG.SLIP_LOCK_TICKS;
      this.slipPending = true;
    }

    // Add new head
    this.segments.unshift(newHead);

    // Food consumption
    let ateFood = false;
    if (food && newHead.x === food.x && newHead.y === food.y) {
      ateFood = true;
      this.growing = true;
      this.addViscosity(CONFIG.VISCOSITY_PER_FOOD);
    }

    // Move tail if not growing
    if (!this.growing) {
      this.segments.pop();
    } else {
      this.growing = false;
    }

    // Handle boost slip extra slime
    if (this.boostActive && slipOccurred) {
      // Extra slime handled in game.js when marking trail
    }

    return { ateFood, died: false, slipOccurred };
  }

  addViscosity(amount) {
    this.viscosity = Math.min(CONFIG.VISCOSITY_MAX, this.viscosity + amount);
  }

  useBoost() {
    if (this.viscosity >= CONFIG.VISCOSITY_MAX && !this.boostActive) {
      this.boostActive = true;
      this.boostTimer = CONFIG.BOOST_DURATION_MS;
      this.viscosity = 0;
      return true;
    }
    return false;
  }

  getViscosityRatio() {
    return this.viscosity / CONFIG.VISCOSITY_MAX;
  }

  isBoostReady() {
    return this.viscosity >= CONFIG.VISCOSITY_MAX && !this.boostActive;
  }

  getLength() {
    return this.segments.length;
  }

  // For rendering interpolation
  getSegments() {
    return this.segments;
  }

  getDirection() {
    return this.direction;
  }

  isSlipLocked() {
    return this.slipLocked > 0;
  }

  isBoostActive() {
    return this.boostActive;
  }

  getTurnSplats() {
    return this.turnSplats;
  }

  clearOldSplats(maxAge) {
    const now = performance.now();
    this.turnSplats = this.turnSplats.filter(s => now - s.time < maxAge);
  }
}