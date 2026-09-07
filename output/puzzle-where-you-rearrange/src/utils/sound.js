export class Sound {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.enabled = true;
  }

  play(type) {
    if (!this.enabled) return;
    
    try {
      switch (type) {
        case 'swap':
          this.playTone(440, 0.1, 0.6);
          break;
        case 'clear':
          this.playArpeggio([523, 659, 784, 1047], 0.2);
          break;
        case 'undo':
          this.playTone(220, 0.15, 0.4);
          break;
      }
    } catch (e) {}
  }

  playTone(freq, duration, gain) {
    const osc = this.audioCtx.createOscillator();
    const g = this.audioCtx.createGain();
    osc.connect(g);
    g.connect(this.audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    g.gain.setValueAtTime(gain, this.audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  playArpeggio(frequencies, duration) {
    frequencies.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, duration, 0.3), i * duration * 1000);
    });
  }
}