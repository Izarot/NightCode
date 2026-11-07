// Web Audio API for sound effects
let audioCtx;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playTone(freq, duration, type = 'square') {
    if (!audioCtx) initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}
function soundCorrect() { playTone(660, 0.1); }
function soundStrike() { playTone(220, 0.3, 'sawtooth'); }
function soundWordDestroy() { playTone(880, 0.2); }
function soundWaveBreach() { playTone(440, 0.5, 'triangle'); }