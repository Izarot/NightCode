import { TETROMINOES, PIECE_TYPES } from './TetrominoDefinitions.js';

export class PieceFactory {
  constructor() {
    this.bag = [];
  }

  refillBag() {
    const next = PIECE_TYPES.slice();
    // Fisher-Yates shuffle
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    this.bag.push(...next);
  }

  next() {
    if (this.bag.length === 0) this.refillBag();
    return this.bag.shift();
  }

  preview(n) {
    while (this.bag.length < n) this.refillBag();
    return this.bag.slice(0, n);
  }

  create(type) {
    const def = TETROMINOES[type];
    return {
      type,
      color: def.color,
      glow: def.glow,
      orientation: 0,
      x: 3, // top-center for non-I
      y: type === 'I' ? -2 : -1,
      blocks: this.buildBlocks(type, 0, 3, type === 'I' ? -2 : -1),
      spinAngle: 0,
      lockTimer: 0,
      locked: false
    };
  }

  buildBlocks(type, orientation, ox, oy) {
    const def = TETROMINOES[type];
    const cells = def.shapes[orientation];
    return cells.map(([dx, dy]) => ({
      x: ox + dx,
      y: oy + dy,
      spinAngle: 0
    }));
  }
}
