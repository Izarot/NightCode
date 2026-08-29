export class AudioManager{
constructor(){this.ctx=null;this.muted=false;this.started=false;}
init(){if(this.ctx)return;this.ctx=new(window.AudioContext||window.webkitAudioContext)();}
resume(){this.init();if(this.ctx.state==='suspended')this.ctx.resume();}
tone(f,d,t,v=.1){if(this.muted)return;this.init();const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(this.ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+d);o.stop(this.ctx.currentTime+d);}
place(){this.tone(440,.05);}
smash(){this.tone(120,.15,.15);}
save(){this.tone(880,.08);setTimeout(()=>this.tone(1320,.08),60);}
start(){this.started=true;}
pause(){}
unpause(){}
win(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>this.tone(f,.15),i*100));}
lose(){this.tone(200,.4,.2);}
}
