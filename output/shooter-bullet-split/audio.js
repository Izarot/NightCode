export class AudioManager {
    constructor() {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.createSounds();
    }
    
    createSounds() {
        this.sounds.fire = this.createOscillator(200, 0.1, 'sawtooth');
        this.sounds.explode = this.createOscillator(100, 0.3, 'square');
        this.sounds.split = this.createOscillator(300, 0.15, 'sine');
    }
    
    createOscillator(freq, duration, type) {
        return (volume = 1) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        };
    }
    
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName](0.5);
        }
    }
}