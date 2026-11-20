import { DIRECTIONS } from '../config.js';

export class InputManager {
  constructor() {
    this.directionQueue = [];
    this.currentDir = DIRECTIONS.RIGHT;
    this.pendingDir = null;
    this.actionPressed = false;
    this.actionJustPressed = false;
    this.touchStart = null;
    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
    canvas.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: false });
  }

  onKeyDown(e) {
    const key = e.key.toLowerCase();
    let newDir = null;

    switch (key) {
      case 'arrowup':
      case 'w':
        newDir = DIRECTIONS.UP;
        break;
      case 'arrowdown':
      case 's':
        newDir = DIRECTIONS.DOWN;
        break;
      case 'arrowleft':
      case 'a':
        newDir = DIRECTIONS.LEFT;
        break;
      case 'arrowright':
      case 'd':
        newDir = DIRECTIONS.RIGHT;
        break;
      case ' ': // Space
        this.actionJustPressed = true;
        this.actionPressed = true;
        e.preventDefault();
        break;
      case 'escape':
        // Pause handled in game
        break;
    }

    if (newDir) {
      this.queueDirection(newDir);
      e.preventDefault();
    }
  }

  onKeyUp(e) {
    if (e.key === ' ') {
      this.actionPressed = false;
    }
  }

  onTouchStart(e) {
    const touch = e.touches[0];
    this.touchStart = { x: touch.clientX, y: touch.clientY };
    e.preventDefault();
  }

  onTouchMove(e) {
    if (!this.touchStart) return;
    const touch = e.touches[0];
    const dx = touch.clientX - this.touchStart.x;
    const dy = touch.clientY - this.touchStart.y;

    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.queueDirection(dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT);
      } else {
        this.queueDirection(dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);
      }
      this.touchStart = null;
    }
    e.preventDefault();
  }

  onTouchEnd(e) {
    this.touchStart = null;
    // Tap for action (boost)
    this.actionJustPressed = true;
    setTimeout(() => this.actionJustPressed = false, 0);
    e.preventDefault();
  }

  queueDirection(dir) {
    // Prevent 180-degree reversal
    if (this.currentDir.x + dir.x === 0 && this.currentDir.y + dir.y === 0) return;

    // Only queue if different from current and last queued
    const lastQueued = this.directionQueue[this.directionQueue.length - 1] || this.currentDir;
    if (lastQueued.x === dir.x && lastQueued.y === dir.y) return;

    if (this.directionQueue.length < 2) {
      this.directionQueue.push(dir);
    }
  }

  // Called each logic tick
  poll() {
    const action = this.actionJustPressed;
    this.actionJustPressed = false;

    if (this.directionQueue.length > 0) {
      this.pendingDir = this.directionQueue.shift();
    }

    return { action, pendingDir: this.pendingDir };
  }

  setCurrentDir(dir) {
    this.currentDir = dir;
    this.pendingDir = null;
  }

  getCurrentDir() {
    return this.currentDir;
  }

  isActionPressed() {
    return this.actionPressed;
  }
}