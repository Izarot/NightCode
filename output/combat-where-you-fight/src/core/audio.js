export class AudioSystem {
 constructor() {
  this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
 }
 
 playTone(frequency, duration = 0.1) {
  const osc = this.audioCtx.createOscillator();
  const gain = this.audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  osc.connect(gain);
  gain.connect(this.audioCtx.destination);
  gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
  osc.start();
  osc.stop(this.audioCtx.currentTime + duration);
 }
 
 playPulse() { this.playTone(200); }
 playBeam() { this.playTone(400); }
 playBurst() { this.playTone(600); }
}
