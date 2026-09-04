export class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = true;
    }

    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled) return;
        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        oscillator.start(this.ctx.currentTime);
        oscillator.stop(this.ctx.currentTime + duration);
    }

    playPollenDrop() { this.playTone(800, 0.2, 'triangle'); }
    playCross() { this.playTone(660, 0.3, 'sine'); }
    playPerfect() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.playTone(f, 0.3), i * 100)); }
}