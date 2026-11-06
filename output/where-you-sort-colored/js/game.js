// game.js
export class Tube {
  constructor(id, initialColors = []) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.width = 80;
    this.height = 300;
    this.unitHeight = 75;
    this.contents = [];
    this.populate(initialColors);
  }
  populate(colors) {
    this.contents = colors.slice();
  }
  topColor() {
    return this.contents.length ? this.contents[this.contents.length - 1] : 'transparent';
  }
  isEmpty() {
    return this.contents.length === 0;
  }
  push(color) {
    this.contents.push(color);
  }
  pop() {
    return this.contents.pop();
  }
  draw(ctx) {
    ctx.fillStyle = '#555';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    for (let i = 0; i < this.contents.length; i++) {
      ctx.fillStyle = this.contents[i];
      ctx.fillRect(this.x, this.y + i * this.unitHeight, this.width, this.unitHeight);
    }
  }
}

export class Game {
  constructor() {
    this.state = 'playing';
    this.levelIndex = 0;
    this.moves = 0;
    this.timer = 0;
    this.highScore = parseInt(localStorage.getItem('wsHighScore')) || 0;
    this.levels = [];
    this.tubes = [];
    this.pouring = null;
    this.undoStack = [];
    this.hintCount = 3;
  }

  async loadLevels() {
    const resp = await fetch('data/levels.json');
    const data = await resp.json();
    this.levels = data;
    this.startLevel();
  }

  startLevel() {
    const level = this.levels[this.levelIndex];
    this.tubes = [];
    for (let i = 0; i < level.tubeCount; i++) {
      const tube = new Tube(i, level.initial[i]);
      tube.x = 0;
      tube.y = 0;
      this.tubes.push(tube);
    }
    this.moves = 0;
    this.timer = 0;
    this.pouring = null;
    this.undoStack = [];
    this.hintCount = 3;
    this.updateHighScore();
  }

  updateHighScore() {
    const best = this.moves;
    if (best < this.highScore) {
      this.highScore = best;
      localStorage.setItem('wsHighScore', this.highScore);
    }
  }

  update(delta) {
    if (this.state !== 'playing') return;
    this.timer += delta;
    if (this.isWin()) {
      this.win();
    }
  }

  isWin() {
    for (const tube of this.tubes) {
      if (tube.isEmpty()) continue;
      const color = tube.topColor();
      for (const liquid of tube.contents) {
        if (liquid !== color) return false;
      }
    }
    return true;
  }

  win() {
    this.state = 'win';
    this.audio.playSound('success');
  }

  pour(fromIdx, toIdx) {
    const from = this.tubes[fromIdx];
    const to = this.tubes[toIdx];
    if (from.isEmpty()) return;
    const srcColor = from.topColor();
    const dstColor = to.topColor();
    if (srcColor !== 'transparent' && dstColor !== 'transparent' && srcColor !== dstColor) return;
    const movedColor = from.pop();
    to.push(movedColor);
    this.moves++;
    this.undoStack.push({fromIdx, toIdx, movedColor});
  }

  undo() {
    if (this.undoStack.length === 0) return;
    const {fromIdx, toIdx, movedColor} = this.undoStack.pop();
    const from = this.tubes[fromIdx];
    const to = this.tubes[toIdx];
    const idx = to.contents.indexOf(movedColor);
    if (idx !== -1) {
      to.contents.splice(idx, 1);
    }
    from.push(movedColor);
    this.moves--;
  }

  hint() {
    if (this.hintCount <= 0) return;
    for (let i = 0; i < this.tubes.length; i++) {
      if (this.tubes[i].isEmpty()) continue;
      const srcColor = this.tubes[i].topColor();
      for (let j = 0; j < this.tubes.length; j++) {
        if (i === j) continue;
        const dst = this.tubes[j];
        if (dst.isEmpty() || dst.topColor() === srcColor) {
          this.hintCount--;
          this.pour(i, j);
          return;
        }
      }
    }
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}