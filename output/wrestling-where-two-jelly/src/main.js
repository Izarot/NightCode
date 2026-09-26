class JellyJoust extends Phaser.Scene {
  constructor() {
    super('Game');
    this.player1 = null;
    this.player2 = null;
    this.plate = null;
    this.isShaking = false;
    this.gameStarted = false;
    this.highScore = 0;
    this.timer = 0;
    this.round = 1;
    this.p1Wins = 0;
    this.p2Wins = 0;
  }

  preload() {
    this.load.image('plate', 'assets/plate.png');
  }

  create() {
    this.highScore = localStorage.getItem('jellyJoustHighScore') || 0;
    this.setupPhysics();
    this.createPlate();
    this.createPlayers();
    this.setupControls();
    this.createUI();
    this.showInstructions();
  }

  setupPhysics() {
    this.matter.world.setBounds(0, 0, 800, 600);
  }

  createPlate() {
    this.plate = this.matter.add.sprite(400, 300, 'plate');
    this.plate.setStatic(true);
  }

  createPlayers() {
    const p1 = this.matter.add.sprite(300, 250, null);
    p1.setCircle(20);
    p1.setFillColor('#ff6b6b');
    p1.setOrigin(0.5);
    
    const p2 = this.matter.add.sprite(500, 250, null);
    p2.setCircle(20);
    p2.setFillColor('#4ecdc4');
    p2.setOrigin(0.5);

    this.player1 = p1;
    this.player2 = p2;
  }

  setupControls() {
    this.input.keyboard.on('keydown-W', () => this.jumpPlayer(this.player1));
    this.input.keyboard.on('keydown-UP', () => this.jumpPlayer(this.player2));
    this.input.keyboard.on('keydown-A', () => this.movePlayer(this.player1, -1));
    this.input.keyboard.on('keydown-D', () => this.movePlayer(this.player1, 1));
    this.input.keyboard.on('keydown-LEFT', () => this.movePlayer(this.player2, -1));
    this.input.keyboard.on('keydown-RIGHT', () => this.movePlayer(this.player2, 1));
  }

  jumpPlayer(player) {
    if (player.body && !player.isJumping)
      player.setVelocityY(-300);
  }

  movePlayer(player, direction) {
    if (player.body)
      player.setVelocityX(direction * 200);
  }

  createUI() {
    this.timerText = this.add.text(400, 20, '00:00', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  showInstructions() {
    const instr = this.add.text(400, 300, 'Press SPACE to start\n\nWASD: Move P1\nArrows: Move P2\nJ/K: Attack P1\nN/M: Attack P2', {
      fontSize: '18px',
      fill: '#ffffff',
      textAlign: 'center'
    }).setOrigin(0.5);
    
    this.time.delayedCall(10000, () => instr.destroy());
  }

  update(time, delta) {
    if (!this.gameStarted) return;
    
    this.timer += delta;
    const seconds = Math.floor(this.timer / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    this.timerText.setText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  physics: { default: 'arcade' },
  scene: JellyJoust,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

window.addEventListener('resize', () => {
  const canvas = document.querySelector('canvas');
  if (canvas) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
  }
});

const game = new Phaser.Game(config);