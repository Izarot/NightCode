let highScore = 0;

export function loadHighScore() {
  const saved = localStorage.getItem('stanchion_highscore');
  return saved ? parseInt(saved) : 0;
}

export function saveHighScore(score) {
  localStorage.setItem('stanchion_highscore', score);
  highScore = score;
}

export function updateHUD(gameState) {
  document.getElementById('timer').textContent = `${Math.floor(gameState.timer / 60)}:${(gameState.timer % 60).toFixed(2).padStart(4, '0')}`;
  document.getElementById('score').textContent = gameState.score;
  document.getElementById('high-score').textContent = gameState.highScore;
  const staminaFill = document.getElementById('stamina-fill');
  staminaFill.style.width = `${(gameState.stamina / gameState.maxStamina) * 100}%`;
  document.getElementById('strikes').textContent = `${gameState.strikes}/3`;
}
}