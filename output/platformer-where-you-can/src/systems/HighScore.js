export function saveScore(score) {
  localStorage.setItem('highScore', score);
}
export function getScore() {
  return localStorage.getItem('highScore') || 0;
}
