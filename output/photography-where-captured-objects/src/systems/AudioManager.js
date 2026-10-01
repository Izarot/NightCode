export class AudioManager {
  constructor() {
    this.audioContext = null;
    this.musicEnabled = true;
    this.musicGain = null;
    this.sounds = {};
    this.init();
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  createBeep(frequency, duration, type = 'sine') {"    if (!this.audioContext) return null;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.frequency.value = frequency;
    osc.type = type;
    gain.gain.setValueAtTime(0.001, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + duration);
    return { osc, gain };
  }

  playShutter() {
    this.createBeep(880, 0.05, 'square');
    this.createBeep(440, 0.05, 'square');
  }

  playCapture() {
    this.createBeep(660, 0.1, 'sine');
    this.createBeep(880, 0.1, 'sine');
  }

  playMiss() {
    this.createBeep(220, 0.1, 'sawtooth');
  }

  playMusic() {
    if (!this.musicEnabled || !this.audioContext) return;
    if (this.musicGain) return; // Already playing

    const ctx = this.audioContext;
    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = 0.05;
    this.musicGain.connect(ctx.destination);

    // Simple background tone sequence
    const playNote = (freq, time) => {
      const osc = ctx.createOscillator();
      osc.connect(this.musicGain);
      osc.frequency.value = freq;
      osc.type = 'sine';
      osc.start(time);
      osc.stop(time + 0.2);
    };

    const notes = [523.25, 587.33, 659.25, 698.46]; // C, D, E, F
    let t = ctx.currentTime;
    for (let i = 0; i < 16; i++) {
      const note = notes[i % notes.length];
      playNote(note, t);
      t += 0.25;
    }
  }

  pauseMusic() {
    if (this.musicGain) {
      this.musicGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
      setTimeout(() => {
        if (this.musicGain) {
          this.musicGain.disconnect();
          this.musicGain = null;
        }
      }, 500);
    }
  }

  stopMusic() {
    this.pauseMusic();
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.pauseMusic();
    } else {
      this.playMusic();
    }
  }

  isMusicEnabled() {
    return this.musicEnabled;
  }
}
