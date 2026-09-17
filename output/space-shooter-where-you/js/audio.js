export class Audio{
  constructor(){ this.ctx = null; this.master = 1; this.musicVol = 1; this.fxVol = 1; }
  
  init(){
    try{ this.ctx = new (window.AudioContext||window.webkitAudioContext)(); }
    catch(e){ this.ctx = null; }
  }
  
  play(sound){
    if(!this.ctx || !this.fxVol) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(200+sound.charCodeAt(0)*10, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.1*this.fxVol, this.ctx.currentTime);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.1);
  }
}