export class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.master.gain.value = 0.5;
    this.sounds = {};
    this._generateSounds();
  }

  _generateSounds() {
    this.sounds.kick = this._makeClick(110, 0.1);
    this.sounds.hook = this._makeClick(220, 0.1);
    this.sounds.collect = this._makeClick(440, 0.1);
    this.sounds.death = this._makeClick(880, 0.2);
  }

  _makeClick(freq, dur) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.stop(this.ctx.currentTime + dur);
    return { osc, gain };
  }

  play(name) {
    if (this.sounds[name]) {
      const s = this._makeClick(name === 'kick' ? 110 : name === 'hook' ? 220 : name === 'collect' ? 440 : 880, 0.1);
    }
  }
}
