// Keyboard and mouse for Midnight Vault. Movement keys are read every frame; tool keys
// (smoke, EMP) and the confirm/pause keys are one-shot actions, taken once per press.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;

const MOVE_KEYS = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};

export function createInput(canvas) {
  const held = new Set();
  let actions = 0;
  let smokePressed = false;
  let empPressed = false;

  function onKeyDown(event) {
    if (event.repeat) return;
    if (MOVE_KEYS[event.code]) {
      held.add(event.code);
      event.preventDefault();
      return;
    }
    if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyM') {
      actions |= ACTION_MUTE;
    } else if (event.code === 'Digit1' || event.code === 'KeyQ') {
      smokePressed = true;
    } else if (event.code === 'Digit2' || event.code === 'KeyE') {
      empPressed = true;
    } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      held.add(event.code);
    }
  }

  function onKeyUp(event) {
    held.delete(event.code);
  }

  function onMouseDown(event) {
    // A click anywhere counts as confirm on the menu screens.
    actions |= ACTION_CONFIRM;
    event.preventDefault();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);

  /** The movement vector and one-shot tool presses for this frame. */
  function takeFrame() {
    let x = 0;
    let y = 0;
    for (const code of held) {
      const move = MOVE_KEYS[code];
      if (move) {
        x += move[0];
        y += move[1];
      }
    }
    const length = Math.hypot(x, y) || 1;
    const frame = {
      x: x / length,
      y: y / length,
      sneak: held.has('ShiftLeft') || held.has('ShiftRight'),
      smoke: smokePressed,
      emp: empPressed,
    };
    smokePressed = false;
    empPressed = false;
    return frame;
  }

  function takeActions() {
    const taken = actions;
    actions = 0;
    return taken;
  }

  return { takeFrame, takeActions };
}
