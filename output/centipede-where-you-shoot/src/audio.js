export class AudioManager {
 constructor() {
 this.ctx = null;
 this.sounds = {};
 this.enabled = true;
 this.initAudioContext();
 this.createSounds();
 }
 
 initAudioContext() {
 try {
 this.ctx = new (window.AudioContext || window.webkitAudioContext)();
 } catch (e) {
 console.warn('Web Audio API not supported');
 }
 }
 
 createSounds() {
 if (!this.ctx) return;
 
 this.sounds.shoot = () => this.playTone(880, 0.1, 'square', 0.1);
 this.sounds.hit = () => this.playTone(440, 0.15, 'sawtooth', 0.15);
 this.sounds.headkill = () => {
 this.playTone(660, 0.1, 'triangle', 0.2);
 setTimeout(() => this.playTone(880, 0.1, 'triangle', 0.2), 50);
 setTimeout(() => this.playTone(1320, 0.2, 'triangle', 0.2), 100);
 };
 this.sounds.gameover = () => {
 const notes = [330, 294, 262, 247];
 notes.forEach((freq, i) => setTimeout(() => this.playTone(freq, 0.3, 'sine', 0.15), i * 150));
 };
 }
 
 playTone(frequency, duration, type = 'sine', volume = 0.1) {
 if (!this.ctx || !this.enabled) return;
 
 if (this.ctx.state === 'suspended') {
 this.ctx.resume();
 }
 
 const osc = this.ctx.createOscillator();
 const gain = this.ctx.createGain();
 
 osc.type = type;
 osc.frequency.value = frequency;
 
 gain.gain.setValueAtTime(volume, this.ctx.currentTime);
 gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
 
 osc.connect(gain);
 gain.connect(this.ctx.destination);
 
 osc.start();
 osc.stop(this.ctx.currentTime + duration);
 }
 
 play(name) {
 if (this.sounds[name]) {
 this.sounds[name]();
 }
 }
 
 toggle() {
 this.enabled = !this.enabled;
 }
}