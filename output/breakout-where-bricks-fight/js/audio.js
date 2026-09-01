class AudioManager {
 constructor() {
 this.enabled = localStorage.getItem('nb_sound') !== 'off';
 this.ctx = null;
 }
 init() {
 try { this.ctx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e) {}
 }
 beep(freq, dur, type='square', vol=0.1) {
 if (!this.enabled || !this.ctx) return;
 try {
 const o = this.ctx.createOscillator();
 const g = this.ctx.createGain();
 o.type = type; o.frequency.value = freq;
 g.gain.value = vol;
 o.connect(g); g.connect(this.ctx.destination);
 o.start();
 g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
 o.stop(this.ctx.currentTime + dur);
 } catch(e) {}
 }
 hit() { this.beep(440, 0.05, 'square', 0.08); }
 break() { this.beep(880, 0.1, 'sawtooth', 0.1); }
 laser() { this.beep(220, 0.15, 'sawtooth', 0.06); }
 lose() { this.beep(110, 0.3, 'sawtooth', 0.15); }
}
