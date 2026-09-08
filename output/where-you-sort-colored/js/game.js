import { Renderer } from './render.js';
import { Input } from './input.js';
import { LevelManager } from './level.js';
import { UI } from './ui.js';
import { Audio } from './audio.js';
import { saveState, loadState } from './utils.js';

export class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    this.renderer = new Renderer(ctx);
    this.input = new Input(canvas, this);
    this.levels = new LevelManager();
    this.ui = new UI(this);
    this.audio = new Audio();
    this.state = 'menu';
    this.currentLevel = 0;
    this.tubes = [];
    this.selected = null;
    this.moves = 0;
    this.startTime = 0;
    this.timer = 0;
    this.history = [];
    this.hints = 3;
    this.bestTimes = loadState('bestTimes', {});
    this.bestMoves = loadState('bestMoves', {});
    this.completed = loadState('completed', []);
    this.particles = [];
    this.wobbleTime = 0;
    this.initLevel(0);
  }
  resize(w, h) { this.width = w; this.height = h; this.renderer.resize(w, h); this.ui.resize(w, h); }
  initLevel(idx) {
    this.currentLevel = idx;
    const level = this.levels.get(idx);
    this.tubes = level.map(cols => ({ cols, x: 0, y: 0, w: 0, h: 0, targetY: 0, shake: 0 }));
    this.selected = null;
    this.moves = 0;
    this.startTime = performance.now();
    this.timer = 0;
    this.history = [];
    this.hints = 3;
    this.particles = [];
    this.state = 'playing';
    this.layoutTubes();
  }
  layoutTubes() {
    const cols = Math.min(4, this.tubes.length);
    const rows = Math.ceil(this.tubes.length / cols);
    const padding = 20;
    const tubeW = (this.width - padding * (cols + 1)) / cols;
    const tubeH = Math.min(tubeW * 3.5, (this.height - 120 - padding * (rows + 1)) / rows);
    const startX = (this.width - (tubeW * cols + padding * (cols - 1))) / 2;
    const startY = 80 + (this.height - 120 - (tubeH * rows + padding * (rows - 1))) / 2;
    this.tubes.forEach((t, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      t.w = tubeW;
      t.h = tubeH;
      t.x = startX + col * (tubeW + padding);
      t.y = startY + row * (tubeH + padding);
      t.targetY = t.y;
    });
  }
  update(ts) {
    if (this.state !== 'playing') return;
    this.timer = (ts - this.startTime) / 1000;
    this.wobbleTime += 0.02;
    this.tubes.forEach(t => {
      t.y += (t.targetY - t.y) * 0.15;
      t.shake *= 0.8;
    });
    this.particles = this.particles.filter(p => p.update());
    this.checkWin();
  }
  render() {
    this.renderer.clear(this.width, this.height);
    this.renderer.drawBackground(this.width, this.height, this.wobbleTime);
    this.tubes.forEach(t => this.renderer.drawTube(t, this.wobbleTime, t === this.selected));
    this.particles.forEach(p => this.renderer.drawParticle(p));
    this.ui.draw(this.moves, this.timer, this.hints, this.state);
  }
  onTubeTap(index) {
    if (this.state !== 'playing') return;
    const tube = this.tubes[index];
    if (this.selected === null) {
      if (tube.cols.length > 0) { this.selected = index; this.audio.click(); }
    } else if (this.selected === index) {
      this.selected = null;
    } else {
      this.tryPour(this.selected, index);
      this.selected = null;
    }
  }
  tryPour(fromIdx, toIdx) {
    const from = this.tubes[fromIdx];
    const to = this.tubes[toIdx];
    if (from.cols.length === 0 || to.cols.length >= 4) { this.shake(fromIdx, toIdx); return false; }
    const color = from.cols[from.cols.length - 1];
    if (to.cols.length > 0 && to.cols[to.cols.length - 1] !== color) { this.shake(fromIdx, toIdx); return false; }
    let count = 1;
    for (let i = from.cols.length - 2; i >= 0 && from.cols[i] === color && count < 4 - to.cols.length; i--) count++;
    this.saveHistory();
    const moving = from.cols.splice(-count);
    to.cols.push(...moving);
    this.moves++;
    this.audio.pour(count);
    this.spawnPourParticles(from, to, color, count);
    if (to.cols.length === 4 && to.cols.every(c => c === color)) this.audio.match();
    return true;
  }
  shake(a, b) { this.tubes[a].shake = 10; this.tubes[b].shake = 10; this.audio.error(); navigator.vibrate?.(50); }
  saveHistory() { this.history.push({ tubes: this.tubes.map(t => [...t.cols]), moves: this.moves }); }
  undo() {
    if (this.history.length === 0) return;
    const h = this.history.pop();
    this.tubes.forEach((t, i) => t.cols = [...h.tubes[i].cols]);
    this.moves = h.moves;
    this.audio.click();
  }
  hint() {
    if (this.hints <= 0) return;
    for (let i = 0; i < this.tubes.length; i++) {
      for (let j = 0; j < this.tubes.length; j++) {
        if (i !== j && this.canPour(i, j)) {
          this.tubes[i].shake = 15;
          this.tubes[j].shake = 15;
          this.hints--;
          this.audio.hint();
          setTimeout(() => { this.tubes[i].shake = 0; this.tubes[j].shake = 0; }, 1000);
          return;
        }
      }
    }
  }
  canPour(i, j) {
    const from = this.tubes[i], to = this.tubes[j];
    if (from.cols.length === 0 || to.cols.length >= 4) return false;
    const color = from.cols[from.cols.length - 1];
    return to.cols.length === 0 || to.cols[to.cols.length - 1] === color;
  }
  spawnPourParticles(from, to, color, count) {
    const sx = from.x + from.w / 2;
    const sy = from.y + from.h - from.cols.length * (from.h * 0.22) - 5;
    const tx = to.x + to.w / 2;
    const ty = to.y + to.h - to.cols.length * (to.h * 0.22) + 5;
    for (let i = 0; i < count * 3; i++) {
      this.particles.push({ x: sx, y: sy, tx, ty, color, life: 1, size: 4 + Math.random() * 4, delay: i * 30 });
    }
  }
  checkWin() {
    const done = this.tubes.every(t => t.cols.length === 0 || (t.cols.length === 4 && t.cols.every(c => c === t.cols[0])));
    if (done) this.win();
  }
  win() {
    this.state = 'win';
    this.audio.win();
    navigator.vibrate?.([100, 50, 100]);
    const time = this.timer;
    const key = String(this.currentLevel);
    const isBestTime = !this.bestTimes[key] || time < this.bestTimes[key];
    const isBestMove = !this.bestMoves[key] || this.moves < this.bestMoves[key];
    if (isBestTime) this.bestTimes[key] = time;
    if (isBestMove) this.bestMoves[key] = this.moves;
    saveState('bestTimes', this.bestTimes);
    saveState('bestMoves', this.bestMoves);
    if (!this.completed.includes(this.currentLevel)) {
      this.completed.push(this.currentLevel);
      saveState('completed', this.completed);
    }
    this.ui.showWin(this.moves, time, isBestTime, isBestMove, this.currentLevel < this.levels.count() - 1);
  }
  nextLevel() { if (this.currentLevel < this.levels.count() - 1) this.initLevel(this.currentLevel + 1); }
  restart() { this.initLevel(this.currentLevel); }
  menu() { this.state = 'menu'; this.ui.showMenu(this.completed.length, this.levels.count()); }
  pause() { this.state = this.state === 'playing' ? 'paused' : 'playing'; }
}