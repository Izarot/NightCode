let ctx=null;
function ac(){ if(!ctx) ctx=new (window.AudioContext||window.webkitAudioContext)(); if(ctx.state==='suspended') ctx.resume(); return ctx; }
export function beep(freq=440, dur=0.1, type='sine', vol=0.2){
  try{
    const c=ac(); const o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.value=freq; g.gain.value=vol;
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+dur);
  }catch(e){}
}
export const sfx={
  jump:()=>beep(520,0.12,'square',0.15),
  pick:()=>beep(740,0.08,'triangle',0.18),
  mix:()=>{beep(440,0.1,'sine',0.18);setTimeout(()=>beep(660,0.1,'sine',0.15),50);},
  gate:()=>{beep(300,0.15,'sawtooth',0.18);setTimeout(()=>beep(500,0.2,'sawtooth',0.15),80);},
  die:()=>beep(120,0.3,'sawtooth',0.25),
  win:()=>{beep(523,0.15,'triangle',0.2);setTimeout(()=>beep(659,0.15,'triangle',0.2),120);setTimeout(()=>beep(784,0.3,'triangle',0.25),240);},
  throw:()=>beep(220,0.1,'square',0.12)
};
