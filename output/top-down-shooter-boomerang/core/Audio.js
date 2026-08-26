export class Audio{
constructor(){
this.ctx=null;this.vol=0.3;
}
_ensure(){
if(!this.ctx)this.ctx=new (window.AudioContext||window.webkitAudioContext)();
if(this.ctx.state==='suspended')this.ctx.resume();
}
beep(freq,dur,type='sine'){
this._ensure();
const o=this.ctx.createOscillator(),g=this.ctx.createGain();
o.type=type;o.frequency.value=freq;
g.gain.setValueAtTime(this.vol,this.ctx.currentTime);
g.gain.exponentialRampToValueAtTime(0.001,this.ctx.currentTime+dur);
o.connect(g);g.connect(this.ctx.destination);
o.start();o.stop(this.ctx.currentTime+dur);
}
throw(){this._ensure();const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(800,this.ctx.currentTime);o.frequency.exponentialRampToValueAtTime(200,this.ctx.currentTime+0.15);g.gain.setValueAtTime(this.vol*0.5,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,this.ctx.currentTime+0.15);o.connect(g);g.connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+0.15);}
hit(){this.beep(150,0.1,'square');}
explode(){this._ensure();const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sawtooth';o.frequency.setValueAtTime(80,this.ctx.currentTime);o.frequency.exponentialRampToValueAtTime(20,this.ctx.currentTime+0.3);g.gain.setValueAtTime(this.vol,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,this.ctx.currentTime+0.3);o.connect(g);g.connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+0.3);}
dash(){this.beep(1200,0.05,'square');setTimeout(()=>this.beep(400,0.1,'sine'),50);}
}