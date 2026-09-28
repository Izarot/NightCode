export class AudioManager{
  constructor(){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.enabled=true}
  play(sound){if(!this.enabled)return;const osc=this.ctx.createOscillator();const gain=this.ctx.createGain();osc.connect(gain);gain.connect(this.ctx.destination);const freqs={move:440,activate:660,error:110};osc.frequency.value=freqs[sound]||440;osc.type='square';gain.gain.setValueAtTime(0.1,0);gain.gain.exponentialRampToValueAtTime(0.001,0.2);osc.start();osc.stop(this.ctx.currentTime+0.2)}
}
