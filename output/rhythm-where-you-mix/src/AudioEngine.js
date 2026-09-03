export class AudioEngine{
  constructor(){this.ctx=null;this.start=0;}
  async init(){
    if(!this.ctx)this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    return true;
  }
  resume(){if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();}
  getBeatTime(bpm,idx){
    if(!this.ctx)return 0;
    return this.ctx.currentTime-(idx*60/bpm);
  }
  getBeatIndex(elapsed,bpm){
    return Math.floor(elapsed*bpm/60);
  }
  play(freq,vol=0.3){
    if(!this.ctx)return;
    const o=this.ctx.createOscillator();
    const g=this.ctx.createGain();
    o.frequency.value=freq;
    o.type='sine';
    g.gain.value=vol;
    g.gain.exponentialRampToValueAtTime(0.001,this.ctx.currentTime+0.15);
    o.connect(g).connect(this.ctx.destination);
    o.start();o.stop(this.ctx.currentTime+0.15);
  }
  playSuccess(){this.play(880,0.2);setTimeout(()=>this.play(1320,0.2),80);}
  playMiss(){this.play(150,0.3);}
  playPerfect(){this.play(1200,0.3);setTimeout(()=>this.play(1500,0.3),60);}
}