class AudioManager{
constructor(){
this.ctx=null;
this.enabled=true;
this.initialized=false;
}
init(){
if(this.initialized)return;
try{
this.ctx=new(window.AudioContext||window.webkitAudioContext)();
this.initialized=true;
}catch(e){}
}
play(type){
if(!this.enabled||!this.ctx)return;
if(this.ctx.state==='suspended')this.ctx.resume();
const t=this.ctx.currentTime;
const o=this.ctx.createOscillator();
const g=this.ctx.createGain();
o.connect(g);g.connect(this.ctx.destination);
switch(type){
case'move':
o.type='sine';o.frequency.setValueAtTime(220,t);g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.001,t+.08);o.start(t);o.stop(t+.08);break;
case'rotate':
o.type='sine';o.frequency.setValueAtTime(440,t);o.frequency.exponentialRampToValueAtTime(660,t+.08);g.gain.setValueAtTime(.1,t);g.gain.exponentialRampToValueAtTime(.001,t+.1);o.start(t);o.stop(t+.1);break;
case'drop':
o.type='triangle';o.frequency.setValueAtTime(300,t);o.frequency.exponentialRampToValueAtTime(80,t+.15);g.gain.setValueAtTime(.15,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.start(t);o.stop(t+.2);break;
case'clear':
o.type='square';o.frequency.setValueAtTime(523,t);g.gain.setValueAtTime(.1,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.start(t);o.stop(t+.3);
const o2=this.ctx.createOscillator();const g2=this.ctx.createGain();
o2.connect(g2);g2.connect(this.ctx.destination);o2.type='square';o2.frequency.setValueAtTime(659,t+.08);g2.gain.setValueAtTime(.1,t+.08);g2.gain.exponentialRampToValueAtTime(.001,t+.35);o2.start(t+.08);o2.stop(t+.35);
break;
case'riser':
o.type='sawtooth';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(400,t+.2);g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.start(t);o.stop(t+.25);break;
case'gameover':
o.type='sawtooth';o.frequency.setValueAtTime(400,t);o.frequency.exponentialRampToValueAtTime(60,t+.8);g.gain.setValueAtTime(.15,t);g.gain.exponentialRampToValueAtTime(.001,t+1);o.start(t);o.stop(t+1);break;
case'hold':
o.type='sine';o.frequency.setValueAtTime(330,t);o.frequency.setValueAtTime(440,t+.05);g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);o.start(t);o.stop(t+.12);break;
case'levelup':
o.type='sine';o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(659,t+.1);o.frequency.setValueAtTime(784,t+.2);g.gain.setValueAtTime(.1,t);g.gain.exponentialRampToValueAtTime(.001,t+.4);o.start(t);o.stop(t+.4);break;
}
}
toggle(){
this.enabled=!this.enabled;
return this.enabled;
}
}
const audio=new AudioManager();