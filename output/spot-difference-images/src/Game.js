export class Game {
  constructor(renderer, input, audio, levelManager) {
    this.renderer = renderer;
    this.input = input;
    this.audio = audio;
    this.levelManager = levelManager;
    this.currentLevel = null;
    this.startTime = 0;
    this.timerInterval = null;
    this.remainingTime = 0;
    this.hintsLeft = 3;
    this.gameStarted = false;
  }

  start() {
    this.showStartScreen();
  }

  startLevel(levelNum, difficulty) {
    this.currentLevel = this.levelManager.getLevel(levelNum, difficulty);
    this.remainingTime = this.currentLevel.timeLimit;
    this.hintsLeft = 3;
    this.gameStarted = true;
    this.startTime = Date.now();
    this.updateTimerDisplay();
    this.startTimer();
    this.renderer.drawLevel(this.currentLevel);
    this.updateHUD();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.remainingTime--;
      this.updateTimerDisplay();
      if (this.remainingTime <= 0) {
        this.endLevel(false);
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    timerEl.textContent = this.remainingTime;
    if (this.remainingTime < 10) {
      timerEl.style.animation = 'flash 0.5s infinite';
    }
  }

  updateHUD() {
    document.getElementById('levelInfo').textContent = `Level ${this.levelManager.currentLevel}`; 
  }

  checkDifference(x, y) {
    if (!this.gameStarted || !this.currentLevel) return;
    const diff = this.currentLevel.differences.find(d => 
      !d.found && Math.sqrt(Math.pow(x - d.x, 2) + Math.pow(y - d.y, 2)) <= d.radius + 15
    );
    if (diff) {
      diff.found = true;
      this.audio.play('correct');
      this.renderer.markDifference(diff);
      this.checkLevelComplete();
      return true;
    } else {
      this.audio.play('wrong');
      this.renderer.shakeScreen();
      return false;
    }
  }

  checkLevelComplete() {
    const found = this.currentLevel.differences.filter(d => d.found).length;
    const total = this.currentLevel.differences.length;
    if (found === total) {
      this.endLevel(true);
    }
  }

  endLevel(won) {
    clearInterval(this.timerInterval);
    this.gameStarted = false;
    const accuracy = Math.round((this.currentLevel.differences.filter(d => d.found).length / this.currentLevel.differences.length) * 100);
    const timeTaken = 90 - this.remainingTime;
    const highScore = localStorage.getItem('highScore') || 0;
    if (accuracy >= 70 && timeTaken < highScore) {
      localStorage.setItem('highScore', timeTaken);
    }
    const stars = accuracy >= 90 ? 3 : accuracy >= 80 ? 2 : 1;
    this.showCompleteScreen(accuracy, stars, won);
  }

  showCompleteScreen(accuracy, stars, won) {
    document.getElementById('accuracy').textContent = `${accuracy}%`;
    document.getElementById('stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('highScore').textContent = `Best Time: ${localStorage.getItem('highScore') || 0}s`;
    document.getElementById('completeScreen').classList.add('active');
    if (won) this.audio.play('complete');
  }

  nextLevel() {
    this.levelManager.nextLevel();
    this.startLevel(this.levelManager.currentLevel, this.levelManager.difficulty);
  }

  useHint() {
    if (this.hintsLeft > 0 && this.currentLevel) {
      this.hintsLeft--;
      const unfound = this.currentLevel.differences.find(d => !d.found);
      if (unfound) {
        this.renderer.highlightDifference(unfound);
        this.audio.play('hint');
      }
    }
  }
}

const style = document.createElement('style');
style.textContent = '@keyframes flash { 0%, 50% { opacity: 1; } 100% { opacity: 0.5; } }';
document.head.appendChild(style);