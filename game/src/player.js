// player.js — the thief: keyboard movement, click-to-move, and collision
// against walls and the room bounds. One job: where the thief is and how they
// get there. Detection lives in guards.js / cameras.js.

import { ROOM_W, ROOM_H } from './levels.js';

export const PLAYER_RADIUS = 13;
export const PLAYER_SPEED = 175;

export function createPlayer(x, y) {
  return {
    x, y,
    radius: PLAYER_RADIUS,
    speed: PLAYER_SPEED,
    moving: false,
    faceAngle: -Math.PI / 2,
    // click-to-move target; null when the player is steering with keys
    target: null,
    stepPhase: 0, // walk-cycle phase, for the footstep bob in render
  };
}

function circleHitsWall(x, y, radius, walls) {
  for (const w of walls) {
    const cx = Math.max(w.x, Math.min(x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(y, w.y + w.h));
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

// Move one axis at a time so the thief slides along walls instead of sticking.
export function tryMove(player, dx, dy, walls) {
  const nx = Math.max(player.radius, Math.min(ROOM_W - player.radius, player.x + dx));
  if (!circleHitsWall(nx, player.y, player.radius, walls)) player.x = nx;
  const ny = Math.max(player.radius, Math.min(ROOM_H - player.radius, player.y + dy));
  if (!circleHitsWall(player.x, ny, player.radius, walls)) player.y = ny;
}

export function updatePlayer(player, input, walls, dt) {
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;

  if (mx !== 0 || my !== 0) {
    // Keys win over a click target: steering cancels the queued walk.
    player.target = null;
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    tryMove(player, mx * player.speed * dt, my * player.speed * dt, walls);
    player.faceAngle = Math.atan2(my, mx);
    player.moving = true;
  } else if (player.target) {
    const dx = player.target.x - player.x;
    const dy = player.target.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      player.target = null;
      player.moving = false;
    } else {
      const step = Math.min(dist, player.speed * dt);
      tryMove(player, (dx / dist) * step, (dy / dist) * step, walls);
      player.faceAngle = Math.atan2(dy, dx);
      player.moving = true;
    }
  } else {
    player.moving = false;
  }

  if (player.moving) player.stepPhase += dt * 11;
}

export function setClickTarget(player, x, y) {
  player.target = { x, y };
}

// The thief is caught only when a guard's body actually reaches them —
// a cone alone never catches, it only raises suspicion. That separation is
// what makes the caught moment fair: you always see it coming.
export function guardTouchesPlayer(player, guard, catchDistance = 26) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  return dx * dx + dy * dy < catchDistance * catchDistance;
}
