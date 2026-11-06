export class SoundFX{
constructor(){this.ctx=null;this.enabled=true;}
init(){if(!this.ctx){try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();}
tone(f,d,type,v,slide){if(!this.enabled||!this.ctx)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,this.ctx.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),this.ctx.currentTime+d);g.gain.setValueAtTime(v||0.12,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(0.001,this.ctx.currentTime+d);o.connect(g);g.connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+d);}
launch(c){this.tone(200+c*4,0.25,'sawtooth',0.15,600);}
land(){this.tone(120,0.12,'square',0.1,-60);}
gear(){this.tone(880,0.15,'sine',0.15,440);setTimeout(()=>this.tone(1320,0.2,'sine',0.12),80);}
death(){this.tone(300,0.5,'sawtooth',0.2,-250);}
win(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>this.tone(f,0.3,'sine',0.15),i*120);}
}
