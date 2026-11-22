// state.js — the single source of truth for a run: screen, alarm, loot, tools,
// score and timers. Nothing here draws or listens; it only holds and updates
// the numbers the other modules read.

export const SCREENS = {
  TITLE: 'title',
  PLAYING: 'playing',
  PAUSED: 'paused',
  CAUGHT: 'caught',
  LEVEL_CLEAR: 'levelclear',
  WIN: 'win',
};

export const TOOLS = {
  NOISE: { key: '1', name: 'Noise-maker', cost: 50, desc: 'Throw it: guards walk to the noise.' },
  EMP: { key: '2', name: 'EMP pulse', cost: 100, desc: 'Blinds the nearest camera for 8 seconds.' },
  DISGUISE: { key: '3', name: 'Disguise', cost: 150, desc: 'Guards ignore you for 6 seconds.' },
};

export function createState() {
  return {
    screen: SCREENS.TITLE,
    levelIndex: 0,
    loot: 0,            // loot value carried this run
    score: 0,           // banked score across levels
    alarm: 0,           // 0..100 — at 100 the vault locks down and you are caught
    suspicion: 0,       // 0..1 — how close the nearest watcher is to raising the alarm
    time: 0,            // seconds spent in the current level
    totalTime: 0,
    caughtBy: '',
    message: '',
    messageTimer: 0,
    disguiseTimer: 0,
    empTimer: 0,
    noise: null,        // {x, y, timer} — a thrown noise-maker guards investigate
    shake: 0,           // screen-shake seconds left (caught moment)
    muted: false,
  };
}

// The alarm only ever moves through here, so the meter is honest.
export function raiseAlarm(state, amount) {
  state.alarm = Math.min(100, state.alarm + amount);
}

export function lowerAlarm(state, amount) {
  state.alarm = Math.max(0, state.alarm - amount);
}

export function spendLoot(state, cost) {
  if (state.loot < cost) return false;
  state.loot -= cost;
  return true;
}

export function bankLoot(state, value) {
  state.loot += value;
}

export function setMessage(state, text, seconds = 3) {
  state.message = text;
  state.messageTimer = seconds;
}

export function tickMessage(state, dt) {
  if (state.messageTimer > 0) {
    state.messageTimer -= dt;
    if (state.messageTimer <= 0) state.message = '';
  }
  if (state.disguiseTimer > 0) state.disguiseTimer -= dt;
  if (state.empTimer > 0) state.empTimer -= dt;
  if (state.shake > 0) state.shake -= dt;
}

// A fair caught moment: the alarm hits 100 only after sustained spotting, and
// a guard's touch is the only instant catch. Both paths set the same fields so
// the caught screen always knows who got you and why.
export function catchPlayer(state, who) {
  state.screen = SCREENS.CAUGHT;
  state.caughtBy = who;
  state.shake = 0.6;
}

export function levelScore(state, levelValue) {
  // Bank the loot, then pay the clock: every 10 seconds in the room costs 5.
  const timePenalty = Math.floor(state.time / 10) * 5;
  const earned = Math.max(0, levelValue - timePenalty);
  state.score += earned;
  return earned;
}
