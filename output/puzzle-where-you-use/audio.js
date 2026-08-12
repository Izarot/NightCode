export class AudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    play(type) {
        if (this.ctx.state === 'uspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        if (type === 'click') {
            osc.type = 'ine';
            osc.frequency.setValueAtTime(440, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        }
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
}