class UI {
    constructor() {
        this.scoreEl = document.getElementById('score');
        this.highScoreEl = document.getElementById('highScore');
        this.livesEl = document.getElementById('lives');
        this.levelEl = document.getElementById('level');
        this.timerEl = document.getElementById('timer');
        this.regexInput = document.getElementById('regexInput');
        this.submitBtn = document.getElementById('submitBtn');
        this.currentPatternEl = document.getElementById('currentPattern');
        this.messageEl = document.getElementById('message');
        this.messageTitleEl = document.getElementById('messageTitle');
        this.messageTextEl = document.getElementById('messageText');
        this.restartBtn = document.getElementById('restartBtn');
        
        this.highScore = parseInt(localStorage.getItem('regexGameHighScore')) || 0;
        this.highScoreEl.textContent = this.highScore;
        
        this.startTime = 0;
        this.timerInterval = null;
    }

    initEventListeners(game) {
        this.submitBtn.addEventListener('click', () => game.applyPattern());
        this.regexInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') game.applyPattern();
        });
        this.restartBtn.addEventListener('click', () => game.restart());
    }

    updateScore(score) {
        this.scoreEl.textContent = score;
        if (score > this.highScore) {
            this.highScore = score;
            localStorage.setItem('regexGameHighScore', this.highScore);
            this.highScoreEl.textContent = this.highScore;
        }
    }

    updateLives(lives) {
        this.livesEl.textContent = lives;
    }

    updateLevel(level) {
        this.levelEl.textContent = level;
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = (Date.now() - this.startTime) / 1000;
            this.timerEl.textContent = elapsed.toFixed(2) + 's';
        }, 50);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    getTimerValue() {
        return (Date.now() - this.startTime) / 1000;
    }

    setPattern(pattern, valid) {
        this.currentPatternEl.textContent = pattern;
        this.regexInput.classList.remove('valid-regex', 'invalid-regex');
        if (valid) {
            this.regexInput.classList.add('valid-regex');
        } else {
            this.regexInput.classList.add('invalid-regex');
        }
    }

    showMessage(title, text) {
        this.messageTitleEl.textContent = title;
        this.messageTextEl.textContent = text;
        this.messageEl.style.display = 'block';
    }

    hideMessage() {
        this.messageEl.style.display = 'none';
    }

    showLevelUp(level) {
        const msg = document.createElement('div');
        msg.className = 'level-up-message';
        msg.textContent = `Level ${level}!`;
        document.querySelector('.game-canvas-container').appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    }

    shakeScreen() {
        const container = document.querySelector('.game-container');
        container.classList.add('screen-shake');
        setTimeout(() => container.classList.remove('screen-shake'), 300);
    }

    clearInput() {
        this.regexInput.value = '';
    }
}

if (typeof module !== 'undefined') module.exports = UI;