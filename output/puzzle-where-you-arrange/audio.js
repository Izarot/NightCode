let audioCtx=null;
function initAudio(){
  if(!audioCtx)try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}
}
function beep(freq,dur,type,vol){
  if(!audioCtx)return;
  try{
    const o=audioCtx.createOscillator();
    const g=audioCtx.createGain();
    o.type=type||'sine';o.frequency.value=freq;
    g.gain.value=vol||0.1;
    o.connect(g);g.connect(audioCtx.destination);
    o.start();o.stop(audioCtx.currentTime+dur);
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
  }catch(e){}
}
function sndPlace(){beep(520,0.08,'square',0.08);}
function sndError(){beep(180,0.15,'sawtooth',0.08);}
function sndStar(){beep(880,0.1,'sine',0.1);setTimeout(()=>beep(1100,0.15,'sine',0.1),100);}
function sndWin(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,0.2,'sine',0.12),i*120));}
function sndClick(){beep(700,0.05,'square',0.05);}
