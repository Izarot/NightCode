const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.8;
}
window.addEventListener('resize', resize);
resize();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(frequency, duration = 0.1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = frequency;
  gain.gain.value = 0.2;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

class Paddle {
  constructor(x, y, width, height, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.dy = 0;
  }
  update() {
    this.y += this.dy;
    if (this.y < 0) this.y = 0;
    if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;
  }
  draw() {
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Ball {
  constructor(x, y, vx, vy, radius, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = radius;
    this.color = color;
    this.trail = [];
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) this.vx *= -1;
    if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) this.vy *= -1;
  }
  draw() {
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    for (let i = 0; i < this.trail.length - 1; i++) {
      const a = this.trail[i];
      const b = this.trail[i + 1];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.stroke();
    }
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    this.trail.push({x: this.x, y: this.y});
    if (this.trail.length > 10) this.trail.shift();
  }
  split() {
    const speed = Math.hypot(this.vx, this.vy);
    const angle = Math.atan2(this.vy, this.vx);
    const offset1 = angle + Math.PI / 12;
    const offset2 = angle - Math.PI / 12;
    const vx1 = speed * Math.cos(offset1);
    const vy1 = speed * Math.sin(offset1);
    const vx2 = speed * Math.cos(offset2);
    const vy2 = speed * Math.sin(offset2);
    return [
      new Ball(this.x, this.y, vx1, vy1, this.radius, this.color),
      new Ball(this.x, this.y, vx2, vy2, this.radius, this.color)
    ];
  }
}

class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.paddleLeft = new Paddle(20, canvas.height / 2 - 40, 10, 80, 8);
    this.paddleRight = new Paddle(canvas.width - 30, canvas.height / 2 - 40, 10, 80, 8);
    this.balls = [];
    this.maxBalls = 4;
    this.playerScore = 0;
    this.opponentScore = 0;
    this.maxScore = 10;
    this.timer = 0;
    this.highScore = parseInt(localStorage.getItem('splitPongHighScore')) || 0;
    this.state = 'start';
    this.lastTime = 0;
    this.keys = {};
    this.init();
  }
  init() {
    this.resetBalls();
    this.lastTime = performance.now();
    this.state = 'start';
  }
  resetBalls() {
    this.balls = [];
    const angle = Math.PI / 4;
    const speed = 4;
    const vx = speed * Math.cos(angle);
    const vy = speed * Math.sin(angle);
    this.balls.push(new Ball(canvas.width / 2, canvas.height / 2, vx, vy, 12, 'white-yellow'));
  }
  startGame() {
    this.state = 'play';
    this.timer = 0;
    this.resetBalls();
  }
  update(dt) {
    if (this.state !== 'play') return;
    this.paddleLeft.dy = 0;
    this.paddleRight.dy = 0;
    if (keys['ArrowUp'] || keys['w']) this.paddleLeft.dy = -this.paddleLeft.speed;
    if (keys['ArrowDown'] || keys['s']) this.paddleLeft.dy = this.paddleLeft.speed;
    if (keys['ArrowUp'] || keys['w']) this.paddleRight.dy = -this.paddleRight.speed;
    if (keys['ArrowDown'] || keys['s']) this.paddleRight.dy = this.paddleRight.speed;
    this.paddleLeft.update();
    this.paddleRight.update();

    for (const ball of this.balls) {
      ball.update();
    }

    for (const ball of this.balls) {
      // left paddle
      if (ball.x - ball.radius < this.paddleLeft.x + this.paddleLeft.width &&
          ball.y > this.paddleLeft.y &&
          ball.y < this.paddleLeft.y + this.paddleLeft.height) {
        ball.vx = -Math.abs(ball.vx);
        const hitPos = (ball.y - this.paddleLeft.y) / this.paddleLeft.height - 0.5;
        ball.vy += hitPos * 2;
        playBeep(440);
      }
      // right paddle
      if (ball.x + ball.radius > this.paddleRight.x &&
          ball.y > this.paddleRight.y &&
          ball.y < this.paddleRight.y + this.paddleRight.height) {
        ball.vx = Math.abs(ball.vx);
        const hitPos = (ball.y - this.paddleRight.y) / this.paddleRight.height - 0.5;
        ball.vy += hitPos * 2;
        playBeep(440);
      }
    }

    for (const ball of this.balls) {
      if (ball.x < 0) {
        this.opponentScore++;
        this.resetBall();
        break;
      }
      if (ball.x > this.canvas.width) {
        this.playerScore++;
        this.resetBall();
        break;
      }
    }

    this.timer += dt / 1000;

    if (this.playerScore >= this.maxScore || this.opponentScore >= this.maxScore) {
      this.state = 'over';
    }
  }
  resetBall() {
    this.balls = [];
    const angle = Math.PI / 4;
    const speed = 4;
    const vx = speed * Math.cos(angle);
    const vy = speed * Math.sin(angle);
    this.balls.push(new Ball(canvas.width / 2, canvas.height / 2, vx, vy, 12, 'white-yellow'));
  }
  render() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // grid lines
    this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < this.canvas.width; i += this.canvas.width / 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.canvas.height);
      this.ctx.stroke();
    }
    for (let i = 0; i < this.canvas.height; i += this.canvas.height / 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
      this.ctx.stroke();
    }

    this.paddleLeft.draw();
    this.paddleRight.draw();

    for (const ball of this.balls) {
      ball.draw();
    }

    // HUD
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '24px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`Player: ${this.playerScore}`, this.canvas.width / 2 - 100);
    this.ctx.fillText(`Opponent: ${this.opponentScore}`, this.canvas.width / 2 + 100);
    this.ctx.fillText(`Time: ${Math.floor(this.timer)}s`, this.canvas.width - 150);
    this.ctx.fillText(`Balls: ${this.balls.length}/${this.maxBalls}`, this.canvas.width - 50, 30);
    this.ctx.fillText(`High Score: ${this.highScore}`, 50, 30);
  }
  async handleGameOver() {
    const totalScore = this.playerScore + this.opponentScore;
    if (totalScore > this.highScore) {
      this.highScore = totalScore;
      localStorage.setItem('splitPongHighScore', this.highScore);
    }
    playBeep(200, 0.3);
    while (this.state === 'over') {
      if (keys['r'] || keys['R']) {
        this.state = 'start';
        this.resetBalls();
        this.playerScore = 0;
        this.opponentScore = 0;
        this.timer = 0;
      }
      await new Promise(r => setTimeout(r, 100));
    }
  }
}

const game = new Game(canvas, ctx);

function loop(timestamp) {
  const dt = timestamp - game.lastTime;
  game.lastTime = timestamp;
  game.update(dt);
  game.render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function showStartScreen() {
  game.ctx.fillStyle = 'rgba(0,0,0,0.7)';
  game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
  game.ctx.fillStyle = '#fff';
  game.ctx.textAlign = 'center';
  game.ctx.font = '48px monospace';
  game.ctx.fillText('SPLIT PONG', game.canvas.width / 2, game.canvas.height / 2 - 30);
  game.ctx.font = '24px monospace';
  game.ctx.fillText('Press SPACE to Start', game.canvas.width / 2, game.canvas.height / 2);
  game.ctx.fillText('Use Arrow Keys or WASD to Move', game.canvas.width / 2, game.canvas.height / 2 + 30);
}

function handleStartKey() {
  if (keys[' ']) {
    game.startGame();
    keys[' '] = false;
  }
}

function loopWithState(timestamp) {
  const dt = timestamp - game.lastTime;
  game.lastTime = timestamp;
  if (game.state === 'start') {
    showStartScreen();
    handleStartKey();
  } else if (game.state === 'play') {
    game.update(dt);
    game.render();
  } else if (game.state === 'over') {
    game.handleGameOver();
  }
  requestAnimationFrame(loopWithState);
}
requestAnimationFrame(loopWithState);