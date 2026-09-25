export class AudioSys{ constructor(){ this.ctx=new(window.AudioContext||window.webkitAudioContext)(); this.sfx={jump:this.beep(200,0.1),collect:this.beep(400,0.1),rewind:this.beep(100,0.3)}; }
  beep(f,d){ return()=>{ const o=this.ctx.createOscillator(); const g=this.ctx.createGain(); o.type='square'; o.frequency=f; g.gain.setValueAtTime(0.2,this.ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.01,this.ctx.currentTime+d); o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime+d); }; }
  play(n){ this.sfx[n]?.(); }
}