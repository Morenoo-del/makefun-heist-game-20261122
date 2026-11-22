// loot.js — loot and the thief's tools. One job: what can be picked up, what
// it is worth, and what each tool costs and does. Every tool costs loot, so
// every use is a trade: spend the take to buy a safer way out.

import { TOOLS, bankLoot, spendLoot, setMessage } from './state.js';
import { disableCamera, nearestCamera } from './cameras.js';

export const PICKUP_RADIUS = 30;

export function createLoot(def) {
  return {
    x: def.x,
    y: def.y,
    kind: def.kind, // 'gem' (the main target), 'gold', 'cash'
    value: def.value,
    label: def.label,
    taken: false,
    bobPhase: Math.random() * Math.PI * 2,
  };
}

export function lootColor(item) {
  if (item.kind === 'gem') return '#7df9ff';
  if (item.kind === 'gold') return '#ffd24a';
  return '#7dff8a';
}

// Walk over a loot item to pocket it. The gem is the only one that matters for
// the exit: the door stays locked until the room's gem is taken.
export function tryPickupLoot(loot, player, state) {
  let picked = null;
  for (const item of loot) {
    if (item.taken) continue;
    const dx = player.x - item.x;
    const dy = player.y - item.y;
    if (dx * dx + dy * dy < PICKUP_RADIUS * PICKUP_RADIUS) {
      item.taken = true;
      bankLoot(state, item.value);
      picked = item;
      setMessage(state, `+${item.value} — ${item.label}`, 2);
    }
  }
  return picked;
}

export function gemTaken(loot) {
  return loot.some((item) => item.kind === 'gem' && item.taken);
}

export function useTool(state, player, guards, cameras, toolKey) {
  if (toolKey === TOOLS.NOISE.key) {
    if (!spendLoot(state, TOOLS.NOISE.cost)) {
      setMessage(state, 'Not enough loot for a noise-maker (50).', 2);
      return 'fail';
    }
    // The noise-maker lands where the thief is looking, a short throw ahead.
    const nx = player.x + Math.cos(player.faceAngle) * 90;
    const ny = player.y + Math.sin(player.faceAngle) * 90;
    state.noise = { x: nx, y: ny, timer: 5 };
    setMessage(state, 'Noise-maker thrown — guards are going to look.', 2.5);
    return 'noise';
  }
  if (toolKey === TOOLS.EMP.key) {
    if (!spendLoot(state, TOOLS.EMP.cost)) {
      setMessage(state, 'Not enough loot for an EMP pulse (100).', 2);
      return 'fail';
    }
    const cam = nearestCamera(cameras, player.x, player.y);
    if (!cam) {
      setMessage(state, 'No camera in this room to blind.', 2);
      return 'fail';
    }
    disableCamera(cam, 8);
    setMessage(state, 'EMP pulse — nearest camera blind for 8 seconds.', 2.5);
    return 'emp';
  }
  if (toolKey === TOOLS.DISGUISE.key) {
    if (!spendLoot(state, TOOLS.DISGUISE.cost)) {
      setMessage(state, 'Not enough loot for a disguise (150).', 2);
      return 'fail';
    }
    state.disguiseTimer = 6;
    setMessage(state, 'Disguise on — guards ignore you for 6 seconds.', 2.5);
    return 'disguise';
  }
  return 'none';
}

// The getaway payoff: what the run is worth so far. The gem is the headline,
// the optional loot is the margin between a clean job and a rich one.
export function runValue(loot) {
  return loot.filter((item) => item.taken).reduce((sum, item) => sum + item.value, 0);
}
