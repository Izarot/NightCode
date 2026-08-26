export class GameState {
  constructor() {
    this.input = new InputManager();
    this.collisionService = new CollisionService();
    this.snake = null;
    this.food = null;
    this.portals = [];
    this.particles = null;
    this.sound = new SoundManager();
    this.state = 'MENU';
    this.score = 0;
    this.level = 1;
    this.foodsEaten = 0;
    this.speed = GAME.BASE_SPEED;
    this.multiplier = 1.0;
    this.gameStartTime = 0;
    this.lastUpdate = 0;
    this.isPaused = false;
  }

  init() {
    this.snake = new Snake(VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, GAME.START_LENGTH);
    this.spawnFood();
    this.setupPortals();
    this.score = 0;
    this.level = 1;
    this.foodsEaten = 0;
    this.multiplier = 1.0;
    this.speed = GAME.BASE_SPEED;
    this.state = 'PLAYING';
    this.gameStartTime = performance.now();
    this.input.init();
  }

  setupPortals() {
    this.portals = [];
    this.portals.push({ id: 'A', x: 50, y: 200, color: COLORS.PORTAL_A });
    this.portals.push({ id: 'B', x: 350, y: 200, color: COLORS.PORTAL_B });
  }

  spawnFood() {
    let valid = false;
    while (!valid) {
      const x = Math.floor(Math.random() * (VIRTUAL_WIDTH / CELL_SIZE)) * CELL_SIZE;
      const y = Math.floor(Math.random() * (VIRTUAL_HEIGHT / CELL_SIZE)) * CELL_SIZE;
      valid = !this.snake.occupies(x, y) && !this._portalOccupies(x, y);
    }
    this.food = new Food(x, y, COLORS.FOOD);
  }

  _portalOccupies(x, y) {
    for (const portal of this.portals) {
      const dist = Math.hypot(x - portal.x, y - portal.y);
      if (dist < 50) return true;
    }
    return false;
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.input.update();
    this.snake.update(this.portals);

    const portalResult = this.collisionService.checkPortal(this.snake.head, this.portals);
    if (portalResult) {
      this._enterPortal(portalResult);
    }

    if (this.collisionService.checkFood(this.snake.head, this.food)) {
      this._eatFood();
    }

    const wallCollision = this.collisionService.checkWall(this.snake.head, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    if (wallCollision) {
      this._gameOver();
      this.sound.playGameOver();
      return;
    }

    if (this.foodsEaten > 0 && this.foodsEaten % 5 === 0) {
      this.speed = Math.max(GAME.MIN_SPEED, this.speed - GAME.SPEED_INCREMENT);
    }

    this.multiplier = 1 + Math.floor(this.foodsEaten / 5) * 0.1;
  }

  _enterPortal(portal) {
    const paired = this._getPairedPortal(portal);
    this.snake.teleport(paired.x, paired.y);
    this.multiplier = Math.max(0.1, this.multiplier - PORTAL.PORTAL_PENALTY);
    this.score -= 5;
    this.particles.explode(this.snake.head.x, this.snake.head.y, portal.color);
  }

  _eatFood() {
    this.score += Math.round(GAME.FOOD_SCORE * this.multiplier);
    this.foodsEaten++;
    this.snake.grow();
    this.sound.playChomp();
    this.spawnFood();
  }

  _gameOver() {
    this.state = 'GAME_OVER';
    this._updateHighScore();
  }

  _updateHighScore() {
    const highScore = this._getHighScore();
    if (this.score > highScore) {
      localStorage.setItem('portalSnakeHighScore', this.score);
    }
  }

  _getHighScore() {
    const stored = localStorage.getItem('portalSnakeHighScore');
    return stored ? parseInt(stored) : 0;
  }

  _getPairedPortal(portal) {
    for (const p of this.portals) {
      if (p.id !== portal.id) return p;
    }
    return portal;
  }
}
