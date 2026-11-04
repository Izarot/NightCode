// Web Audio API Sound Effects
class AudioManager {
  constructor() { this.audioContext = null; this.isInitialized = false; }
  init() {
    try { this.audioContext = new (window.AudioContext || window.webkitAudioContext)(); this.isInitialized = true; }
    catch (e) { console.warn('Web Audio API not available'); }
  }
  playSound(type) {
    if (!this.isInitialized) return;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
    if (type === 'correct') { oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); oscillator.type = 'sine'; }
    else if (type === 'wrong') { oscillator.frequency.setValueAtTime(146.83, this.audioContext.currentTime); oscillator.type = 'square'; }
    else { oscillator.frequency.setValueAtTime(329.63, this.audioContext.currentTime); oscillator.type = 'triangle'; }
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }
}
export const audioManager = new AudioManager();
