// main.js — the entrypoint: boots the canvas, owns the game loop, and wires
// every module together. Screens, level loading, win/lose and the screenshot
// hook (?shot=cover|title|win|caught) all live here.

import { LEVELS, ROOM_W, ROOM_H } from './levels.js';
import { createState, SCREENS, TOOLS, raiseAlarm, lowerAlarm, setMessage, tickMessage, catchPlayer, levelScore } from './state.js';
import { createPlayer, updatePlayer, setClickTarget, guardTouchesPlayer } from './player.js';
import { createGuard, updateGuard, CONE_RANGE } from './guards.js';
import { createCamera, updateCamera } from './cameras.js';
import { createLoot, tryPickupLoot, gemTaken, useTool } from './loot.js';
import { ensureAudio, setMuted, sfx, updateHeartbeat } from './audio.js';
import { createInput, attachInput, consumeClick, consumeKey } from './input.js';
import { fitCanvas, drawRoom, drawHUD, drawScreen } from './render.js';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
let ctx = fitCanvas(canvas);
window.addEventListener('resize', () => { ctx = fitCanvas(canvas); });

const state = createState();
const input = createInput();
const params = new URLSearchParams(window.location.search);
const shotMode = params.get('shot');
const seedParam = Number(params.get('seed') || 1);

const game = {
  state,
  level: LEVELS[0],
  levelIndex: 0,
  player: null,
  guards: [],
  cameras: [],
  loot: [],
  gemTaken: false,
  clearedGem: '',
  clearedValue: 0,
};

function loadLevel(index) {
  const def = LEVELS[index];
  game.level = def;
  game.levelIndex = index;
  game.player = createPlayer(def.start.x, def.start.y);
  game.guards = def.guards.map(createGuard);
  game.cameras = def.cameras.map(createCamera);
  game.loot = def.loot.map(createLoot);
  game.gemTaken = false;
  state.levelIndex = index;
  state.time = 0;
  state.alarm = 0;
  state.suspicion = 0;
  state.noise = null;
  state.disguiseTimer = 0;
  state.empTimer = 0;
  state.message = '';
  state.screen = SCREENS.PLAYING;
  statusEl.textContent = `${def.name}. ${def.intro}`;
}

function startRun() {
  state.loot = 0;
  state.score = 0;
  state.totalTime = 0;
  state.caughtBy = '';
  loadLevel(0);
}

function nextLevel() {
  if (game.levelIndex + 1 >= LEVELS.length) {
    state.screen = SCREENS.WIN;
    sfx.win();
    return;
  }
  loadLevel(game.levelIndex + 1);
}

function checkExit() {
  const exit = game.level.exit;
  const p = game.player;
  const inside = p.x > exit.x && p.x < exit.x + exit.w && p.y > exit.y && p.y < exit.y + exit.h;
  if (!inside) return;
  if (!game.gemTaken) {
    if (state.message === '') setMessage(state, 'The exit is locked — steal the gem first!', 1.5);
    sfx.locked();
    return;
  }
  const value = game.loot.filter((item) => item.taken).reduce((s, item) => s + item.value, 0);
  game.clearedGem = game.loot.find((item) => item.kind === 'gem').label;
  game.clearedValue = value;
  const earned = levelScore(state, value);
  state.loot = 0;
  state.totalTime += state.time;
  state.screen = SCREENS.LEVEL_CLEAR;
  sfx.win();
  statusEl.textContent = `${game.level.name} cleared, ${earned} points banked.`;
}

function update(dt) {
  state.time += dt;
  tickMessage(state, dt);
  updateHeartbeat(state.alarm, state.muted);
  if (state.noise) {
    state.noise.timer -= dt;
    if (state.noise.timer <= 0) state.noise = null;
  }

  const click = consumeClick(input);
  if (click && state.screen === SCREENS.PLAYING) {
    setClickTarget(game.player, click.x, click.y);
  }

  updatePlayer(game.player, input, game.level.walls, dt);

  const disguised = state.disguiseTimer > 0;
  let maxSeen = 0;
  for (const guard of game.guards) {
    const seen = updateGuard(guard, game.player, game.level.walls, state.noise, disguised, dt);
    maxSeen = Math.max(maxSeen, seen);
    if (seen > 0.6 && !state._spottedPlayed) {
      state._spottedPlayed = true;
      sfx.spotted();
    }
    if (seen <= 0.2) state._spottedPlayed = false;
    if (guardTouchesPlayer(game.player, guard)) {
      sfx.caught();
      catchPlayer(state, `A guard grabbed you in ${game.level.name}.`);
      return;
    }
  }
  state.suspicion = Math.max(...game.guards.map((g) => g.suspicion), 0);

  for (const cam of game.cameras) {
    const seen = updateCamera(cam, game.player, game.level.walls, dt, state.time);
    maxSeen = Math.max(maxSeen, seen);
  }

  // The alarm is the shared consequence: any watcher that sees you fills it,
  // and it drains slowly when nobody sees you.
  if (maxSeen > 0) {
    raiseAlarm(state, maxSeen * 26 * dt);
    if (state.alarm > 70 && !state._alarmPlayed) {
      state._alarmPlayed = true;
      sfx.alarm();
    }
  } else {
    lowerAlarm(state, 6 * dt);
    if (state.alarm < 60) state._alarmPlayed = false;
  }
  if (state.alarm >= 100) {
    sfx.caught();
    catchPlayer(state, 'The alarm hit 100% — the vault locked down on you.');
    return;
  }

  const picked = tryPickupLoot(game.loot, game.player, state);
  if (picked) {
    if (picked.kind === 'gem') {
      game.gemTaken = true;
      sfx.gem();
      setMessage(state, `${picked.label} secured — get to the EXIT!`, 3);
    } else {
      sfx.pickup();
    }
  }
  game.gemTaken = gemTaken(game.loot);
  checkExit();
}

function handleKeys() {
  if (consumeKey(input, 'Enter')) {
    ensureAudio(state.muted);
    if (state.screen === SCREENS.TITLE) { sfx.click(); startRun(); }
    else if (state.screen === SCREENS.LEVEL_CLEAR) { sfx.click(); nextLevel(); }
    else if (state.screen === SCREENS.WIN) { sfx.click(); startRun(); }
    else if (state.screen === SCREENS.CAUGHT) { sfx.click(); state.screen = SCREENS.TITLE; }
  }
  if (consumeKey(input, 'KeyR') && state.screen === SCREENS.CAUGHT) {
    sfx.click();
    loadLevel(game.levelIndex);
  }
  if (consumeKey(input, 'KeyP') || consumeKey(input, 'Escape')) {
    if (state.screen === SCREENS.PLAYING) { state.screen = SCREENS.PAUSED; sfx.click(); }
    else if (state.screen === SCREENS.PAUSED) { state.screen = SCREENS.PLAYING; sfx.click(); }
  }
  if (consumeKey(input, 'KeyM')) {
    state.muted = !state.muted;
    setMuted(state.muted);
    setMessage(state, state.muted ? 'Sound off.' : 'Sound on.', 1.5);
  }
  if (state.screen === SCREENS.PLAYING) {
    for (const tool of [TOOLS.NOISE, TOOLS.EMP, TOOLS.DISGUISE]) {
      if (consumeKey(input, `Digit${tool.key}`)) {
        ensureAudio(state.muted);
        const result = useTool(state, game.player, game.guards, game.cameras, tool.key);
        if (result === 'noise') sfx.noiseMaker();
        else if (result === 'emp') sfx.emp();
        else if (result === 'disguise') sfx.pickup();
        else if (result === 'fail') sfx.locked();
      }
    }
  }
}

function render(time) {
  ctx.save();
  if (state.shake > 0) {
    const mag = state.shake * 14;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }
  if (state.screen === SCREENS.TITLE) {
    drawRoom(ctx, game, time);
    drawHUD(ctx, game);
  } else {
    drawRoom(ctx, game, time);
    if (state.screen === SCREENS.PLAYING || state.screen === SCREENS.PAUSED) drawHUD(ctx, game);
  }
  drawScreen(ctx, game);
  ctx.restore();
}

// Screenshot hook: ?shot=cover stages a mid-heist frame with every required
// element visible at once; title/win/caught stage those screens. The game
// itself is still rendering — nothing here is a mock or a composite.
function applyShotMode() {
  if (!shotMode) return;
  if (shotMode === 'title') {
    loadLevel(0);
    state.screen = SCREENS.TITLE;
    return;
  }
  if (shotMode === 'cover') {
    loadLevel(0);
    state.screen = SCREENS.PLAYING;
    // Stage the thief mid-room, a guard's cone sweeping across them, a camera
    // cone overhead, the gem glowing, and the alarm half-raised.
    game.player.x = 480;
    game.player.y = 340;
    game.player.faceAngle = -Math.PI / 2;
    game.guards[0].x = 300;
    game.guards[0].y = 240;
    game.guards[0].angle = Math.PI / 3;
    game.guards[0].suspicion = 0.45;
    game.guards[1].x = 560;
    game.guards[1].y = 420;
    game.guards[1].angle = -Math.PI / 2;
    game.cameras[0].angle = Math.PI / 2 + 0.5;
    game.loot.find((item) => item.kind === 'cash').taken = true;
    state.loot = 80;
    state.alarm = 38;
    state.time = 42;
    return;
  }
  if (shotMode === 'win') {
    loadLevel(2);
    game.gemTaken = true;
    game.loot.forEach((item) => { item.taken = true; });
    state.screen = SCREENS.WIN;
    state.score = 2840;
    state.totalTime = 214;
    return;
  }
  if (shotMode === 'caught') {
    loadLevel(1);
    state.screen = SCREENS.CAUGHT;
    state.caughtBy = 'A guard grabbed you in The Vault Floor.';
    state.loot = 300;
    state.score = 420;
    state.alarm = 100;
    return;
  }
}

attachInput(canvas, input, (code) => { ensureAudio(state.muted); });
loadLevel(0);
state.screen = SCREENS.TITLE;
applyShotMode();

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  handleKeys();
  if (state.screen === SCREENS.PLAYING) update(dt);
  render(now / 1000);
  requestAnimationFrame(frame);
}

// Debug handle for play-testing (read-only state inspection from the console).
window.__velvetVault = { state, game, loadLevel, startRun };
requestAnimationFrame(frame);
