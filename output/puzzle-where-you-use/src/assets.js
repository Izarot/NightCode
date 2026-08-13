export function initAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (type, freq, duration) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };
  return {
    playMagnetHum: () => playSound('hum', 220, 0.1),
    playKeySlide: () => playSound('slide', 440, 0.1),
    playLockClick: () => playSound('click', 660, 0.1),
    playHazardZap: () => playSound('zap', 880, 0.05)
  };
}
export function loadAssets() {
  return Promise.resolve();
}