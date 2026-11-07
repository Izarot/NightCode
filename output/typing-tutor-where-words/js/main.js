// Main game loop and state
let lastTime = 0;
let gameRunning = true;
function gameLoop(timestamp) {
    if (!gameRunning) return;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    updateWords(dt);
    render();
    requestAnimationFrame(gameLoop);
}
// Initialize
initAudio();
initInput();
updateHUD();
// Start first word
setTimeout(() => spawnWord(), 1000);
requestAnimationFrame(gameLoop);