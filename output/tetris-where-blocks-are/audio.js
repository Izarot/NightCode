const AudioCtx = window.AudioContext || window.webkitAudioContext;
const actx = new AudioCtx();
let audioEnabled = false;
function enableAudio(){ if(!audioEnabled){ actx.resume(); audioEnabled=true; } }
function playTone(freq, dur, type='sine', vol=0.1, start=0){ if(!audioEnabled) return; const o=actx.createOscillator(), g=actx.createGain(); o.type=type; o.frequency.value=freq; g.gain.value=vol; o.connect(g).connect(actx.destination); const t=actx.currentTime+start; o.start(t); o.stop(t+dur); }
function playChord(freqs, dur, type='sine', vol=0.08){ freqs.forEach((f,i)=>playTone(f, dur, type, vol, i*0.05)); }
const SFX = {
  move:()=>playTone(200+Math.random()*20, 0.1, 'sine', 0.05),
  rotate:()=>playTone(800, 0.08, 'square', 0.04),
  softDrop:()=>playTone(150, 0.05, 'sine', 0.03),
  hardDrop:()=>playTone(100, 0.1, 'sine', 0.07),
  lock:()=>playTone(220, 0.1, 'sine', 0.06),
  clear1:()=>playChord([523,659,784], 0.3, 'sine', 0.08),
  clear2:()=>playChord([587,740,880], 0.3, 'sine', 0.08),
  clear3:()=>playChord([659,831,988], 0.3, 'sine', 0.08),
  clear4:()=>playChord([784,988,1175,1397], 0.5, 'sine', 0.1),
  resonance:(emo)=>{ const map={Joy:[523,659,784,1047], Sadness:[349,311,277,262], Anger:[220,233,247,262], Fear:[466,440,415,392], Disgust:[185,175,165,156], Surprise:[659,831,988,1175], Neutral:[440,440,440,440] }; playChord(map[emo]||map.Neutral, 0.4, 'triangle', 0.1); },
  tilt:()=>playTone(100, 0.5, 'sawtooth', 0.08),
  gameover:()=>{ const o=actx.createOscillator(), g=actx.createGain(), f=actx.createBiquadFilter(); o.type='sawtooth'; o.frequency.setValueAtTime(200, actx.currentTime); o.frequency.exponentialRampToValueAtTime(50, actx.currentTime+2); f.type='lowpass'; f.frequency.value=800; g.gain.setValueAtTime(0.1, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime+2); o.connect(f).connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime+2); }
};
window.Audio = { enable:enableAudio, SFX };