import { Grid } from './grid.js';
import { Sound } from '../utils/sound.js';

export class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.grid = new Grid(5, 5);
    this.state = 'IDLE';
    this.selected = null;
    this.moveCount = 0;
    this.equations = 0;
    this.targetEquations = 3;
    this.moveLimit = 30;
    this.timeLimit = 60;
    this.timer = null;
    this.timeLeft = this.timeLimit;
    this.undoStack = [];
    this.hintCooldown = 0;
    this.sound = new Sound();
    this.highScore = localStorage.getItem('eqHighScore') || 0;
    this.score = 0;
    this.startTime = null;
  }

  init() {
    this.grid.init();
    this.moveCount = 0;
    this.equations = 0;
    this.timeLeft = this.timeLimit;
    this.undoStack = [];
    this.hintCooldown = 0;
    this.startTime = Date.now();
    this.updateHUD();
    this.startTimer();
    this.render();
  }

  startTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) this.timeLeft = 0;
      this.updateTimer();
      if (this.timeLeft === 0) this.endLevel(false);
    }, 1000);
  }

  updateTimer() {
    const el = document.querySelector('.timer');
    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;
    el.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    if (this.timeLeft <= 10) el.classList.add('warning');
    else el.classList.remove('warning');
  }

  updateHUD() {
    document.getElementById('moves').textContent = `Moves: ${this.moveCount} / ${this.moveLimit}`;
    document.getElementById('equations').textContent = `Eq: ${this.equations} / ${this.targetEquations}`;
    document.getElementById('level').textContent = `Level: 1`;
    document.getElementById('score').textContent = `Score: ${this.score}`;
  }

  resize() {
    const size = Math.min(window.innerWidth * 0.9, 600);
    this.canvas.width = size;
    this.canvas.height = size;
    this.grid.cellSize = size / this.grid.size;
    this.render();
  }

  render() {
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = 'radial-gradient(circle at center, #0d1117, #1e293b)';
    ctx.fillRect(0, 0, width, height);
    
    this.grid.draw(ctx);
  }

  handleClick(x, y) {
    if (this.state !== 'IDLE') return;
    
    const cell = this.grid.getCell(x, y);
    if (!cell) return;
    
    if (!this.selected) {
      this.selected = cell;
      this.grid.selectTile(cell);
    } else {
      if (this.grid.isAdjacent(this.selected, cell)) {
        this.swap(this.selected, cell);
      } else {
        this.selected = null;
        this.grid.clearSelection();
      }
    }
    this.render();
  }

  swap(a, b) {
    if (this.moveCount >= this.moveLimit) return;
    
    this.undoStack.push({ a, b });
    this.moveCount++;
    this.sound.play('swap');
    
    [a.value, b.value] = [b.value, a.value];
    this.grid.clearSelection();
    this.selected = null;
    
    this.checkEquations();
    this.updateHUD();
  }

  checkEquations() {
    const found = this.grid.findEquations();
    if (found.length > 0) {
      this.sound.play('clear');
      this.clearTiles(found);
    }
  }

  clearTiles(tiles) {
    this.grid.clearTiles(tiles);
    this.equations++;
    this.score += 100 + (this.moveLimit - this.moveCount) * 2;
    this.updateHUD();
    
    if (this.equations >= this.targetEquations) {
      this.endLevel(true);
    }
  }

  undo() {
    if (this.undoStack.length === 0) return;
    
    const last = this.undoStack.pop();
    [last.a.value, last.b.value] = [last.b.value, last.a.value];
    this.moveCount--;
    this.sound.play('undo');
    this.updateHUD();
    this.render();
  }

  hint() {
    if (this.hintCooldown > 0) return;
    
    const eq = this.grid.findEquations();
    if (eq.length > 0) {
      this.grid.highlightTiles(eq);
      this.hintCooldown = 10;
      this.score = Math.max(0, this.score - 50);
      this.updateHUD();
    }
  }

  reset() {
    this.init();
  }

  endLevel(won) {
    clearInterval(this.timer);
    if (won) {
      const timeBonus = this.timeLeft * 5;
      this.score += timeBonus;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('eqHighScore', this.highScore);
      }
      alert(`Level Complete! +${timeBonus} time bonus
Score: ${this.score}
High Score: ${this.highScore}`);
    }
  }
}

export class Grid {
  constructor(size, size) {
    this.size = size;
    this.cells = [];
    this.cellSize = 600 / size;
    this.selected = null;
    this.highlighted = [];
  }

  init() {
    this.cells = [];
    for (let r = 0; r < this.size; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.size; c++) {
        const val = Math.random() > 0.7 ? (Math.random() > 0.5 ? '=' : this.randOp()) : this.randNum();
        this.cells[r][c] = { value: val, row: r, col: c };
      }
    }
    this.placeEquation();
  }

  randNum() { return Math.floor(Math.random() * 10); }
  randOp() { return ['+', '-', '×', '÷'][Math.floor(Math.random() * 4)]; }

  placeEquation() {
    const r = Math.floor(Math.random() * this.size);
    const c = Math.floor(Math.random() * (this.size - 3));
    this.cells[r][c] = { value: 3, row: r, col: c };
    this.cells[r][c+1] = { value: '+', row: r, col: c+1 };
    this.cells[r][c+2] = { value: 4, row: r, col: c+2 };
    this.cells[r][c+3] = { value: '=', row: r, col: c+3 };
    this.cells[r][c+4] = { value: 7, row: r, col: c+4 };
  }

  getCell(x, y) {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
      return this.cells[row][col];
    }
    return null;
  }

  isAdjacent(a, b) {
    return (Math.abs(a.row - b.row) + Math.abs(a.col - b.col)) === 1;
  }

  selectTile(tile) {
    this.selected = tile;
  }

  clearSelection() {
    this.selected = null;
    this.highlighted = [];
  }

  draw(ctx) {
    const s = this.cellSize;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = this.cells[r][c];
        const x = c * s;
        const y = r * s;
        
        ctx.strokeStyle = '#334155';
        ctx.globalAlpha = 0.4;
        ctx.strokeRect(x, y, s, s);
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = '#1e2d3b';
        ctx.fillRect(x, y, s, s);
        
        if (this.selected === cell) {
          ctx.shadowColor = 'rgba(255, 185, 0, 0.5)';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#1e2d3b';
          ctx.fillRect(x, y, s * 1.12, s * 1.12);
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#ffb900';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + s * 0.06, y + s * 0.06, s * 1.12, s * 1.12);
          ctx.lineWidth = 1;
        }
        
        ctx.fillStyle = typeof cell.value === 'number' ? '#f8fafc' : '#a78bfa';
        ctx.font = 'bold 48px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.value, x + s/2, y + s/2 + 4);
      }
    }
  }

  findEquations() {
    const results = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const eq = this.parseRow(r, c, true);
        if (eq) results.push(...eq.tiles);
      }
    }
    return results;
  }

  parseRow(startRow, startCol, horizontal) {
    const tiles = [];
    let eq = '';
    let foundEq = false;
    
    for (let i = 0; i < this.size; i++) {
      const cell = horizontal ? this.cells[startRow][startCol + i] : this.cells[startRow + i][startCol];
      if (!cell) break;
      if (cell.value === '=') {
        foundEq = true;
        break;
      }
      eq += cell.value;
      tiles.push(cell);
    }
    
    if (foundEq) {
      const resultCell = horizontal ? this.cells[startRow][startCol + i + 1] : this.cells[startRow + i + 1][startCol];
      if (resultCell) {
        tiles.push(resultCell);
        const result = this.evaluate(eq + '=' + resultCell.value);
        if (result) return { valid: true, tiles };
      }
    }
    return null;
  }

  evaluate(expr) {
    const parts = expr.split('=');
    if (parts.length !== 2) return null;
    
    const left = parts[0];
    const right = parseInt(parts[1]);
    
    let result = 0;
    let op = '+';
    
    for (let i = 0; i < left.length; i++) {
      const char = left[i];
      if (char === '+' || char === '-' || char === '×' || char === '÷') {
        op = char;
      } else {
        const num = parseInt(char);
        if (op === '+') result += num;
        else if (op === '-') result -= num;
        else if (op === '×') result *= num;
        else if (op === '÷') result = Math.floor(result / num);
      }
    }
    
    return result === right ? result : null;
  }

  clearTiles(tiles) {
    for (const tile of tiles) {
      this.cells[tile.row][tile.col] = { value: this.randNum(), row: tile.row, col: tile.col };
    }
  }

  highlightTiles(tiles) {
    this.highlighted = tiles;
  }
}