class AudioSystem {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.enabled = true;
    }

    playSound(type, frequency = 440, duration = 0.2, volume = 0.3) {
        if (!this.enabled) return;
        const oscillator = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        oscillator.start(this.ctx.currentTime);
        oscillator.stop(this.ctx.currentTime + duration);
    }

    playExplosion() { this.playSound('explosion', 100, 0.5, 0.5); }
    playDrop() { this.playSound('drop', 660, 0.1, 0.2); }
    playHit() { this.playSound('hit', 880, 0.1, 0.3); }
    playPowerup() { this.playSound('powerup', 1320, 0.3, 0.4); }
}