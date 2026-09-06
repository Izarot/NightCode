let ctx = null;
function getCtx() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
  return ctx;
}
export function resumeAudio() { const c = getCtx(); if (c && c.state === 'suspended') c.resume(); }
export function playNearMiss() {
  const c = getCtx(); if (!c) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.frequency.value = 1200; o.type = 'sine';
  g.gain.setValueAtTime(0.08, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
  o.connect(g).connect(c.destination);
  o.start(); o.stop(c.currentTime + 0.05);
}
export function playDeath() {
  const c = getCtx(); if (!c) return;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(800, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.8);
  g.gain.setValueAtTime(0.15, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.8);
  o.connect(g).connect(c.destination);
  o.start(); o.stop(c.currentTime + 0.8);
}
export function playMilestone() {
  const c = getCtx(); if (!c) return;
  const freqs = [523.25, 659.25, 783.99];
  freqs.forEach((f, i) => {
    const o = c.createOscillator(); const g = c.createGain();
    o.type = 'triangle'; o.frequency.value = f;
    g.gain.setValueAtTime(0.1, c.currentTime + i * 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3 + i * 0.04);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + i * 0.04); o.stop(c.currentTime + 0.3 + i * 0.04);
  });
}
