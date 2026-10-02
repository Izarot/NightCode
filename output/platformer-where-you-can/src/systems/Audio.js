let ctx;
export const sfx = {};
export async function loadAudio() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = t => ctx.createOscillator();
  sfx.jump = () => play(220, 0.1, 'square');
  sfx.shrink = () => play(440, 0.2, 'sawtooth');
  sfx.collect = () => play(880, 0.1, 'sine');
}
function play(freq, dur, type) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(ctx.destination);
  o.start(); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.stop(ctx.currentTime + dur);
}
