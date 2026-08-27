export class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.sounds = {};
    this.enabled = true;
  }

  createSound(name, frequency, type, duration) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.value = frequency;
    osc.type = type;
    this.sounds[name] = { osc, gain, duration };
  }

  init() {
    this.createSound('shoot', 200, 'square', 0.05);
    this.createSound('hit', 150, 'sawtooth', 0.1);
    this.createSound('death', 80, 'sine', 0.3);
  }

  play(name) {
    if (!this.enabled || !this.sounds[name]) return;
    const { osc, gain, duration } = this.sounds[name];
    osc.start();
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.stop(this.ctx.currentTime + duration);
  }
}
