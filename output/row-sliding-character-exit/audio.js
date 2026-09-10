const AudioSys = (() => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(ctx.destination);
  function tone(freq, dur, type='sine', vol=0.1, start=0) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(masterGain);
    o.start(ctx.currentTime + start);
    o.stop(ctx.currentTime + start + dur);
  }
  function slide(dir) { tone(220 * (dir > 0 ? 1.2 : 0.8), 0.08, 'triangle', 0.05); }
  function collision() { tone(100, 0.15, 'sawtooth', 0.1); tone(60, 0.2, 'sine', 0.08, 0.05); }
  function targetHit() { tone(523, 0.1, 'sine', 0.08); tone(659, 0.1, 'sine', 0.08, 0.05); tone(784, 0.15, 'sine', 0.1, 0.1); }
  function win() { [523,659,784,1047].forEach((f,i)=>tone(f,0.2,'sine',0.08,i*0.08)); }
  function fail() { [300,200,150,100].forEach((f,i)=>tone(f,0.3,'sine',0.08,i*0.1)); }
  function resume() { if(ctx.state==='suspended') ctx.resume(); }
  return { slide, collision, targetHit, win, fail, resume, get ctx() { return ctx; } };
})();