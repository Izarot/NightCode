let audioContext;

export function initAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
}
