// Sprite batching and FPS cap
const FPS = 60;
let lastFrame = 0;
function limitFPS(timestamp) {
  if (timestamp - lastFrame < 1000 / FPS) {
    requestAnimationFrame(limitFPS);
    return;
  }
  lastFrame = timestamp;
}