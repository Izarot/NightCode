export class AudioEngine {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.oscillators = {};
    }
    play(type) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain).connect(this.context.destination);
        const now = this.context.currentTime;
        switch(type) {
            case 'jump': osc.frequency.setValueAtTime(440, now); break;
            case 'split': osc.frequency.setValueAtTime(660, now); break;
            case 'merge': osc.frequency.setValueAtTime(880, now); break;
            case 'switch': osc.frequency.setValueAtTime(330, now); break;
            default: osc.frequency.setValueAtTime(220, now);
        }
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
}
