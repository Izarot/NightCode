let audioCtx = null;
let muted = false;

export function initAudio() {
  // Audio is initialized lazily on first sound to comply with autoplay policies
}

function getCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function playSound(name) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  let freq = 440;
  let type = 'sine';
  let dur = 0.1;
  let vol = 0.05;

  if (name === 'shoot') { freq = 800; type = 'square'; dur = 0.05; vol = 0.04; }
  else if (name === 'mortar') { freq = 200; type = 'sawtooth'; dur = 0.2; vol = 0.06; }
  else if (name === 'laser') { freq = 1200; type = 'sawtooth'; dur = 0.1; vol = 0.05; }
  else if (name === 'frost') { freq = 600; type = 'triangle'; dur = 0.15; vol = 0.04; }
  else if (name === 'wave_start') { freq = 440; type = 'square'; dur = 0.3; vol = 0.06; }
  else if (name === 'wave_end') { freq = 660; type = 'sine'; dur = 0.4; vol = 0.06; }
  else if (name === 'victory') { freq = 880; type = 'sine'; dur = 0.8; vol = 0.08; }

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
  osc.start(now);
  osc.stop(now + dur);
}
