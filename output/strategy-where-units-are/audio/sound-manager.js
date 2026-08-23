export class SoundManager {
    constructor() {
        this.ctx = null;
        this.sounds = {};
    }
    
    async init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Audio not supported');
        }
    }
    
    play(type) {
        if (!this.ctx) return;
        
        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        switch(type) {
            case 'spawn':
                oscillator.frequency.value = 220;
                break;
            case 'split':
                oscillator.frequency.value = 440;
                break;
            case 'mutate':
                oscillator.frequency.value = 880;
                break;
            default:
                oscillator.frequency.value = 330;
        }
        
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        
        oscillator.start(this.ctx.currentTime);
        oscillator.stop(this.ctx.currentTime + 0.5);
    }
}