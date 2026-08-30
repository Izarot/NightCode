export class/audioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    playSound(frequency, duration, type = 'sine') {
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
}