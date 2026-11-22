// guards.js — patrol guards and their vision cones. One job: where guards look,
// whether they can see the thief, and how suspicion turns into a chase.
// A cone alone never catches: it fills suspicion, suspicion raises the alarm,
// and only a guard's body touching the thief ends the run.

export const CONE_RANGE = 190;
export const CONE_HALF_ANGLE = 0.42; // ~48 degrees wide in total
export const SUSPICION_RATE = 1.1;   // per second of full view
export const SUSPICION_DECAY = 0.45;
export const CHASE_SPEED = 128;

export function createGuard(def) {
  const start = def.patrol[0];
  return {
    x: start.x,
    y: start.y,
    patrol: def.patrol,
    waypoint: 1 % def.patrol.length,
    speed: def.speed,
    angle: 0,
    // 'patrol' | 'suspicious' | 'chase' | 'investigate'
    mode: 'patrol',
    suspicion: 0,
    pauseTimer: 0,
    investigateTarget: null,
    lastSeen: null,
  };
}

export function lineOfSightBlocked(x1, y1, x2, y2, walls) {
  // Sample the segment; a wall counts as blocking if any sample lands inside it.
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + (x2 - x1) * t;
    const py = y1 + (y2 - y1) * t;
    for (const w of walls) {
      if (px > w.x && px < w.x + w.w && py > w.y && py < w.y + w.h) return true;
    }
  }
  return false;
}

// How clearly this guard sees the thief right now: 0 (not at all) to 1 (dead
// centre of the cone, close, in the open). Distance and off-centre angle both
// soften the view, so hugging the cone's edge buys time.
export function guardSeesPlayer(guard, player, walls) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CONE_RANGE) return 0;
  const toPlayer = Math.atan2(dy, dx);
  let diff = toPlayer - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CONE_HALF_ANGLE) return 0;
  if (lineOfSightBlocked(guard.x, guard.y, player.x, player.y, walls)) return 0;
  const centre = 1 - Math.abs(diff) / CONE_HALF_ANGLE;
  const near = 1 - dist / CONE_RANGE;
  return Math.min(1, 0.35 + 0.65 * centre * (0.5 + 0.5 * near));
}

function moveToward(guard, tx, ty, speed, dt, walls) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  const nx = guard.x + (dx / dist) * step;
  const ny = guard.y + (dy / dist) * step;
  let blocked = false;
  for (const w of walls) {
    if (nx > w.x - 10 && nx < w.x + w.w + 10 && ny > w.y - 10 && ny < w.y + w.h + 10) {
      blocked = true;
      break;
    }
  }
  if (!blocked) {
    guard.x = nx;
    guard.y = ny;
  }
  guard.angle = Math.atan2(dy, dx);
  return dist <= step + 2;
}

export function updateGuard(guard, player, walls, noise, disguised, dt) {
  const seen = disguised ? 0 : guardSeesPlayer(guard, player, walls);

  if (seen > 0) {
    guard.suspicion = Math.min(1, guard.suspicion + seen * SUSPICION_RATE * dt);
    guard.lastSeen = { x: player.x, y: player.y };
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - SUSPICION_DECAY * dt);
  }

  // A guard that is sure of what it saw gives chase; a half-sure guard walks
  // to the last place it saw you; a noise-maker pulls every guard to the noise.
  if (guard.suspicion >= 1) {
    guard.mode = 'chase';
  } else if (noise && guard.mode !== 'chase') {
    guard.mode = 'investigate';
    guard.investigateTarget = noise;
  } else if (guard.mode === 'investigate' && !noise) {
    guard.mode = 'patrol';
    guard.investigateTarget = null;
  } else if (guard.mode === 'chase' && guard.suspicion < 0.25) {
    guard.mode = 'patrol';
  }

  if (guard.mode === 'chase' && guard.lastSeen) {
    moveToward(guard, guard.lastSeen.x, guard.lastSeen.y, CHASE_SPEED, dt, walls);
    if (guard.suspicion < 0.5) guard.mode = 'patrol';
  } else if (guard.mode === 'investigate' && guard.investigateTarget) {
    const arrived = moveToward(guard, guard.investigateTarget.x, guard.investigateTarget.y, guard.speed * 1.15, dt, walls);
    if (arrived) {
      guard.pauseTimer = 1.6;
      guard.investigateTarget = null;
      guard.mode = 'patrol';
    }
  } else if (guard.mode === 'patrol') {
    if (guard.pauseTimer > 0) {
      guard.pauseTimer -= dt;
    } else {
      const target = guard.patrol[guard.waypoint];
      const arrived = moveToward(guard, target.x, target.y, guard.speed, dt, walls);
      if (arrived) {
        guard.waypoint = (guard.waypoint + 1) % guard.patrol.length;
        guard.pauseTimer = 0.9; // guards look around at each waypoint
      }
    }
  }

  return seen;
}

// Cone colour tells the story at a glance: calm amber while patrolling,
// orange while suspicious, red while chasing.
export function coneColor(guard) {
  if (guard.mode === 'chase') return 'rgba(255, 60, 60, 0.34)';
  if (guard.suspicion > 0.35) return 'rgba(255, 150, 40, 0.30)';
  return 'rgba(255, 210, 90, 0.20)';
}
