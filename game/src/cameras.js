// cameras.js — wall-mounted security cameras. One job: sweep a cone back and
// forth and say how clearly the camera sees the thief. A camera that spots you
// raises the alarm fast, but it can be blinded with an EMP and it never moves,
// so its sweep is a rhythm you can learn.

import { lineOfSightBlocked } from './guards.js';

export const CAMERA_RANGE = 250;
export const CAMERA_HALF_ANGLE = 0.38;

export function createCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.angle,
    sweep: def.sweep,
    range: def.range || CAMERA_RANGE,
    angle: def.angle,
    phase: Math.random() * Math.PI * 2,
    disabledTimer: 0, // EMP time left
    spotting: 0,      // 0..1, how clearly it sees the thief right now
  };
}

export function updateCamera(camera, player, walls, dt, time) {
  if (camera.disabledTimer > 0) {
    camera.disabledTimer -= dt;
    camera.spotting = 0;
    return 0;
  }
  // Smooth ping-pong sweep: sin gives a slow turn at each end of the arc,
  // which is exactly the readable rhythm a player needs.
  camera.angle = camera.baseAngle + Math.sin(time * 0.55 + camera.phase) * camera.sweep;
  const seen = cameraSeesPlayer(camera, player, walls);
  camera.spotting = seen;
  return seen;
}

export function cameraSeesPlayer(camera, player, walls) {
  if (camera.disabledTimer > 0) return 0;
  const dx = player.x - camera.x;
  const dy = player.y - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > camera.range) return 0;
  const toPlayer = Math.atan2(dy, dx);
  let diff = toPlayer - camera.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAMERA_HALF_ANGLE) return 0;
  if (lineOfSightBlocked(camera.x, camera.y, player.x, player.y, walls)) return 0;
  const centre = 1 - Math.abs(diff) / CAMERA_HALF_ANGLE;
  const near = 1 - dist / camera.range;
  return Math.min(1, 0.4 + 0.6 * centre * (0.5 + 0.5 * near));
}

export function nearestCamera(cameras, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const cam of cameras) {
    const d = Math.hypot(cam.x - x, cam.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = cam;
    }
  }
  return best;
}

// A disabled camera is a safe corridor for a few seconds — the EMP buys time,
// it does not buy silence: the alarm does not fall while a camera is blinded,
// it just stops rising from that camera.
export function disableCamera(camera, seconds) {
  camera.disabledTimer = seconds;
  camera.spotting = 0;
}
