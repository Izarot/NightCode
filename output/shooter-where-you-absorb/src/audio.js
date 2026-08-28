const Audio={ctx:null,vol:0.3,init(){if(this.ctx)return;try{this.ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}},resume(){if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();},play(type,opts={}){if(!this.ctx)return;const t=this.ctx.currentTime;const g=this.ctx.createGain();g.connect(this.ctx.destination);g.gain.value=this.vol;const o=this.ctx.createOscillator();o.connect(g);let dur=0.1;
switch(type){
case'fire':o.type='sine';o.frequency.setValueAtTime(880,t);o.frequency.exponentialRampToValueAtTime(440,t+0.05);g.gain.setValueAtTime(this.vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.06);dur=0.06;break;
case'absorb':o.type='sine';o.frequency.setValueAtTime(330,t);o.frequency.exponentialRampToValueAtTime(1320,t+0.5);g.gain.setValueAtTime(this.vol*0.6,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.6);dur=0.6;const g2=this.ctx.createGain();g2.connect(this.ctx.destination);g2.gain.setValueAtTime(this.vol*0.8,t);g2.gain.exponentialRampToValueAtTime(0.001,t+0.3);const o2=this.ctx.createOscillator();o2.type='sine';o2.frequency.setValueAtTime(80,t);o2.connect(g2);o2.start(t);o2.stop(t+0.3);break;
case'hit':o.type='sawtooth';o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(40,t+0.2);g.gain.setValueAtTime(this.vol*0.8,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.2);dur=0.2;break;
case'enemy':o.type='triangle';o.frequency.setValueAtTime(220,t);g.gain.setValueAtTime(this.vol*0.4,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.08);dur=0.08;break;
case'weave':o.type='sine';o.frequency.setValueAtTime(660,t);o.frequency.linearRampToValueAtTime(880,t+0.3);g.gain.setValueAtTime(this.vol*0.5,t);g.gain.linearRampToValueAtTime(0,t+0.3);dur=0.3;break;
case'clear':o.type='sine';o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(659,t+0.1);o.frequency.setValueAtTime(784,t+0.2);g.gain.setValueAtTime(this.vol*0.6,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.4);dur=0.4;break;
case'win':o.type='sine';o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(659,t+0.15);o.frequency.setValueAtTime(784,t+0.3);o.frequency.setValueAtTime(1047,t+0.45);g.gain.setValueAtTime(this.vol*0.7,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.7);dur=0.7;break;
case'lose':o.type='sawtooth';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(55,t+0.6);g.gain.setValueAtTime(this.vol*0.7,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.6);dur=0.6;break;
default:o.type='sine';o.frequency.setValueAtTime(440,t);g.gain.setValueAtTime(this.vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.1);dur=0.1;
}
o.start(t);o.stop(t+dur);
}};
