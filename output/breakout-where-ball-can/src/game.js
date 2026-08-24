import Paddle from './paddle.js';
import Ball from './ball.js';
import Brick from './brick.js';
import Powerup from './powerup.js';
import UI from './ui.js';

export default class Game {
  constructor(ctx) {
    this.ctx = ctx;
    this.canvas = document.getElementById('gameCanvas');
    this.keys = {};
    this.paddle = new Paddle(this.canvas.width/2 - 40, this.canvas.height - 40, this.canvas);
    this.balls = [];
    this.bricks = [];
    this.powerups = [];
    this.score = 0;
    this.lives = 3;
    this.activeBalls = 0;
    this.highScore = parseInt(localStorage.getItem('breakoutHighScore')) || 0;
    this.startTime = performance.now();
    this.gameOver = false;
    this.win = false;
    this.lastTime = 0;
    this.level = 1;
    this.timeElapsed = 0;
    this.loadLevel();
    this.ui = new UI(this);
    window.addEventListener('keydown', e => { this.keys[e.key] = true; });
    window.addEventListener('keyup', e => { this.keys[e.key] = false; });
  }

  loadLevel() {
    this.bricks = [];
    const rows = 5;
    const cols = 10;
    const brickWidth = 40;
    const brickHeight = 20;
    const marginX = 20;
    const marginY = 40;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const special = Math.random() < 0.2 && this.level > 2;
        const color = special ? '#ff6b6b' : ['#4ecdc4','#45b7d1','#96ceb4'][Math.floor(Math.random()*3)];
        this.bricks.push(new Brick(x * brickWidth + marginX + (x * 5), y * brickHeight + marginY + (y * 5), brickWidth, brickHeight, color, 1, special, this.canvas));
      }
    }
  }

  start() {
    this.balls.push(new Ball(this.paddle.x + this.paddle.width/2 - 6, this.paddle.y - 12, 6, 5, '#ff6b6b', this.canvas));
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const delta = (timestamp - this.lastTime) / 16;
    this.lastTime = timestamp;
    this.update(delta);
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }

  update(delta) {
    if (this.gameOver || this.win) return;
    this.paddle.update(this.keys);
    for (const ball of this.balls) {
      ball.update();
      for (let i = this.bricks.length - 1; i >= 0; i--) {
        const brick = this.bricks[i];
        const ballR = 6;
        const dx = ball.x - brick.x - brick.width/2;
        const dy = ball.y - brick.y - brick.height/2;
        const dist = Math.hypot(dx, dy);
        if (dist < ballR + Math.max(brick.width, brick.height)/2) {
          this.balls.splice(this.balls.indexOf(ball), 1);
          this.score += brick.points;
          this.playSound(440, 0.1);
          if (brick.special) {
            this.activeBalls++;
            if (this.activeBalls <= 8) {
              const count = 2 + Math.floor(Math.random()*3);
              for (let k=0; k<count; k++) {
                const angle = (Math.random()*Math.PI/3) - Math.PI/6;
                const vx = ball.vx + Math.cos(angle)*1;
                const vy = ball.vy + Math.sin(angle)*1;
                const speed = Math.hypot(vx, vy);
                const newBall = new Ball(ball.x, ball.y, 6, speed, ball.color, this.canvas);
                this.balls.push(newBall);
              }
            }
          }
          this.bricks.splice(i,1);
          if (this.bricks.length===0) {
            this.win = true;
            this.endLevel();
          }
          break;
        }
      }
    }
    for (const ball of this.balls) {
      const ballR = 6;
      const ballX = ball.x, ballY = ball.y;
      if (ballY + ballR > this.paddle.y && ballY - ballR < this.paddle.y + this.paddle.height &&
          ballX > this.paddle.x && ballX < this.paddle.x + this.paddle.width) {
        ball.y = this.paddle.y - ballR;
        ball.vy = -Math.abs(ball.vy);
        const hitPos = (ballX - this.paddle.x) / this.paddle.width - 0.5;
        ball.vx += hitPos * 4;
      }
    }
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      if (ball.y - ball.radius > this.paddle.y) {
        this.balls.splice(i,1);
        this.lives--;
        if (this.lives <= 0) this.gameOver = true;
      }
    }
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      if (pu.y + pu.size > this.paddle.y &&
          pu.x > this.paddle.x && pu.x < this.paddle.x + this.paddle.width) {
        this.powerups.splice(i,1);
        this.applyPowerup(pu.type);
        continue;
      }
      pu.y += pu.speed;
    }
    this.timeElapsed = (performance.now() - this.startTime) / 1000;
  }

  applyPowerup(type) {
    // placeholder for future powerup effects
  }

  endLevel() {
    this.level++;
    if (this.level > 10) {
      this.win = true;
    } else {
      this.loadLevel();
    }
  }

  playSound(freq, dur) {
    const ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, ctxAudio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctxAudio.currentTime + dur);
    osc.connect(gain).connect(ctxAudio.destination);
    osc.start();
    osc.stop(ctxAudio.currentTime + dur);
  }

  checkHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('breakoutHighScore', this.highScore);
    }
  }

  render() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    ctx.clearRect(0, 0, width, height);
    this.bricks.forEach(brick => brick.draw(ctx));
    this.balls.forEach(ball => ball.draw(ctx));
    this.paddle.draw(ctx);
    this.powerups.forEach(pu => pu.draw(ctx));
    this.ui.draw(ctx);
  }
}
