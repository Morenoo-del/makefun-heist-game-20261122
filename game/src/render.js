// render.js — everything the player sees, drawn on one canvas. One job:
// make safe cover, danger and loot obvious at a glance. Cones are amber when
// calm and red when hunting; loot glows; the alarm meter is always on screen.

import { ROOM_W, ROOM_H } from './levels.js';
import { SCREENS, TOOLS } from './state.js';
import { coneColor } from './guards.js';
import { lootColor } from './loot.js';

export function fitCanvas(canvas) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = window.innerWidth;
  const h = window.innerHeight;
  const scale = Math.min(w / ROOM_W, h / ROOM_H);
  canvas.width = Math.floor(ROOM_W * scale * dpr);
  canvas.height = Math.floor(ROOM_H * scale * dpr);
  canvas.style.width = `${Math.floor(ROOM_W * scale)}px`;
  canvas.style.height = `${Math.floor(ROOM_H * scale)}px`;
  const ctx = canvas.getContext('2d');
  ctx.setTransform((canvas.width / ROOM_W), 0, 0, (canvas.height / ROOM_H), 0, 0);
  return ctx;
}

function drawCone(ctx, x, y, angle, halfAngle, range, color) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawFloor(ctx) {
  ctx.fillStyle = '#171527';
  ctx.fillRect(0, 0, ROOM_W, ROOM_H);
  // Checker carpet: dark velvet squares so movement reads at a glance.
  ctx.fillStyle = '#1d1a33';
  const size = 40;
  for (let y = 0; y < ROOM_H / size; y++) {
    for (let x = 0; x < ROOM_W / size; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * size, y * size, size, size);
    }
  }
  // A gold runner down the middle of the room, the thief's highway.
  ctx.fillStyle = 'rgba(255, 210, 74, 0.06)';
  ctx.fillRect(0, ROOM_H / 2 - 30, ROOM_W, 60);
}

function drawWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = '#2e2a4a';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#4a4480';
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
    ctx.fillStyle = '#3a3560';
    ctx.fillRect(w.x, w.y, w.w, 4);
  }
}

function drawExit(ctx, exit, gemTakenFlag) {
  const open = gemTakenFlag;
  ctx.fillStyle = open ? '#1f7a4d' : '#3d2b2b';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = open ? '#4dff88' : '#8a6a5a';
  ctx.lineWidth = 3;
  ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = open ? '#b6ffd0' : '#c9a89a';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', exit.x + exit.w / 2, exit.y + exit.h / 2 + 5);
  if (open) {
    ctx.fillStyle = 'rgba(77, 255, 136, 0.15)';
    ctx.fillRect(exit.x - 6, exit.y - 6, exit.w + 12, exit.h + 12);
  }
}

function drawLoot(ctx, loot, time) {
  for (const item of loot) {
    if (item.taken) continue;
    const bob = Math.sin(time * 2 + item.bobPhase) * 3;
    const color = lootColor(item);
    // Glow ring so loot is visible across the room.
    ctx.beginPath();
    ctx.arc(item.x, item.y + bob, item.kind === 'gem' ? 26 : 20, 0, Math.PI * 2);
    ctx.fillStyle = item.kind === 'gem' ? 'rgba(125, 249, 255, 0.16)' : 'rgba(255, 210, 74, 0.12)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(item.x, item.y + bob, item.kind === 'gem' ? 11 : 8, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#0b0a12';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (item.kind === 'gem') {
      // A diamond facet, not a circle: the main target must read as precious.
      ctx.beginPath();
      ctx.moveTo(item.x, item.y + bob - 12);
      ctx.lineTo(item.x + 9, item.y + bob);
      ctx.lineTo(item.x, item.y + bob + 12);
      ctx.lineTo(item.x - 9, item.y + bob);
      ctx.closePath();
      ctx.fillStyle = '#b8fbff';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.fillStyle = '#e8e4ff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.label, item.x, item.y + bob + 30);
  }
}

function drawGuards(ctx, guards) {
  for (const guard of guards) {
    drawCone(ctx, guard.x, guard.y, guard.angle, 0.42, 190, coneColor(guard));
  }
  for (const guard of guards) {
    // Body: a dark uniform with a cap brim pointing where the guard looks.
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 13, 0, Math.PI * 2);
    ctx.fillStyle = guard.mode === 'chase' ? '#a12727' : '#2b3a6b';
    ctx.fill();
    ctx.strokeStyle = '#d8d4ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * 20, guard.y + Math.sin(guard.angle) * 20);
    ctx.strokeStyle = '#d8d4ff';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Suspicion bar above the guard's head.
    if (guard.suspicion > 0.05) {
      ctx.fillStyle = '#111';
      ctx.fillRect(guard.x - 14, guard.y - 26, 28, 5);
      ctx.fillStyle = guard.suspicion > 0.7 ? '#ff4444' : '#ffaa33';
      ctx.fillRect(guard.x - 13, guard.y - 25, 26 * guard.suspicion, 3);
    }
    if (guard.mode === 'chase') {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 30);
    }
  }
}

function drawCameras(ctx, cameras) {
  for (const cam of cameras) {
    const disabled = cam.disabledTimer > 0;
    const color = disabled ? 'rgba(120, 120, 120, 0.12)'
      : cam.spotting > 0.4 ? 'rgba(255, 60, 60, 0.34)' : 'rgba(255, 80, 80, 0.20)';
    drawCone(ctx, cam.x, cam.y, cam.angle, 0.38, cam.range, color);
  }
  for (const cam of cameras) {
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = cam.disabledTimer > 0 ? '#555' : '#c22';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.lineTo(cam.x + Math.cos(cam.angle) * 16, cam.y + Math.sin(cam.angle) * 16);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (cam.disabledTimer > 0) {
      ctx.fillStyle = '#ccc';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.ceil(cam.disabledTimer)}s`, cam.x, cam.y - 16);
    }
  }
}

function drawPlayer(ctx, player, disguised) {
  const bob = player.moving ? Math.sin(player.stepPhase) * 1.5 : 0;
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, 13, 0, Math.PI * 2);
  ctx.fillStyle = disguised ? '#3a6b4a' : '#1c1a2e';
  ctx.fill();
  ctx.strokeStyle = disguised ? '#7dff8a' : '#ffd24a';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // The thief's mask: a gold band across the face, pointing where they look.
  ctx.beginPath();
  ctx.moveTo(player.x + Math.cos(player.faceAngle - 0.5) * 11, player.y + Math.sin(player.faceAngle - 0.5) * 11);
  ctx.lineTo(player.x + Math.cos(player.faceAngle) * 15, player.y + Math.sin(player.faceAngle) * 15);
  ctx.lineTo(player.x + Math.cos(player.faceAngle + 0.5) * 11, player.y + Math.sin(player.faceAngle + 0.5) * 11);
  ctx.strokeStyle = '#ffd24a';
  ctx.lineWidth = 3;
  ctx.stroke();
  if (disguised) {
    ctx.fillStyle = '#7dff8a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DISGUISED', player.x, player.y - 22);
  }
}

function drawNoise(ctx, noise) {
  if (!noise) return;
  const pulse = 1 + 0.3 * Math.sin(noise.timer * 10);
  ctx.beginPath();
  ctx.arc(noise.x, noise.y, 12 * pulse, 0, Math.PI * 2);
  ctx.fillStyle = '#ff9f1c';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('♪', noise.x, noise.y + 4);
}

export function drawRoom(ctx, game, time) {
  const { level, player, guards, cameras, loot, state } = game;
  drawFloor(ctx);
  drawExit(ctx, level.exit, game.gemTaken);
  drawLoot(ctx, loot, time);
  drawNoise(ctx, state.noise);
  drawCameras(ctx, cameras);
  drawGuards(ctx, guards);
  drawPlayer(ctx, player, state.disguiseTimer > 0);
}

export function drawHUD(ctx, game) {
  const { state, level } = game;
  // Top bar: room name, loot carried, score, clock.
  ctx.fillStyle = 'rgba(8, 7, 16, 0.85)';
  ctx.fillRect(0, 0, ROOM_W, 44);
  ctx.fillStyle = '#e8e4ff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`VELVET VAULT — ${level.name}`, 14, 28);
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Loot $${state.loot}   Score ${state.score}   ${Math.floor(state.time)}s`, ROOM_W - 14, 28);

  // The alarm meter: always visible, always honest. Green to amber to red.
  const mw = 300;
  const mx = ROOM_W / 2 - mw / 2;
  const my = 54;
  ctx.fillStyle = 'rgba(8, 7, 16, 0.85)';
  ctx.fillRect(mx - 8, my - 6, mw + 16, 26);
  ctx.fillStyle = '#222';
  ctx.fillRect(mx, my, mw, 14);
  const alarmColor = state.alarm > 70 ? '#ff4444' : state.alarm > 40 ? '#ffaa33' : '#4dff88';
  ctx.fillStyle = alarmColor;
  ctx.fillRect(mx, my, (mw * state.alarm) / 100, 14);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx, my, mw, 14);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ALARM ${Math.floor(state.alarm)}%`, ROOM_W / 2, my + 11);
  if (state.alarm > 70) {
    ctx.fillStyle = state.alarm > 85 ? '#ff4444' : '#ffaa33';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('LOCKDOWN IMMINENT — BREAK LINE OF SIGHT', ROOM_W / 2, my + 34);
  }

  // Tools, bottom bar: what each costs and which key fires it.
  ctx.fillStyle = 'rgba(8, 7, 16, 0.85)';
  ctx.fillRect(0, ROOM_H - 40, ROOM_W, 40);
  ctx.fillStyle = '#e8e4ff';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  const tools = [TOOLS.NOISE, TOOLS.EMP, TOOLS.DISGUISE];
  let tx = 14;
  for (const tool of tools) {
    const afford = state.loot >= tool.cost;
    ctx.fillStyle = afford ? '#ffd24a' : '#777';
    ctx.fillText(`[${tool.key}] ${tool.name} $${tool.cost}`, tx, ROOM_H - 15);
    tx += 210;
  }
  ctx.fillStyle = '#aaa';
  ctx.textAlign = 'right';
  ctx.fillText('WASD / arrows move · click to walk · P pause · M mute', ROOM_W - 14, ROOM_H - 15);

  if (state.message) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, ROOM_W / 2, ROOM_H - 56);
  }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6, 5, 12, 0.78)';
  ctx.fillRect(0, 0, ROOM_W, ROOM_H);
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, ROOM_W / 2, 220);
  ctx.fillStyle = '#e8e4ff';
  ctx.font = '18px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, ROOM_W / 2, 270 + i * 30));
}

export function drawScreen(ctx, game) {
  const { state, level } = game;
  if (state.screen === SCREENS.TITLE) {
    overlay(ctx, 'VELVET VAULT', [
      'The Midnight Heist — steal the gem, dodge the cones, slip out the exit.',
      `${level.name}: ${level.intro}`,
      'Move: WASD / arrows or click · Tools: 1 noise-maker $50 · 2 EMP $100 · 3 disguise $150',
      'Guards and cameras raise the ALARM. At 100% the vault locks down.',
      'Press ENTER or click to begin the heist.',
    ], '#ffd24a');
    return true;
  }
  if (state.screen === SCREENS.PAUSED) {
    overlay(ctx, 'PAUSED', ['The vault waits. Press P to keep stealing.', 'M toggles sound.'], '#e8e4ff');
    return true;
  }
  if (state.screen === SCREENS.CAUGHT) {
    overlay(ctx, 'CAUGHT!', [
      `${state.caughtBy}`,
      `Loot carried: $${state.loot}   Score: ${state.score}`,
      'Press R to try this room again, or ENTER for the title screen.',
    ], '#ff4444');
    return true;
  }
  if (state.screen === SCREENS.LEVEL_CLEAR) {
    overlay(ctx, 'CLEAN GETAWAY', [
      `${level.name} cleared — the ${game.clearedGem} is yours.`,
      `Room take: $${game.clearedValue}   Score: ${state.score}`,
      'Press ENTER for the next room.',
    ], '#4dff88');
    return true;
  }
  if (state.screen === SCREENS.WIN) {
    overlay(ctx, 'THE VAULT IS YOURS', [
      'Three rooms, three treasures, one clean getaway.',
      `Final score: ${state.score}   Total time: ${Math.floor(state.totalTime)}s`,
      'Press ENTER to play again.',
    ], '#ffd24a');
    return true;
  }
  return false;
}
