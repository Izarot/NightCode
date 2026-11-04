// Main Game Logic
import { SETTINGS } from '../config/settings.js';
import { audioManager } from './audio.js';
import { scoreManager } from './score.js';
import { UIManager } from './ui.js';

export class Game {
  constructor() {
    this.canvas = null; this.ctx = null; this.uiManager = null;
    this.state = 'waiting'; this.score = 0; this.highScore = 0;
    this.startTime = 0; this.timerInterval = null; this.gameActive = false;
  }
  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.uiManager = new UIManager(this.canvas, this.ctx);
    audioManager.init();
    this.highScore = scoreManager.getHighScore();
    this.updateHighScoreDisplay();
    this.setupResponsiveCanvas();
    this.canvas.addEventListener('click', () => this.handleClick());
    this.startRound();
  }
  setupResponsiveCanvas() {
    this.uiManager.resizeCanvas();
    window.addEventListener('resize', () => this.uiManager.resizeCanvas());
  }
  startRound() {
    this.state = 'waiting'; this.gameActive = true;
    this.uiManager.drawCircle('waiting');
    audioManager.playSound('start');
    const waitTime = Math.random() * (SETTINGS.maxWait - SETTINGS.minWait) + SETTINGS.minWait;
    setTimeout(() => {
      if (this.gameActive) {
        this.state = 'ready'; this.startTime = performance.now();
        this.startTimer(); this.uiManager.drawCircle('ready');
        setTimeout(() => {
          if (this.state === 'ready') { this.state = 'danger'; this.uiManager.drawCircle('danger'); audioManager.playSound('wrong'); }
        }, SETTINGS.readyDuration);
      }
    }, waitTime);
  }
  startTimer() {
    this.timerInterval = setInterval(() => {
      const elapsed = (performance.now() - this.startTime) / 1000;
      document.getElementById('timer').textContent = elapsed.toFixed(2);
    }, 100);
  }
  stopTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    document.getElementById('timer').textContent = '0.00';
  }
  handleClick() {
    if (!this.gameActive) return;
    if (this.state === 'ready') {
      const reactionTime = (performance.now() - this.startTime) / 1000;
      const points = SETTINGS.correctClick - Math.round(reactionTime * 10);
      this.score += points;
      audioManager.playSound('correct');
      this.showMessage('Correct! ' + reactionTime.toFixed(3) + 's', '#48bb78');
      document.getElementById('score').textContent = this.score;
      this.highScore = scoreManager.updateHighScore(this.score);
      this.updateHighScoreDisplay();
      this.stopTimer();
      setTimeout(() => this.startRound(), 1000);
    } else if (this.state === 'waiting') {
      this.score += SETTINGS.wrongClick;
      audioManager.playSound('wrong');
      this.showMessage('Too early!', '#f56565');
      document.getElementById('score').textContent = this.score;
      setTimeout(() => this.startRound(), 1500);
    } else if (this.state === 'danger') {
      this.score += SETTINGS.wrongClick;
      audioManager.playSound('wrong');
      this.showMessage('Too slow!', '#f56565');
      document.getElementById('score').textContent = this.score;
      setTimeout(() => this.startRound(), 1500);
    }
  }
  showMessage(text, color) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.style.color = color;
  }
  updateHighScoreDisplay() { document.getElementById('highscore').textContent = this.highScore; }
}
