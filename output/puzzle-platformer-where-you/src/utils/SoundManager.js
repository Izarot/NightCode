export class SoundManager {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.createSounds();
    }

    createSounds() {
        this.sounds.jump = this.createOscillatorSound(200, 0.1);
        this.sounds.land = this.createOscillatorSound(150, 0.2);
        this.sounds.gravityShift = this.createOscillatorSound(300, 0.5);
        this.sounds.victory = this.createMelody([400, 500, 600], 0.2);
    }

    createOscillatorSound(freq, duration) {
        return () => {
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            oscillator.connect(gain);
            gain.connect(this.context.destination);
            oscillator.frequency.value = freq;
            gain.gain.setValueAtTime(0, this.context.currentTime);
            gain.gain.linearRampToValueAtTime(0.5, this.context.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
            oscillator.start();
            oscillator.stop(this.context.currentTime + duration);
        };
    }

    createMelody(freqs, duration) {
        return () => {
            freqs.forEach((freq, i) => {
                setTimeout(() => {
                    const oscillator = this.context.createOscillator();
                    const gain = this.context.createGain();
                    oscillator.connect(gain);
                    gain.connect(this.context.destination);
                    oscillator.frequency.value = freq;
                    gain.gain.setValueAtTime(0, this.context.currentTime);
                    gain.gain.linearRampToValueAtTime(0.3, this.context.currentTime + 0.01);
                    gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
                    oscillator.start();
                    oscillator.stop(this.context.currentTime + duration);
                }, i * 100);
            });
        };
    }

    play(name) {
        if (this.sounds[name]) {
            this.sounds[name]();
        }
    }
}
