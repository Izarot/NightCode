// Web Audio API simple sound effects generator
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Audio not available');
    }
  }

  toggle() {
    this.muted = !this.muted;
    return this.muted;
  }

  beep(freq, duration, type = 'square', volume = 0.1) {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  move() { this.beep(220, 0.05, 'square', 0.05); }
  rotate() { this.beep(440, 0.06, 'triangle', 0.06); }
  lock() { this.beep(150, 0.1, 'sawtooth', 0.08); }
  clear(lines) {
    const base = 330;
    for (let i = 0; i < Math.min(lines, 4); i++) {
      setTimeout(() => this.beep(base * (1 + i * 0.25), 0.12, 'sine', 0.1), i * 50);
    }
  }
  levelUp() {
    this.beep(523, 0.1, 'sine', 0.1);
    setTimeout(() => this.beep(659, 0.1, 'sine', 0.1), 100);
    setTimeout(() => this.beep(784, 0.15, 'sine', 0.12), 200);
  }
  hardDrop() { this.beep(110, 0.08, 'sawtooth', 0.08); }
}
