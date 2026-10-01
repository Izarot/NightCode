class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.enabled = true;
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.5;
    this.sounds = {};
    this._createSounds();
  }

  _createSounds() {
    // Pickup: soft click
    this.sounds.pickup = () => this._playTone(800, 0.05, 'square', 0.2);
    // Drop: thud, pitch varies with mass
    this.sounds.drop = (mass) => this._playTone(200 / mass, 0.15, 'sine', 0.3);
    // Tilt: creaking
    this.sounds.tilt = () => this._playNoise(0.1, 0.1);
    // Balance: chime
    this.sounds.balance = () => {
      this._playTone(523.25, 0.1, 'sine', 0.3);
      setTimeout(() => this._playTone(659.25, 0.1, 'sine', 0.3), 100);
      setTimeout(() => this._playTone(783.99, 0.2, 'sine', 0.3), 200);
    };
    // Error: buzz
    this.sounds.error = () => this._playTone(100, 0.2, 'sawtooth', 0.2);
    // Hint: whoosh
    this.sounds.hint = () => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      osc.connect(gain).connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    };
    // Click UI
    this.sounds.click = () => this._playTone(1000, 0.03, 'triangle', 0.15);
  }

  _playTone(freq, dur, type, vol) {
    if (!this.enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(gain).connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  _playNoise(dur, vol) {
    if (!this.enabled) return;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    source.connect(gain).connect(this.masterGain);
    source.start();
  }

  play(name, ...args) {
    if (this.sounds[name]) this.sounds[name](...args);
  }

  setEnabled(v) { this.enabled = v; }
  setVolume(v) { this.masterGain.gain.value = v; }
  resume() { if (this.ctx.state === 'suspended') this.ctx.resume(); }
}

const audio = new AudioManager();
