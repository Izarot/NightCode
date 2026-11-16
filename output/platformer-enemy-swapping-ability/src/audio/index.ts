const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
function osc(type: string, freq: number, duration: number, envelope?: { attack: number; decay: number }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  if (envelope) {
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + envelope.attack);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + envelope.attack + envelope.decay);
  } else {
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  }
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration + 0.1);
}
function playSwap() {
  osc("sine", 440, 0.15, { attack: 0.02, decay: 0.1 });
  const now = ctx.currentTime;
  const osc2 = ctx.createOscillator();
  osc2.type = "sawtooth";
  osc2.frequency.value = 880;
  osc2.connect(ctx.createGain().setValueAtTime(0.1, ctx.currentTime).connect(ctx.destination));
  osc2.start(now);
  osc2.stop(now + 0.15);
}
function playChain(stack: number) {
  for (let i = 0; i < stack; i++) {
    setTimeout(() => osc("triangle", 220 * (i + 1), 0.05), i * 50);
  }
}
function playSFX(name: string) {
  switch (name) {
    case "jump": osc("sine", 523, 0.2); break;
    case "land": osc("sine", 261, 0.3); break;
    case "hurt": osc("noise", 100, 0.15); break;
    case "death": osc("sine", 110, 0.5); break;
    case "checkpoint": osc("sine", 659, 0.1, { attack: 0, decay: 0.05 }); break;
    case "shard": osc("sine", 784, 0.1); break;
    case "gate": osc("sine", 523, 0.2, { attack: 0, decay: 0.1 }); break;
    case "swap": playSwap(); break;
    case "chain": playChain(1); break;
  }
}
export { playSFX, ctx };
