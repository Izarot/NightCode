export class HUD {
    constructor(game) {
        this.game = game;
        this.score = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        
        this.createElements();
    }

    createElements() {
        this.container = document.createElement('div');
        this.container.className = 'hud';
        this.container.innerHTML = `
            <div class="hud-item score" id="score">Score: 0</div>
            <div class="hud-item timer" id="timer">00:00.00</div>
            <div class="hud-item high-score" id="highScore">Best: 0</div>
            <button class="settings-btn" id="settingsBtn" aria-label="Settings">⚙</button>
        `;
        this.game.uiOverlay.appendChild(this.container);
        
        this.scoreEl = document.getElementById('score');
        this.timerEl = document.getElementById('timer');
        this.highScoreEl = document.getElementById('highScore');
        this.settingsBtn = document.getElementById('settingsBtn');
        
        this.settingsBtn.addEventListener('click', () => this.showSettings());
    }

    reset() {
        this.score = 0;
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.updateDisplay();
        this.highScoreEl.textContent = `Best: ${this.game.highScore}`;
    }

    update(dt) {
        if (this.game.state === 'playing') {
            this.elapsedTime = (Date.now() - this.startTime) / 1000;
            this.score = Math.floor(this.elapsedTime * 100);
            this.updateDisplay();
        }
    }

    updateDisplay() {
        this.scoreEl.textContent = `Score: ${this.score}`;
        
        const minutes = Math.floor(this.elapsedTime / 60);
        const seconds = Math.floor(this.elapsedTime % 60);
        const centiseconds = Math.floor((this.elapsedTime % 1) * 100);
        this.timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    updateHighContrast() {
        const items = this.container.querySelectorAll('.hud-item');
        items.forEach(item => {
            if (this.game.settings.highContrast) {
                item.classList.add('high-contrast');
            } else {
                item.classList.remove('high-contrast');
            }
        });
    }

    showSettings() {
        const modal = document.createElement('div');
        modal.className = 'screen settings-modal';
        modal.style.pointerEvents = 'auto';
        modal.innerHTML = `
            <h1>Settings</h1>
            <div class="controls">
                <label class="control-item">
                    <input type="checkbox" id="highContrastToggle" ${this.game.settings.highContrast ? 'checked' : ''}>
                    <span>High Contrast Mode</span>
                </label>
                <label class="control-item">
                    <input type="checkbox" id="soundToggle" ${this.game.settings.soundEnabled ? 'checked' : ''}>
                    <span>Sound Effects</span>
                </label>
                <label class="control-item" style="grid-column: span 2;">
                    <span>Game Speed</span>
                    <input type="range" id="speedSlider" min="0.5" max="2" step="0.1" value="${this.game.settings.gameSpeed}">
                </label>
            </div>
            <button class="btn" id="closeSettings">Close</button>
        `;
        this.game.uiOverlay.appendChild(modal);
        
        document.getElementById('highContrastToggle').addEventListener('change', (e) => {
            this.game.toggleHighContrast();
        });
        
        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.game.toggleSound();
        });
        
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.game.setGameSpeed(parseFloat(e.target.value));
        });
        
        document.getElementById('closeSettings').addEventListener('click', () => {
            modal.remove();
        });
    }
}