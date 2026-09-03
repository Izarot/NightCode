export class AudioMgr{
  constructor(){this.ctx=null;this.master=null;}
  ensure(){if(this.ctx)return;this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.4;this.master.connect(this.ctx.destination);}
  freq(midi){return 440*Math.pow(2,(midi-69)/12);}
  pitchClass(p){const m={'C':60,'D':62,'E':64,'F':65,'G':67,'A':69,'B':71};return m[p]||60;}
  play(p,vel=.7,len=.6){
    this.ensure();const ctx=this.ctx;const f=this.freq(this.pitchClass(p));
    const o=ctx.createOscillator();o.type='triangle';o.frequency.value=f;
    const g=ctx.createGain();g.gain.value=0;
    const now=ctx.currentTime;
    g.gain.linearRampToValueAtTime(vel,now+.01);
    g.gain.linearRampToValueAtTime(vel*.7,now+.1);
    g.gain.linearRampToValueAtTime(0,now+len);
    o.connect(g);g.connect(this.master);o.start(now);o.stop(now+len);
    const o2=ctx.createOscillator();o2.type='sine';o2.frequency.value=f*2;
    const g2=ctx.createGain();g2.gain.value=0;
    g2.gain.linearRampToValueAtTime(vel*.2,now+.01);
    g2.gain.linearRampToValueAtTime(0,now+len*.5);
    o2.connect(g2);g2.connect(this.master);o2.start(now);o2.stop(now+len);
  }
  metronomeTick(){this.ensure();const ctx=this.ctx;const o=ctx.createOscillator();o.frequency.value=1200;const g=ctx.createGain();g.gain.value=.1;g.gain.linearRampToValueAtTime(0,ctx.currentTime+.05);o.connect(g);g.connect(this.master);o.start();o.stop(ctx.currentTime+.05);}
  dissonance(){this.ensure();const ctx=this.ctx;const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=110;const g=ctx.createGain();g.gain.value=.2;g.gain.linearRampToValueAtTime(0,ctx.currentTime+.2);o.connect(g);g.connect(this.master);o.start();o.stop(ctx.currentTime+.2);}
}
