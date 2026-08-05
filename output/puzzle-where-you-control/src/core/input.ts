interface InputFrame { left: boolean; right: boolean; jump: boolean; jumpReleased: boolean; dash: boolean; }

const KEY_STATE = new Map<string, boolean>();
const INPUT_BUFFER: InputFrame[] = [];
const MOVEMENT_KEYS = { left: 'ArrowLeft', a: 'KeyA', right: 'ArrowRight', d: 'KeyD', space: 'Space', shift: 'ShiftLeft' };

function handleKeyDown(e: KeyboardEvent) { KEY_STATE.set(e.key, true); }
function handleKeyUp(e: KeyboardEvent) { KEY_STATE.set(e.key, false); }

export function initInput() { window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); }

export function pollInput(): InputFrame { const frame: InputFrame = { left: false, right: false, jump: false, jumpReleased: false, dash: false }; 
  for (const [key, isDown] of KEY_STATE.entries()) { 
    switch (key) { 
      case MOVEMENT_KEYS.left: frame.left = isDown; break; 
      case MOVEMENT_KEYS.right: frame.right = isDown; break; 
      case MOVEMENT_KEYS.jump: 
        frame.jump = isDown; 
        break; 
      case MOVEMENT_KEYS.space: 
        frame.jumpReleased = !isDown; 
        break; 
      case MOVEMENT_KEYS.shift: 
        frame.dash = isDown; 
        break; 
    } 
  }
  INPUT_BUFFER.push(frame);
  return frame;
}
