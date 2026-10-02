export function getHighScore() {
  const val = localStorage.getItem('chronoclash_highscore');
  return val ? parseInt(val, 10) : 0;
}
export function setHighScore(score) {
  localStorage.setItem('chronoclash_highscore', score.toString());
}
