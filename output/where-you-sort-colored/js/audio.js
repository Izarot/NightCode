export class Audio {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.enabled = true;
  }
  resume() { if (this.ctx.state === 'suspended') this.ctx.resume(); }
  tone(freq, dur, type='sine', vol=0.1, start=0) {
    if (!this.enabled) return;
    this.resume();
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g).connect(this.ctx.destination);
    const t = this.ctx.currentTime + start;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t); o.stop(t + dur);
  }
  click() { this.tone(800, 0.05, 'square', 0.05); }
  pour(count) { for (let i = 0; i < count; i++) this.tone(200 + i * 50, 0.15, 'triangle', 0.08, i * 0.05); }
  match() { this.tone(600, 0.1); this.tone(800, 0.1, 'sine', 0.1, 0.1); this.tone(1000, 0.15, 'sine', 0.1, 0.2); }
  win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.2, 'sine', 0.15, i * 0.1)); }
  error() { this.tone(200, 0.2, 'sawtooth', 0.1); }
  hint() { this.tone(400, 0.1); this.tone(600, 0.1, 'sine', 0.1, 0.1); }
}