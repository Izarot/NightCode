export class AudioManager {
  constructor() {
    this.ctx = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      this.initialized = false;
    }
  }

  playTone(freq, duration, type = 'sine', vol = 0.15) {
    if (!this.initialized) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  playDetection() {
    this.playTone(220, 0.1, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(110, 0.3, 'sawtooth', 0.25), 100);
  }

  playLevelComplete() {
    this.playTone(440, 0.15, 'sine', 0.2);
    setTimeout(() => this.playTone(660, 0.15, 'sine', 0.2), 150);
    setTimeout(() => this.playTone(880, 0.3, 'sine', 0.25), 300);
  }

  playStep() {
    this.playTone(80 + Math.random() * 40, 0.05, 'triangle', 0.05);
  }
}
