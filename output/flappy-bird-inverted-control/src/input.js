class Input {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Touch events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const y = touch.clientY - rect.top;
        const centerY = rect.height / 2;
        if (y > centerY) {
          this.handleJump();
        }
      }
    }, { passive: false });

    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const centerY = rect.height / 2;
      if (y > centerY) {
        this.handleJump();
      }
    });

    // Keyboard events
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (physics.gameState === STATE.IDLE || physics.gameState === STATE.GAME_OVER) {
          physics.reset();
        } else if (physics.gameState === STATE.PLAYING) {
          physics.jump();
 }
      }
    });

    // Mouse wheel for fine-tuning jump strength
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (physics.gameState === STATE.PLAYING) {
        physics.bird.vy = CONFIG.jumpStrength * (1 + e.deltaY / 100);
      }
    }, { passive: false });
  }

  handleJump() {
    if (physics.gameState === STATE.PLAYING) {
      physics.jump();
    }
  }
}

const input = new Input();