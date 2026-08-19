export class LevelManager {
  constructor() {
    this.levels = this.generateLevels();
    this.currentLevel = 1;
    this.difficulty = 'medium';
  }

  generateLevels() {
    const levels = [];
    for (let i = 1; i <= 10; i++) {
      levels.push({
        id: i,
        imagePair: [`assets/img${i}L.png`, `assets/img${i}R.png`],
        differences: this.generateDifferences(i),
        timeLimit: 90 - (i - 1) * 5,
        difficulty: this.difficulty
      });
    }
    return levels;
  }

  generateDifferences(level) {
    const count = level <= 3 ? 5 : level <= 7 ? 6 : 7;
    const diffs = [];
    for (let i = 0; i < count; i++) {
      diffs.push({
        x: 150 + Math.random() * 300,
        y: 150 + Math.random() * 300,
        radius: 10 + Math.random() * 5,
        found: false
      });
    }
    return diffs;
  }

  getLevel(num, diff) {
    this.difficulty = diff;
    return this.levels[num - 1] || this.levels[this.levels.length - 1];
  }

  nextLevel() {
    this.currentLevel++;
  }
}

window.gameInstance = null;