let keys = {};
let pointer = { x: 0, y: 0, down: false };

export function initInput(canvas) {
  window.addEventListener('keydown', e => keys[e.code] = true);
  window.addEventListener('keyup', e => keys[e.code] = false);
  canvas.addEventListener('pointermove', e => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = e.clientX - rect.left;
    pointer.y = e.clientY - rect.top;
  });
  canvas.addEventListener('pointerdown', () => pointer.down = true);
  canvas.addEventListener('pointerup', () => pointer.down = false);
}

export function getInput() {
  return {
    jump: keys['Space'] || pointer.down,
    pulse: keys['KeyE'],
    dash: keys['ShiftLeft'] || keys['ShiftRight'],
    left: keys['ArrowLeft'] || keys['KeyA'],
    right: keys['ArrowRight'] || keys['KeyD'],
    pause: keys['Escape']
  };
}
