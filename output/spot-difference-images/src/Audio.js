export class AudioManager {
  constructor() {
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.enabled = true;
    this.loadSounds();
  }

  loadSounds() {
    this.sounds = {
      correct: this.createBeep(523.25, 0.1, 1),
      wrong: this.createBeep(261.63, 0.15, 0),
      hint: this.createBeep(329.63, 0.2, 0.8),
      complete: this.createBeep(783.99, 0.5, 1)
    };
  }

  createBeep(freq, duration, volume) {
    return () => {
      if (!this.enabled) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    };
  }

  play(sound) {
    if (this.enabled && this.sounds[sound]) {
      this.sounds[sound]();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    const btn = document.getElementById('soundBtn');
    btn.textContent = this.enabled ? '🔊 Sound' : '🔇 Sound';
  }
}