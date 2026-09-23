// Audio engine using Web Audio API
export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.init();
  }

  async init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.createSounds();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  createSounds() {
    // Simple oscillator-based sound effects
    this.sounds.jump = this.createBeep(220, 0.1, 'square');
    this.sounds.dash = this.createBeep(880, 0.15, 'sawtooth');
    this.sounds.hack = this.createBeep(440, 0.3, 'sine');
    this.sounds.collect = this.createBeep(660, 0.1, 'triangle');
    this.sounds.hit = this.createBeep(110, 0.2, 'square');
  }

  createBeep(frequency, duration, type) {
    return { frequency, duration, type };
  }

  playSound(soundName) {
    if (!this.audioContext || !this.sounds[soundName]) return;
    const sound = this.sounds[soundName];
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    oscillator.frequency.value = sound.frequency;
    oscillator.type = sound.type;
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + sound.duration);
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + sound.duration);
  }
}
