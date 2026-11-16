export function initInput() {
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, KeyA: false, KeyD: false, Space: false, KeyX: false, KeyK: false, KeyC: false, KeyL: false };
  const gamepadState = { connected: navigator.getGamepads ? true : false };
  let jumpBuffer = 0;
  let swapBuffer = 0;
  function update(dt: number) {
    // keyboard
    const k = navigator.keyboard;
    if (k) {
      keys.ArrowUp = k.pressed("ArrowUp");
      keys.ArrowDown = k.pressed("ArrowDown");
      keys.ArrowLeft = k.pressed("ArrowLeft");
      keys.ArrowRight = k.pressed("ArrowRight");
      keys.KeyA = k.pressed("KeyA");
      keys.KeyD = k.pressed("KeyD");
      keys.Space = k.pressed("Space");
      keys.KeyX = k.pressed("KeyX");
      keys.KeyK = k.pressed("KeyK");
      keys.KeyC = k.pressed("KeyC");
      keys.KeyL = k.pressed("KeyL");
    }
    // gamepad polling
    if (gamepadState.connected) {
      const gp = navigator.getGamepads()[0];
      if (gp) {
        // left stick
        // A button (0), X (1), Y (2), B (3)
      }
    }
    // buffer inputs
    if (keys.Space) jumpBuffer = Math.min(jumpBuffer + dt, 0.12);
    if (keys.KeyX) swapBuffer = Math.min(swapBuffer + dt, 0.10);
    if (jumpBuffer > 0) {
      // consume after buffer
      jumpBuffer -= dt;
    }
    if (swapBuffer > 0) {
      swapBuffer -= dt;
    }
  }
  return { update };
}