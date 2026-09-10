export class Audio {
  constructor() {
    this.ctx = null;
    this.ambientSource = null;
    this.ambientGain = null;
    this.enabled = true;
    this.init();
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.enabled = false;
    }
  }

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(frequency, duration, type = 'sine', volume = 0.1) {
    if (!this.enabled || !this.ctx) return;
    this.ensureContext();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.stop(this.ctx.currentTime + duration);
  }

  playPaddleHit() {
    this.playTone(220, 0.1, 'square', 0.15);
    setTimeout(() => this.playTone(440, 0.05, 'square', 0.1), 20);
  }

  playBrickHit() {
    this.playTone(660, 0.08, 'triangle', 0.12);
    setTimeout(() => this.playTone(880, 0.05, 'triangle', 0.08), 30);
  }

  playBrickBreak() {
    this.playTone(880, 0.1, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(1320, 0.08, 'sawtooth', 0.1), 40);
    setTimeout(() => this.playTone(1760, 0.06, 'sawtooth', 0.08), 80);
  }

  playLifeLost() {
    this.playTone(330, 0.3, 'sine', 0.2);
    setTimeout(() => this.playTone(220, 0.4, 'sine', 0.15), 100);
    setTimeout(() => this.playTone(165, 0.5, 'sine', 0.1), 250);
  }

  playLevelUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((note, i) => {
      setTimeout(() => this.playTone(note, 0.15, 'sine', 0.12), i * 80);
    });
  }

  playAmbient() {
    if (!this.enabled || !this.ctx || this.ambientSource) return;
    this.ensureContext();
    
    // Create a subtle ambient hum
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = 'sine';
    osc.frequency.value = 55;
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    gain.gain.value = 0.02;
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    this.ambientSource = osc;
    this.ambientGain = gain;
    
    // Slow modulation
    const modulate = () => {
      if (!this.ambientSource) return;
      this.ambientSource.frequency.setTargetAtTime(
        55 + Math.sin(this.ctx.currentTime * 0.5) * 5,
        this.ctx.currentTime,
        2
      );
      requestAnimationFrame(modulate);
    };
    modulate();
  }

  stopAmbient() {
    if (this.ambientSource) {
      this.ambientSource.stop();
      this.ambientSource = null;
      this.ambientGain = null;
    }
  }

  playGameOver() {
    this.playTone(440, 0.5, 'sine', 0.2);
    setTimeout(() => this.playTone(330, 0.5, 'sine', 0.15), 200);
    setTimeout(() => this.playTone(262, 0.8, 'sine', 0.1), 450);
  }
}

// Export for potential future use
export const Utils = {
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },
  lerp(a, b, t) {
    return a + (b - a) * t;
  },
  randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }
};