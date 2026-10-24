class UI {
    constructor() {
        this.hud = document.getElementById('hud');
        this.menu = document.getElementById('menu');
        this.startBtn = document.getElementById('startBtn');
        this.scoreEl = document.getElementById('score');
        this.highscoreEl = document.getElementById('highscore');
        this.speedEl = document.getElementById('speedometer');
        this.timerEl = document.getElementById('timer');
        this.eggsEl = document.getElementById('eggs');
        
        this.loadHighScore();
        this.setupStartButton();
    }

    loadHighScore() {
        this.highScore = parseInt(localStorage.getItem('eggDropHighScore')) || 0;
        this.highscoreEl.textContent = `High: ${this.highScore}`;
    }

    saveHighScore(score) {
        if (score > this.highScore) {
            this.highScore = score;
            localStorage.setItem('eggDropHighScore', this.highScore);
            this.highscoreEl.textContent = `High: ${this.highScore}`;
        }
    }

    setupStartButton() {
        this.startBtn.addEventListener('click', () => {
            this.hideMenu();
            Game.start();
        });
    }

    showMenu() {
        this.menu.style.display = 'block';
        this.hud.style.display = 'none';
    }

    hideMenu() {
        this.menu.style.display = 'none';
        this.hud.style.display = 'block';
    }

    update(score, time, speed, eggs) {
        this.scoreEl.textContent = `Score: ${score}`;
        this.timerEl.textContent = `Time: ${Utils.formatTime(time)}`;
        this.speedEl.textContent = `Speed: ${Math.round(speed)}`;
        this.eggsEl.textContent = `Eggs: ${eggs.current}/${eggs.max}`;
    }
}