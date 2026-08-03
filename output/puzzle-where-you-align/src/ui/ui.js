export class UI {
    constructor(game) {
        this.game = game;
        this.container = document.getElementById('ui-layer');
        this.timerEl = document.createElement('div');
        this.timerEl.style.position = 'absolute';
        this.timerEl.style.top = '20px';
        this.timerEl.style.right = '20px';
        this.timerEl.style.fontSize = '24px';
        this.timerEl.style.color = '#4ecca3';
        this.container.appendChild(this.timerEl);

        this.powerBarContainer = document.createElement('div');
        this.powerBarContainer.style.position = 'absolute';
        this.powerBarContainer.style.bottom = '20px';
        this.powerBarContainer.style.left = '50%';
        this.powerBarContainer.style.transform = 'translateX(-50%)';
        this.powerBarContainer.style.width = '200px';
        this.powerBarContainer.style.height = '20px';
        this.powerBarContainer.style.background = '#0f3460';
        this.powerBarContainer.style.borderRadius = '10px';
        this.powerBarContainer.style.overflow = 'hidden';
        this.container.appendChild(this.powerBarContainer);

        this.powerBar = document.createElement('div');
        this.powerBar.style.width = '0%';
        this.powerBar.style.height = '100%';
        this.powerBar.style.background = '#e94560';
        this.powerBar.style.transition = 'width 0.1s ease-out';
        this.powerBarContainer.appendChild(this.powerBar);
    }

    update(time, power) {
        this.timerEl.innerText = `TIME: ${time.toFixed(2)}s`;
        this.powerBar.style.width = `${power}%`;
    }

    showWin(time) {
        const winScreen = document.getElementById('win-screen');
        const finalTime = document.getElementById('final-time');
        const highScoreMsg = document.getElementById('high-score-msg');
        
        winScreen.classList.remove('hidden');
        finalTime.innerText = `Completed in ${time.toFixed(2)} seconds`;

        const highScore = localStorage.getItem('gear_highscore') || Infinity;
        if (time < highScore) {
            localStorage.setItem('gear_highscore', time);
            highScoreMsg.innerText = "NEW HIGH SCORE!";
        } else {
            highScoreMsg.innerText = `Best: ${highScore}s`;
        }
    }
}