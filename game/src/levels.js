// levels.js — the three rooms of the Velvet Vault. One clear job: describe each
// room's walls, patrols, cameras, loot and exit so the rest of the game never
// hard-codes a layout. Coordinates are in room pixels (960 x 640).

export const ROOM_W = 960;
export const ROOM_H = 640;

// A wall is {x, y, w, h}. A patrol is a list of waypoints a guard walks between.
// A camera is {x, y, angle, sweep} — it pivots around `angle` by `sweep` radians.
// Loot is {x, y, kind, value}: 'gem' is the main target, 'cash' and 'gold' are optional.
export const LEVELS = [
  {
    name: 'The Gallery',
    intro: 'One gem, two guards, one camera. Learn the cones.',
    start: { x: 70, y: 570 },
    exit: { x: 880, y: 40, w: 56, h: 56 },
    walls: [
      { x: 200, y: 0, w: 24, h: 220 },
      { x: 200, y: 300, w: 24, h: 340 },
      { x: 420, y: 120, w: 24, h: 300 },
      { x: 420, y: 500, w: 24, h: 140 },
      { x: 640, y: 0, w: 24, h: 180 },
      { x: 640, y: 260, w: 24, h: 380 },
      { x: 300, y: 420, w: 120, h: 24 },
      { x: 520, y: 180, w: 120, h: 24 },
    ],
    guards: [
      { patrol: [{ x: 300, y: 120 }, { x: 300, y: 540 }], speed: 62 },
      { patrol: [{ x: 560, y: 520 }, { x: 560, y: 90 }], speed: 58 },
    ],
    cameras: [
      { x: 480, y: 24, angle: Math.PI / 2, sweep: 1.1, range: 240 },
    ],
    loot: [
      { x: 880, y: 560, kind: 'gem', value: 500, label: 'Star Sapphire' },
      { x: 330, y: 80, kind: 'cash', value: 80, label: 'Cash stack' },
      { x: 740, y: 560, kind: 'gold', value: 150, label: 'Gold bars' },
    ],
  },
  {
    name: 'The Vault Floor',
    intro: 'Two cameras now. The vault gem sits behind a crossfire.',
    start: { x: 70, y: 70 },
    exit: { x: 880, y: 560, w: 56, h: 56 },
    walls: [
      { x: 180, y: 100, w: 24, h: 220 },
      { x: 180, y: 400, w: 24, h: 240 },
      { x: 400, y: 0, w: 24, h: 200 },
      { x: 400, y: 280, w: 24, h: 360 },
      { x: 620, y: 120, w: 24, h: 260 },
      { x: 620, y: 460, w: 24, h: 180 },
      { x: 260, y: 320, w: 140, h: 24 },
      { x: 500, y: 120, w: 140, h: 24 },
      { x: 700, y: 400, w: 140, h: 24 },
    ],
    guards: [
      { patrol: [{ x: 300, y: 90 }, { x: 300, y: 560 }], speed: 66 },
      { patrol: [{ x: 520, y: 560 }, { x: 520, y: 80 }], speed: 62 },
      { patrol: [{ x: 740, y: 90 }, { x: 740, y: 560 }], speed: 70 },
    ],
    cameras: [
      { x: 24, y: 320, angle: 0, sweep: 1.0, range: 250 },
      { x: 936, y: 320, angle: Math.PI, sweep: 1.0, range: 250 },
    ],
    loot: [
      { x: 880, y: 90, kind: 'gem', value: 800, label: 'Emerald Eye' },
      { x: 90, y: 560, kind: 'cash', value: 100, label: 'Cash stack' },
      { x: 300, y: 300, kind: 'gold', value: 200, label: 'Gold bars' },
      { x: 760, y: 300, kind: 'cash', value: 120, label: 'Cash stack' },
    ],
  },
  {
    name: 'The Crown Room',
    intro: 'Four guards, three cameras, one crown. Plan every step.',
    start: { x: 480, y: 580 },
    exit: { x: 480, y: 24, w: 56, h: 56 },
    walls: [
      { x: 160, y: 0, w: 24, h: 200 },
      { x: 160, y: 280, w: 24, h: 360 },
      { x: 380, y: 120, w: 24, h: 260 },
      { x: 380, y: 460, w: 24, h: 180 },
      { x: 580, y: 120, w: 24, h: 260 },
      { x: 580, y: 460, w: 24, h: 180 },
      { x: 780, y: 0, w: 24, h: 200 },
      { x: 780, y: 280, w: 24, h: 360 },
      { x: 240, y: 320, w: 140, h: 24 },
      { x: 580, y: 320, w: 140, h: 24 },
    ],
    guards: [
      { patrol: [{ x: 270, y: 90 }, { x: 270, y: 560 }], speed: 72 },
      { patrol: [{ x: 480, y: 560 }, { x: 480, y: 90 }], speed: 68 },
      { patrol: [{ x: 690, y: 90 }, { x: 690, y: 560 }], speed: 72 },
      { patrol: [{ x: 880, y: 560 }, { x: 880, y: 90 }], speed: 66 },
    ],
    cameras: [
      { x: 480, y: 24, angle: Math.PI / 2, sweep: 1.2, range: 260 },
      { x: 24, y: 320, angle: 0, sweep: 1.0, range: 250 },
      { x: 936, y: 320, angle: Math.PI, sweep: 1.0, range: 250 },
    ],
    loot: [
      { x: 480, y: 90, kind: 'gem', value: 1200, label: 'The Velvet Crown' },
      { x: 90, y: 90, kind: 'gold', value: 250, label: 'Gold bars' },
      { x: 880, y: 90, kind: 'cash', value: 150, label: 'Cash stack' },
      { x: 90, y: 560, kind: 'cash', value: 150, label: 'Cash stack' },
      { x: 880, y: 560, kind: 'gold', value: 250, label: 'Gold bars' },
    ],
  },
];

// Routes: every room is built so at least two different corridors reach the
// gem — a slow, well-covered main lane and a longer, quieter back lane behind
// the wall blocks. That is what makes the patrols a puzzle instead of a wall.
export function levelCount() {
  return LEVELS.length;
}
