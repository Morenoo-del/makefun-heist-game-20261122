// input.js — keyboard and mouse, translated into room coordinates. One job:
// tell the game what the player is asking for, and nothing else. The canvas
// scales to the window, so clicks are mapped back through its bounding rect.

import { ROOM_W, ROOM_H } from './levels.js';

export function createInput() {
  return {
    up: false, down: false, left: false, right: false,
    click: null, // {x, y} in room coordinates, consumed once by the loop
    pressedKeys: new Set(), // keys pressed this frame, consumed once
  };
}

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
};

export function attachInput(canvas, input, onKey) {
  window.addEventListener('keydown', (event) => {
    const dir = KEYMAP[event.code];
    if (dir) {
      input[dir] = true;
      event.preventDefault();
    }
    if (!event.repeat) {
      input.pressedKeys.add(event.code);
      if (onKey) onKey(event.code);
    }
  });
  window.addEventListener('keyup', (event) => {
    const dir = KEYMAP[event.code];
    if (dir) input[dir] = false;
  });
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = ROOM_W / rect.width;
    const scaleY = ROOM_H / rect.height;
    input.click = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  });
}

export function consumeClick(input) {
  const click = input.click;
  input.click = null;
  return click;
}

export function consumeKey(input, code) {
  if (input.pressedKeys.has(code)) {
    input.pressedKeys.delete(code);
    return true;
  }
  return false;
}

// Click-to-move needs the click in room space, not screen space: the canvas
// letterboxes to the window, so the mapping above is the whole trick. A click
// on a tool button or a menu is handled by the screen code before it ever
// reaches the player, so clicks never do two things at once.
export function clearKeys(input) {
  input.pressedKeys.clear();
}
