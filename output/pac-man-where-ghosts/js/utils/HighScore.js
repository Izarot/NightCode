export class HighScore {
  constructor() {
    this.key = 'alliedGhostsHighScore';
  }

  get() {
    return parseInt(localStorage.getItem(this.key) || '0', 10);
  }

  save(score) {
    const high = this.get();
    if (score > high) {
      localStorage.setItem(this.key, score.toString());
    }
  }
}
