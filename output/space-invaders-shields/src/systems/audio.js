export class Audio {
  constructor() {
    this.ctx = null;
    try { this.ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e) {}
  }
  beep(freq, dur, type='square', vol=0.06) {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + dur);
  }
  shoot() { this.beep(900, 0.08, 'square', 0.04); }
  bomb() {
    this.beep(200, 0.2, 'sawtooth', 0.08);
    this.beep(100, 0.3, 'triangle', 0.05);
  }
  hit() { this.beep(220, 0.15, 'sawtooth', 0.06); }
  boom() { this.beep(80, 0.4, 'triangle', 0.1); }
  ui() { this.beep(440, 0.05, 'square', 0.04); }
}
