export class Audio {
  constructor(){
    this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    this.masterGain=this.ctx.createGain();
    this.masterGain.gain.value=0.3;
    this.masterGain.connect(this.ctx.destination);
    this.buffers={};
    this.generateTones();
  }
  generateTones(){
    const create=(freq,type,dur,vol,slide=0)=>{const buf=this.ctx.createBuffer(1,this.ctx.sampleRate*dur,this.ctx.sampleRate);const data=buf.getChannelData(0);for(let i=0;i<data.length;i++){const t=i/this.ctx.sampleRate;const f=freq+slide*t;data[i]=Math.sin(2*Math.PI*f*t)*Math.exp(-t*3)*vol;}return buf;};
    this.buffers.shoot=create(400,'square',0.1,0.3,-200);
    this.buffers.hit=create(150,'sawtooth',0.2,0.4);
    this.buffers.enemyHit=create(300,'triangle',0.1,0.3);
    this.buffers.enemyDeath=create(100,'square',0.3,0.4);
    this.buffers.heal=create(600,'sine',0.3,0.3,200);
  }
  play(name){
    if(this.ctx.state==='suspended') this.ctx.resume();
    const buf=this.buffers[name]; if(!buf) return;
    const src=this.ctx.createBufferSource();
    src.buffer=buf;
    const gain=this.ctx.createGain();
    gain.gain.value=0.5;
    src.connect(gain).connect(this.masterGain);
    src.start();
  }
}

export function lerp(a,b,t){return a+(b-a)*t;}
export function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
export function rand(min,max){return Math.random()*(max-min)+min;}
export function randInt(min,max){return Math.floor(Math.random()*(max-min+1))+min;}