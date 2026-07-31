class SoundManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.enabled = true;
  }
  playTone(freq, dur = 0.1, type = 'square') {
    if (!this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, this.ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + dur);
  }
  launch() { this.playTone(300, 0.1, 'sawtooth'); }
  explode() { this.playTone(100, 0.3, 'noise'); }
  hit() { this.playTone(200, 0.05, 'square'); }
  freeze() { this.playTone(600, 0.2, 'sine'); }
  poison() { this.playTone(400, 0.15, 'triangle'); }
}
const sound = new SoundManager();