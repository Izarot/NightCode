export class AudioEngine {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.master.gain.value = 0.5;
  }
  playTone(freq, dur, type='sine') {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.master);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }
  playHit() { this.playTone(220, 0.1, 'square'); }
  playJump() { this.playTone(330, 0.15, 'sawtooth'); }
  playSpecial() { this.playTone(440, 0.3, 'triangle'); }
}