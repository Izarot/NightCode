export class Audio{
  constructor(){
    this.ctx = null;
    this.music = null;
  }
  startMusic(){
    try{
      if(!this.ctx) this.ctx = new (window.AudioContext||window.webkitAudioContext)();
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.value = 55;
      g.gain.value = 0.04;
      o.connect(g); g.connect(this.ctx.destination);
      o.start();
      this.music = o;
      const lfo = this.ctx.createOscillator();
      const lg = this.ctx.createGain();
      lfo.frequency.value = 0.1;
      lg.gain.value = 10;
      lfo.connect(lg); lg.connect(o.frequency);
      lfo.start();
    }catch(e){}
  }
  play(name){
    try{
      if(!this.ctx) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.connect(g); g.connect(this.ctx.destination);
      if(name==='shoot'){ o.frequency.value=300; g.gain.value=0.05; o.type='square'; }
      else if(name==='hit'){ o.frequency.value=180; g.gain.value=0.07; o.type='sawtooth'; }
      else if(name==='death'){ o.frequency.value=80; g.gain.value=0.1; o.type='sawtooth'; }
      else if(name==='win'){ o.frequency.value=440; g.gain.value=0.08; o.type='sine'; }
      else if(name==='pickup'){ o.frequency.value=600; g.gain.value=0.05; o.type='triangle'; }
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime+0.2);
      o.start();
      o.stop(this.ctx.currentTime+0.2);
    }catch(e){}
  }
}
