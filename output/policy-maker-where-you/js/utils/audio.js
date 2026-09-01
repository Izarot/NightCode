const Audio = {
  ctx: null,
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
  beep(freq, dur, type='sine', vol=0.1) {
    try {
      this.init();
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.value = freq; o.type = type;
      g.gain.setValueAtTime(vol, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(); o.stop(this.ctx.currentTime + dur);
    } catch(e) {}
  },
  click() { this.beep(800, 0.05, 'square', 0.05); },
  alert() { this.beep(440, 0.2, 'sawtooth', 0.1); setTimeout(() => this.beep(220, 0.3), 100); },
  win() { this.beep(523, 0.1); setTimeout(() => this.beep(659, 0.1), 100); setTimeout(() => this.beep(784, 0.2), 200); }
};
