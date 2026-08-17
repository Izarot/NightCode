const Audio = (() => {
  let ctx = null;
  function ac() { if(!ctx) ctx = new (window.AudioContext||window.webkitAudioContext)(); return ctx; }
  function tone(freq, dur, type='sine', vol=0.2, slide=0) {
    try {
      const c = ac(); const o = c.createOscillator(); const g = c.createGain();
      o.type = type; o.frequency.value = freq;
      if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(20,freq+slide), c.currentTime+dur);
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime+dur);
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+dur);
    } catch(e){}
  }
  return {
    init(){ ac(); },
    flap(){ tone(420, 0.08, 'square', 0.08, 120); },
    launch(){ tone(300, 0.5, 'sine', 0.2, 400); },
    crash(){ tone(120, 0.6, 'sawtooth', 0.3, -80); },
    land(){ tone(523,0.15,'sine',0.2); setTimeout(()=>tone(659,0.15,'sine',0.2),120); setTimeout(()=>tone(784,0.3,'sine',0.2),240); },
    bonus(){ tone(880,0.1,'triangle',0.15); setTimeout(()=>tone(1175,0.15,'triangle',0.15),90); }
  };
})();