export class PauseMenu {
    constructor(game) {
        this.game = game;
        this.createElement();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'screen pause-menu';
        this.element.style.pointerEvents = 'auto';
        this.element.style.display = 'none';
        this.element.innerHTML = `
            <h1>PAUSED</h1>
            <button class="btn" id="resumeBtn">Resume</button>
            <button class="btn btn-secondary" id="restartBtn">Restart</button>
            <button class="btn btn-secondary" id="quitBtn">Main Menu</button>
        `;
        this.game.uiOverlay.appendChild(this.element);
        
        document.getElementById('resumeBtn').addEventListener('click', () => this.game.resume());
        document.getElementById('restartBtn').addEventListener('click', () => this.game.changeState('playing'));
        document.getElementById('quitBtn').addEventListener('click', () => this.game.changeState('start'));
    }

    show() {
        this.element.style.display = 'flex';
    }

    hide() {
        this.element.style.display = 'none';
    }

    update(dt) {}
}