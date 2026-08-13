export const magnet = {
  x: 0,
  y: 0,
  active: false,
  polarity: 1,
  wasActive: false,
  moves: 0
};

let isMouseDown = false;

window.addEventListener('mousedown', (e) => {
  if (e.button === 0) {
    isMouseDown = true;
    magnet.active = true;
  } else if (e.button === 2) {
    magnet.polarity *= -1;
  }
});
window.addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    isMouseDown = false;
    magnet.active = false;
  }
});
window.addEventListener('mousemove', (e) => {
  magnet.x = e.clientX;
  magnet.y = e.clientY;
});
window.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  magnet.active = true;
  magnet.x = touch.clientX;
  magnet.y = touch.clientY;
});
window.addEventListener('touchend', (e) => {
  e.preventDefault();
  magnet.active = false;
});
window.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  magnet.x = touch.clientX;
  magnet.y = touch.clientY;
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    magnet.polarity *= -1;
  }
});