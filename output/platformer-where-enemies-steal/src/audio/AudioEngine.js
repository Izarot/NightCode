class AudioEngine {
    constructor() {
        this.ctx = null;
        this.sounds = {};
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not supported:', e);
        }
    }

    playFootstep(position) {
        if (!this.ctx) return;
        
        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 200 + Math.random() * 100;
        
        gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        oscillator.start(this.ctx.currentTime);
        oscillator.stop(this.ctx.currentTime + 0.1);
    }

    playEchoAbsorb(position) {
        if (!this.ctx) return;
        
        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, this.ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        
        oscillator.start(this.ctx.currentTime);
        oscillator.stop(this.ctx.currentTime + 0.3);
    }

    playEchoCollect() {
        if (!this.ctx) return;
        
        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, this.ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        
        oscillator.start(this.ctx.currentTime);
        oscillator.stop(this.ctx.currentTime + 0.3);
    }
}

export { AudioEngine };