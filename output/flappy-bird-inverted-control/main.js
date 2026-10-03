let lastTime = 0;

function gameLoop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;

  physics.update(deltaTime);
  renderer.render();

  requestAnimationFrame(gameLoop);
}

// Initialize audio context
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playJumpSound() {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.1);
  gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.2);
}

// Patch jump to play sound
const originalJump = physics.jump;
physics.jump = function() {
  originalJump.call(this);
  playJumpSound();
};

// Start the game loop
requestAnimationFrame(gameLoop);

// Handle initial click/tap to start
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && (physics.gameState === STATE.IDLE || physics.gameState === STATE.GAME_OVER)) {
    physics.reset();
  }
});

window.addEventListener('touchstart', (e) => {
  if (physics.gameState === STATE.IDLE || physics.gameState === STATE.GAME_OVER) {
    physics.reset();
  }
}, { passive: true });