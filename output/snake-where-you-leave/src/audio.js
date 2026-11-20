export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterGain = null;
    this.init();
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.3;
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(frequency, duration, type = 'sine', volume = 1, freqMod = null) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.type = type;
    osc.frequency.value = frequency;

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    if (freqMod) {
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(freqMod, now + duration);
    }

    osc.start(now);
    osc.stop(now + duration);
  }

  playNoise(duration, volume = 1, filterFreq = 2000) {
    if (!this.enabled || !this.ctx) return;
    this.resume();

    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * 0.1, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  // Game sounds
  sfxMove() {
    this.playTone(220, 0.05, 'square', 0.5);
  }

  sfxEat() {
    this.playTone(440, 0.1, 'triangle', 0.6, 880);
    setTimeout(() => this.playTone(660, 0.08, 'triangle', 0.4), 50);
  }

  sfxSlip() {
    this.playTone(150, 0.15, 'sawtooth', 0.4, 80);
    this.playNoise(0.1, 0.2, 800);
  }

  sfxDeath() {
    this.playTone(200, 0.3, 'sawtooth', 0.6, 50);
    setTimeout(() => this.playTone(100, 0.5, 'sine', 0.4), 100);
    this.playNoise(0.5, 0.3, 300);
  }

  sfxBoost() {
    this.playTone(300, 0.1, 'square', 0.5, 600);
    setTimeout(() => this.playTone(500, 0.1, 'square', 0.4), 50);
    setTimeout(() => this.playTone(700, 0.1, 'square', 0.3), 100);
  }

  sfxEvaporate() {
    this.playTone(800, 0.05, 'sine', 0.2);
  }

  sfxMenuSelect() {
    this.playTone(523, 0.08, 'sine', 0.4);
  }

  sfxMenuNavigate() {
    this.playTone(350, 0.05, 'sine', 0.2);
  }
}

// Singleton
export const audio = new AudioEngine();