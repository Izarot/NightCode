/* ============================================
   Neon Bounce - Main Entry & HUD Updates
   ============================================ */
(() => {
    const canvas = document.getElementById('game-canvas');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const timerEl = document.getElementById('timer');
    const scoreEl = document.getElementById('score');
    const highScoreEl = document.getElementById('high-score');
    const finalScoreEl = document.get('final-score');
    const finalTimeEl = document.getElementById('final-time');
    const newBestEl = document.getElementById('new-best');

    const game = new Game(canvas);

    const updateHUD = () => {
        timerEl.textContent = game.formatTime(game.elapsed);
        scoreEl.textContent = String(game.score);
        highScoreEl.textContent = String(game.highScore);
    };

    const showGameOver = () => {
        const isNewBest = game.score >= game.highScore && game.score > 0;
        finalScoreEl.textContent = String(game.score);
        finalTimeEl.textContent = game.formatTime(game.elapsed);
        newBestEl.textContent = isNewBest ? 'YES!' : '-';
        newBestEl.style.color = isNewBest ? '#ffea00' : '#fff';
        gameOverScreen.classList.remove('hidden');
    };

    const startRun = () => {
        AudioEngine.init();
        AudioEngine.start();
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        game.start();
    };

    game.onGameOver = showGameOver;

    startBtn.addEventListener('click', startRun);
    restartBtn.addEventListener('click', startRun);

    // Allow Space/Enter to start/restart
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (!startScreen.classList.contains('hidden') && (key === ' ' || key === 'enter')) {
            e.preventDefault();
            startRun();
        } else if (!gameOverScreen.classList.contains('hidden') && (key === ' ' || key === 'enter' || key === 'r')) {
            e.preventDefault();
            startRun();
        }
    });

    // ============= Main Loop =============
    let lastFrame = performance.now();
    const loop = (now) => {
        const dt = Math.min((now - lastFrame) / 1000, 0.05);
        lastFrame = now;
        game.update(dt);
        game.render();
        updateHUD();
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
})();
