export class StartScreen {
    constructor(game) {
        this.game = game;
        this.time = 0;
        this.createElement();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'screen start-screen';
        this.element.style.pointerEvents = 'auto';
        this.element.innerHTML = `
            <h1>MAZE RUNNER</h1>
            <p>Directional Challenge</p>
            <div class="controls">
                <div class="control-item"><span class="key">↑</span><span class="key">W</span> Move Up</div>
                <div class="control-item"><span class="key">↓</span><span class="key">S</span> Move Down</div>
                <div class="control-item"><span class="key">←</span><span class="key">A</span> Move Left</div>
                <div class="control-item"><span class="key">→</span><span class="key">D</span> Move Right</div>
                <div class="control-item" style="grid-column: span 2;"><span class="key">SPACE</span> Start / Restart</div>
                <div class="control-item" style="grid-column: span 2;"><span class="key">ESC</span> Pause</div>
            </div>
            <p>Swipe on mobile to change direction</p>
            <p>Avoid walls and obstacles. Survive as long as possible!</p>
            <button class="btn" id="startBtn">Start Game</button>
            <button class="btn btn-secondary" id="settingsBtn">Settings</button>
        `;
        this.game.uiOverlay.appendChild(this.element);
        
        this.startBtn = document.getElementById('startBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        
        this.startBtn.addEventListener('click', () => this.game.changeState('playing'));
        this.settingsBtn.addEventListener('click', () => this.game.hud.showSettings());
    }

    show() {
        this.element.style.display = 'flex';
        this.time = 0;
    }

    hide() {
        this.element.style.display = 'none';
    }

    update(dt) {
        this.time += dt;
        // Animate title
        const title = this.element.querySelector('h1');
        if (title) {
            title.style.transform = `translateY(${Math.sin(this.time * 2) * 5}px)`;
        }
    }
}