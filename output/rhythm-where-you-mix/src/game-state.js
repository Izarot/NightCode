// Global game state management
window.state = {
    running: false,
    score: 0,
    combo: 0,
    level: 1,
    timer: 0
};

function resetGame() {
    state.running = true;
    state.score = 0;
    state.combo = 0;
    state.level = 1;
    state.timer = 0;
}
