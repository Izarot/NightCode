export class AudioSystem {
    constructor() {
        this.context = null;
        this.sounds = {};
        this.initialized = false;
    }

    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            this.generateSounds();
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    generateSounds() {
        if (!this.initialized) return;
        
        // Jump sound
        this.sounds.jump = this.createOscillator(220, 0.1, 'sine', 0.1);
        
        // Compile sound
        this.sounds.compile = this.createOscillator(440, 0.2, 'square', 0.1);
        
        // Success sound
        this.sounds.success = this.createChord([523, 659, 784], 0.5, 0.1);
        
        // Game over sound
        this.sounds.gameover = this.createOscillator(110, 0.8, 'sawtooth', 0.3);
        
        // Garbage collect sound
        this.sounds.garbageCollect = this.createOscillator(80, 0.3, 'triangle', 0.2);
    }

    createOscillator(freq, duration, type, volume) {
        return () => {
            if (!this.context) return;
            
            const oscillator = this.context.createOscillator();
            const gainNode = this.context.createGain();
            
            oscillator.type = type;
            oscillator.frequency.value = freq;
            
            gainNode.gain.setValueAtTime(volume, this.context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.context.destination);
            
            oscillator.start();
            oscillator.stop(this.context.currentTime + duration);
        };
    }

    createChord(freqs, duration, volume) {
        return () => {
            freqs.forEach((freq, index) => {
                setTimeout(() => {
                    this.createOscillator(freq, duration, 'sine', volume)();
                }, index * 50);
            });
        };
    }

    playSound(name) {
        if (this.sounds[name] && this.initialized) {
            this.sounds[name]();
        }
    }
}