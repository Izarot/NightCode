export class UI {
  constructor() {
    this.startMenu = document.getElementById('start-menu');
    this.victoryMenu = document.getElementById('victory-menu');
    this.levelEl = document.getElementById('level');
    this.movesEl = document.getElementById('moves');
    this.timerEl = document.getElementById('timer');
    this.pauseBtn = document.getElementById('pause');
    this.victoryTimeEl = document.getElementById('victory-time');
    this.startBtn = document.getElementById('start-btn');
    this.nextBtn = document.getElementById('next-btn');
    this.replayBtn = document.getElementById('replay-btn');
    this.menuBtn = document.getElementById('menu-btn');
    this.settingsBtn = document.getElementById('settings-btn');
    this.creditsBtn = document.getElementById('credits-btn');

    this.pauseBtn.addEventListener('click', () => this.togglePause());
    this.startBtn.addEventListener('click', () => this.startGame());
    this.nextBtn.addEventListener('click', () => this.nextLevel());
    this.replayBtn.addEventListener('click', () => this.replayLevel());
    this.menuBtn.addEventListener('click', () => this.showStart());
    this.settingsBtn.addEventListener('click', () => this.showSettings());
    this.creditsBtn.addEventListener('click', () => this.showCredits());

    this.isPaused = false;
    this.onPauseToggle = null;
    this.onStart = null;
    this.onNext = null;
    this.onReplay = null;
  }

  update(game) {
    this.levelEl.textContent = `LVL ${String(game.levelData.id || 0).padStart(2,'0')}`;
    this.movesEl.textContent = `MOVES: ${game.moves}`;
    const mins = Math.floor(game.time / 60).toString().padStart(2,'0');
    const secs = Math.floor(game.time % 60).toString().padStart(2,'0');
    this.timerEl.textContent = `${mins}:${secs}`;
  }

  showStart() {
    this.startMenu.style.display = 'block';
    this.victoryMenu.style.display = 'none';
  }

  hideMenus() {
    this.startMenu.style.display = 'none';
    this.victoryMenu.style.display = 'none';
  }

  showVictory(time) {
    this.victoryTimeEl.textContent = `${Math.floor(time/60).toString().padStart(2,'0')}:${Math.floor(time%60).toString().padStart(2,'0')}`;
    this.victoryMenu.style.display = 'block';
    this.startMenu.style.display = 'none';
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    this.pauseBtn.texttextContent = this.isPaused ? '▶' : '❚❚';
    if (this.onPauseToggle) this.onPauseToggle(this.isPaused);
  }
  startGame() {
    if (this.onStart) this.onStart();
  }
  nextLevel() {
    if (this.onNext) this.onNext();
  }
  replayLevel() {
    if (this.onReplay) this.onReplay();
  }
  showSettings() {
    // placeholder
    alert('Settings not implemented');
  }
  showCredits() {
    // placeholder
    alert('Credits not implemented');
  }
}
