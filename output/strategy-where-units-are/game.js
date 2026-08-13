// Vibrant color palette
const colors = [
  { r: 255, g: 0, b: 0 }, // Red
  { r: 0, g: 255, b: 0 }, // Green
  { r: 0, g: 0, b: 255 }  // Blue
];

// Responsive canvas scaling
const canvas = document.getElementById('gameCanvas');
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Speedrun timer
let startTime;
const timerElement = document.getElementById('timer');
function startTimer() {
  startTime = performance.now();
  setInterval(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    timerElement.textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, 1000);
}

// High score with LocalStorage
let highScore = localStorage.getItem('highScore') || 0;
function updateHighScore(score) {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
  }
}

// Web Audio API sound effects
let audioContext;
let buffer;
function loadSound(url, callback) {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  request.onload = () => {
    audioContext.decodeAudioData(request.response, callback);
  };
  request.send();
}
function playSound() {
  if (!buffer) return;
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
}
// Example: Load and play sound on score increase
loadSound('sound.mp3', (b) => { buffer = b; playSound(); });