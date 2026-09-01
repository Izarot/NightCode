import { GRID_W, GRID_H, createEmptyGrid, cloneGrid, isRowFull, clearRows } from '../utils/Grid.js';
import { collides } from '../utils/Collision.js';
import { TETROMINOES } from '../pieces/TetrominoDefinitions.js';
import { SRS_KICKS } from '../pieces/RotationSRS.js';
import { PieceFactory } from '../pieces/PieceFactory.js';
import { Storage } from '../utils/Storage.js';

const POINTS = { 1: 100, 2: 300, 3: 500, 4: 800 };
const LINES_PER_LEVEL = 10;

export class GameEngine {
  constructor(renderer, hud, audio, input) {
    this.renderer = renderer;
    this.hud = hud;
    this.audio = audio;
    this.input = input;
    this.factory = new PieceFactory();
    this.reset();
  }

  reset() {
    this.grid = createEmptyGrid();
    this.piece = this.factory.create(this.factory.next());
    this.heldType = null;
    this.canHold = true;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.highScore = Storage.load();
    this.dropTimer = 0;
    this.dropInterval = 1000;
    this.gameOver = false;
    this.paused = false;
    this.startTime = performance.now();
    this.elapsed = 0;
    this.particles = [];
    this.flash = 0;
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.hud.updateScore(0, this.highScore);
    this.hud.updateLevel(1);
    this.hud.updateLines(0);
    this.hud.updateTimer(0);
    this.hud.drawHold(null);
    this.hud.drawNext(this.factory.preview(5));
  }

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    this.hud.showPause(this.paused);
  }

  toggleMute() {
    const muted = this.audio.toggle();
    this.hud.setSoundIcon(muted);
  }

  spawnPiece() {
    const type = this.factory.next();
    this.piece = this.factory.create(type);
    this.canHold = true;
    if (collides(this.grid, this.piece.blocks)) {
      this.gameOver = true;
    }
  }

  tryMove(dx, dy) {
    const moved = this.piece.blocks.map(b => ({ x: b.x + dx, y: b.y + dy, spinAngle: b.spinAngle }));
    if (!collides(this.grid, moved)) {
      this.piece.x += dx;
      this.piece.y += dy;
      this.piece.blocks = moved;
      return true;
    }
    return false;
  }

  tryRotate(dir) {
    const from = this.piece.orientation;
    const to = (from + dir + 4) % 4;
    const key = from + '->' + to;
    const kickSet = this.piece.type === 'I' ? SRS_KICKS.I : SRS_KICKS.JLSTZ;
    if (this.piece.type === 'O') {
      this.piece.orientation = to;
      this.piece.blocks = this.factory.buildBlocks(this.piece.type, to, this.piece.x, this.piece.y);
      return;
    }
    const kicks = kickSet[key] || [[0, 0]];
    const newCells = TETROMINOES[this.piece.type].shapes[to];
    for (const [kx, ky] of kicks) {
      const test = newCells.map(([dx, dy]) => ({
        x: this.piece.x + dx + kx,
        y: this.piece.y + dy + ky,
        spinAngle: 0
      }));
      if (!collides(this.grid, test)) {
        this.piece.x += kx;
        this.piece.y += ky;
        this.piece.orientation = to;
        this.piece.blocks = test;
        // visual rotation effect
        for (const b of this.piece.blocks) b.spinAngle = (this.piece.spinAngle += dir * Math.PI / 2);
        this.audio.rotate();
        return;
      }
    }
  }

  hardDrop() {
    let dist = 0;
    while (this.tryMove(0, 1)) dist++;
    this.score += dist * 2;
    this.audio.hardDrop();
    this.lockPiece();
  }

  hold() {
    if (!this.canHold) return;
    this.canHold = false;
    const current = this.piece.type;
    if (this.heldType) {
      this.piece = this.factory.create(this.heldType);
    } else {
      this.spawnPiece();
    }
    this.heldType = current;
    this.hud.drawHold(this.heldType);
  }

  lockPiece() {
    const blocks = this.piece.blocks;
    for (const b of blocks) {
      if (b.y >= 0 && b.y < GRID_H) {
        this.grid[b.y][b.x] = {
          color: this.piece.color,
          glow: this.piece.glow,
          spinAngle: 0
        };
      }
    }
    this.audio.lock();
    this.shakeTime = 0.15;
    this.shakeIntensity = 4;
    this.spawnParticles(blocks, this.piece.color);
    this.checkLines();
    if (!this.gameOver) this.spawnPiece();
    this.hud.drawNext(this.factory.preview(5));
  }

  checkLines() {
    const full = [];
    for (let y = 0; y < GRID_H; y++) {
      if (isRowFull(this.grid, y)) full.push(y);
    }
    if (full.length === 0) return;
    this.audio.clear(full.length);
    this.flash = 0.4;
    // spawn particles for cleared rows
    for (const y of full) {
      for (let x = 0; x < GRID_W; x++) {
        const cell = this.grid[y][x];
        if (cell) this.spawnRowParticles(x, y, cell.color);
      }
    }
    clearRows(this.grid, full);
    const gained = (POINTS[full.length] || 0) * this.level;
    this.score += gained;
    this.lines += full.length;
    const newLevel = Math.floor(this.lines / LINES_PER_LEVEL) + 1;
    if (newLevel > this.level) {
      this.level = newLevel;
      this.dropInterval = Math.max(80, 1000 - (this.level - 1) * 80);
      this.audio.levelUp();
    }
    if (this.score > this.highScore) {
      this.highScore = this.score;
      Storage.save(this.highScore);
    }
    this.hud.updateScore(this.score, this.highScore);
    this.hud.updateLevel(this.level);
    this.hud.updateLines(this.lines);
  }

  spawnParticles(blocks, color) {
    for (const b of blocks) {
      if (b.y < 0) continue;
      const cs = this.renderer.cellSize;
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: b.x * cs + cs / 2 + (Math.random() - 0.5) * cs,
          y: b.y * cs + cs / 2,
          vx: (Math.random() - 0.5) * 200,
          vy: -Math.random() * 200 - 50,
          size: 4,
          color,
          alpha: 1,
          life: 0.6
        });
      }
    }
  }

  spawnRowParticles(x, y, color) {
    const cs = this.renderer.cellSize;
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: x * cs + cs / 2,
        y: y * cs + cs / 2,
        vx: (Math.random() - 0.5) * 400,
        vy: (Math.random() - 0.5) * 400,
        size: 5,
        color,
        alpha: 1,
        life: 0.8
      });
    }
  }

  update(dt) {
    if (this.paused || this.gameOver) {
      this.updateParticles(dt);
      return;
    }
    this.elapsed = (performance.now() - this.startTime) / 1000;
    this.hud.updateTimer(this.elapsed);

    // Soft drop
    if (this.input.isDown('ArrowDown')) {
      this.dropTimer += dt * 4;
    } else {
      this.dropTimer += dt * 1000;
    }

    while (this.dropTimer >= this.dropInterval) {
      this.dropTimer -= this.dropInterval;
      if (!this.tryMove(0, 1)) {
        this.lockPiece();
        break;
      } else if (this.input.isDown('ArrowDown')) {
        this.score += 1;
      }
    }

    this.updateParticles(dt);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2);
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 600 * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 0.8);
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  handleActions() {
    const acts = this.input.consume();
    for (const a of acts) {
      if (a === 'left') { if (this.tryMove(-1, 0)) this.audio.move(); }
      else if (a === 'right') { if (this.tryMove(1, 0)) this.audio.move(); }
      else if (a === 'soft') { if (this.tryMove(0, 1)) this.score += 1; }
      else if (a === 'rotate') { this.tryRotate(1); }
      else if (a === 'hard') { this.hardDrop(); }
      else if (a === 'hold') { this.hold(); }
      else if (a === 'pause') { this.togglePause(); }
      else if (a === 'mute') { this.toggleMute(); }
    }
  }

  render() {
    const r = this.renderer;
    r.clear();
    r.ctx.save();
    if (this.shakeTime > 0) {
      const intensity = this.shakeIntensity * (this.shakeTime / 0.15);
      r.ctx.translate(
        (Math.random() - 0.5) * intensity * r.dpr,
        (Math.random() - 0.5) * intensity * r.dpr
      );
    }
    r.drawGrid();
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        r.drawLockedCell(x, y, this.grid[y][x]);
      }
    }
    if (!this.gameOver && this.piece) {
      r.drawGhost(this.piece, this.grid);
      r.drawPiece(this.piece);
    }
    for (const p of this.particles) r.drawParticle(p);
    r.drawFlash(this.flash);
    r.ctx.restore();

    if (this.gameOver) {
      r.ctx.save();
      r.ctx.fillStyle = 'rgba(10, 0, 20, 0.75)';
      r.ctx.fillRect(0, 0, r.canvas.width, r.canvas.height);
      r.ctx.fillStyle = '#ff3366';
      r.ctx.shadowBlur = 20;
      r.ctx.shadowColor = '#ff3366';
      r.ctx.font = `bold ${48 * r.dpr}px Helvetica`;
      r.ctx.textAlign = 'center';
      r.ctx.fillText('GAME OVER', r.canvas.width / 2, r.canvas.height / 2);
      r.ctx.font = `${16 * r.dpr}px Helvetica`;
      r.ctx.fillStyle = '#eeeeee';
      r.ctx.fillText('Press R to restart', r.canvas.width / 2, r.canvas.height / 2 + 40 * r.dpr);
      r.ctx.restore();
    }
  }
}
