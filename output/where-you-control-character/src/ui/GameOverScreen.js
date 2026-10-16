export class GameOverScreen {
    constructor(game) {
        this.game = game;
        this.createElement();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'screen game-over-screen';
        this.element.style.pointerEvents = 'auto';
        this.element.style.display = 'none';
        this.element.innerHTML = `
            <h1>GAME OVER</h1>
            <p class="final-score">Score: <span id="finalScore">0</span></p>
            <p class="best-score">Best: <span id="bestScore">0</span></p>
            <button class="btn" id="retryBtn">Try Again</button>
            <button class="btn btn-secondary" id="menuBtn">Main Menu</button>
        `;
        this.game.uiOverlay.appendChild(this.element);
        
        document.getElementById('retryBtn').addEventListener('click', () => this.game.changeState('playing'));
        document.getElementById('menuBtn').addEventListener('click', () => this.game.changeState('start'));
    }

    show() {
        document.getElementById('finalScore').textContent = this.game.hud.score;
        document.getElementById('bestScore').textContent = this.game.highScore;
        this.element.style.display = 'flex';
    }

    hide() {
        this.element.style.display = 'none';
    }

    update(dt) {}
}